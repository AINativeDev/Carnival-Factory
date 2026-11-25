/**
 * Checks one Advent challenge issue and prints what the script decides as
 * JSON, for the assess-advent-challenge skill: the day's challenge, and the
 * linked pull request's or issue's title and text for the skill to weigh. It
 * reads the issue and the linked repository through the GitHub API, and never
 * clones or runs anything.
 *
 * Run with GITHUB_TOKEN (or GH_TOKEN), GITHUB_REPOSITORY and ISSUE_NUMBER set.
 */
import { readFileSync } from 'node:fs';
import { cleanCalendar } from '../src/northpole/advent.ts';
import {
  ADVENT_FIELDS,
  adventDayOptions,
  adventFreeText,
  decideAdvent,
  parseAdventLink,
  type AdventFacts,
} from './advent.ts';
import { formField } from './elf-engineer.ts';
import { exists, get, repoPath } from './github-api.ts';
import { scanParticipantText } from './injection-scan.ts';

const repository = process.env.GITHUB_REPOSITORY;
const number = process.env.ISSUE_NUMBER;
if (!repository || !number || !/^\d+$/.test(number)) {
  throw new Error('Set GITHUB_REPOSITORY and ISSUE_NUMBER');
}

const calendar = cleanCalendar(
  JSON.parse(readFileSync(new URL('../carnival/challenges/advent.json', import.meta.url), 'utf8')),
);

const issue = await get<{
  user: { login: string };
  title: string;
  body: string | null;
  created_at: string;
}>(`${repoPath(repository)}/issues/${number}`);
if (!issue) throw new Error(`Issue ${number} not found`);

const body = issue.body ?? '';
const facts: AdventFacts = {
  author: issue.user.login,
  dayField: formField(body, ADVENT_FIELDS.day),
  linkField: formField(body, ADVENT_FIELDS.link),
  flaggedText:
    scanParticipantText(adventFreeText(issue.title, body, adventDayOptions(calendar))).length > 0,
  openedAt: new Date(issue.created_at),
  year: calendar.year,
};

const link = parseAdventLink(facts.linkField);
const repo = link
  ? await get<{ full_name: string; private: boolean; owner: { login: string; type: string } }>(
      repoPath(link.repo),
    )
  : undefined;
/** The linked item's own words, for the skill to weigh against the challenge, and never acted on. */
let linked: { title: string; body: string; merged?: boolean; state: string } | undefined;
// A private repository is left out, as if GitHub couldn't find it.
if (link && repo && !repo.private) {
  const owner = repo.owner.login;
  facts.repo = { fullName: repo.full_name, owner };
  facts.authorIsMember =
    repo.owner.type === 'Organization' &&
    (await exists(
      `orgs/${encodeURIComponent(owner)}/public_members/${encodeURIComponent(facts.author)}`,
    ));
  // The issues endpoint answers for pull requests too, and says which it is.
  const item = await get<{
    number: number;
    title: string;
    body: string | null;
    state: string;
    user: { login: string };
    pull_request?: { merged_at: string | null };
  }>(`${repoPath(repo.full_name)}/issues/${link.number}`);
  if (item) {
    facts.item = {
      kind: item.pull_request ? 'pull' : 'issue',
      number: item.number,
      author: item.user.login,
    };
    linked = {
      title: item.title.slice(0, 200),
      body: (item.body ?? '').slice(0, 2000),
      state: item.state,
      ...(item.pull_request ? { merged: item.pull_request.merged_at !== null } : {}),
    };
  }
}

const decision = decideAdvent(facts);
const challenge = decision.check
  ? calendar.challenges.find((entry) => entry.day === decision.day)
  : undefined;
console.log(JSON.stringify({ decision, challenge, linked, facts }, null, 2));
