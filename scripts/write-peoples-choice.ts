/**
 * Writes the People's Choice standings (scripts/peoples-choice.ts) to the file
 * named by its argument, for the build to bake into the page
 * (PEOPLES_CHOICE_FILE in vite.config.ts).
 *
 * It finds the ballot, the issue a maintainer opened with the title in
 * BALLOT_TITLE (docs/adr/0030-peoples-choice-on-an-issue.md), adds a comment for
 * every booth and Elf Engineer's factory that has none yet, while voting is
 * open, and reads every comment's 👍. The page never reaches the network.
 * Without the ballot it writes nothing, and the map shows no standings.
 *
 * Run by "Deploy to GitHub Pages", which only runs main's own code, with
 * GITHUB_TOKEN and GITHUB_REPOSITORY set. The badge holders come from
 * BADGE_HOLDERS_FILE, which scripts/badge-holders.ts writes first.
 */
import { safePath } from './safe-path.ts';
import { existsSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { cleanHolders } from '../src/northpole/badges.ts';
import { BALLOT_TITLE, VOTING_CLOSES, votingClosed } from '../src/northpole/peoples-choice.ts';
import { get } from './github-api.ts';
import { MAINTAINERS } from './ownership.ts';
import { addBallotComment, findBallot, readBallotComments } from './ballot.ts';
import { entryBody, missingEntries, standings } from './peoples-choice.ts';
import { siteUrl } from './share-pages.ts';

/* v8 ignore start -- the deploy's entry point: its logic is in ballot.ts and peoples-choice.ts */
const token = process.env.GITHUB_TOKEN;
const repository = process.env.GITHUB_REPOSITORY;
const out = process.argv[2];
if (!token || !repository || !out) {
  throw new Error('Set GITHUB_TOKEN and GITHUB_REPOSITORY, and name the file to write');
}
const [owner = '', name = ''] = repository.split('/');
const api = process.env.GITHUB_API_URL ?? 'https://api.github.com';

async function graphql<T>(query: string, variables: Record<string, unknown>): Promise<T> {
  const response = await fetch(`${api}/graphql`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, Accept: 'application/vnd.github+json' },
    body: JSON.stringify({ query, variables }),
  });
  if (!response.ok) throw new Error(`GraphQL answered HTTP ${response.status}`);
  const result = (await response.json()) as { data?: T; errors?: { message: string }[] };
  // Any error, even beside some data, means the read or the write is incomplete.
  if (!result.data || result.errors?.length) {
    throw new Error(`GraphQL failed: ${result.errors?.[0]?.message ?? 'no data'}`);
  }
  return result.data;
}

const maintainers = new Set(MAINTAINERS.map((maintainer) => maintainer.id));
const ballot = await findBallot(graphql, owner, name, maintainers, BALLOT_TITLE);
if (!ballot) {
  console.log(`No "${BALLOT_TITLE}" issue opened by a maintainer: no standings.`);
  process.exit(0);
}

const root = join(import.meta.dirname, '..');
const booths = readdirSync(join(root, 'carnival', 'booths')).filter((id) =>
  existsSync(join(root, 'carnival', 'booths', id, 'booth.ts')),
);
const holdersFile = process.env.BADGE_HOLDERS_FILE;
const holders =
  holdersFile && existsSync(holdersFile)
    ? cleanHolders(JSON.parse(readFileSync(holdersFile, 'utf8')))
    : [];
const disabled = (
  JSON.parse(readFileSync(join(root, 'src/northpole/disabled.json'), 'utf8')) as {
    booths: string[];
  }
).booths;

let comments = await readBallotComments(graphql, ballot.id);

// A comment for every new entry, while voting is open, with its owner's user id
// in the marker, so their own vote stays out even if the login changes hands.
const missing = votingClosed(new Date()) ? [] : missingEntries({ booths, holders }, comments);
let added = 0;
for (const entry of missing) {
  const user = await get<{ id: number }>(`users/${encodeURIComponent(entry.login)}`);
  if (!user) {
    console.log(`No GitHub account is ${entry.login} now: no entry for it yet.`);
    continue;
  }
  await addBallotComment(
    graphql,
    ballot.id,
    entryBody(entry.category, entry.login, user.id, entry.repo, siteUrl(process.env)),
  );
  added += 1;
}
if (added) comments = await readBallotComments(graphql, ballot.id);

const result = standings({
  ballot: ballot.url,
  comments,
  booths,
  holders,
  disabled,
  closes: VOTING_CLOSES,
});
writeFileSync(safePath(out), JSON.stringify(result, null, 2) + '\n');
console.log(
  `Wrote ${out}: ${result.booths.length} booths and ${result.factories.length} home factories, ${added} new entries.`,
);
/* v8 ignore stop */
