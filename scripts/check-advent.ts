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
import { cleanCalendar, type AdventCalendar } from '../src/northpole/advent.ts';
import {
  ADVENT_FIELDS,
  adventDayOptions,
  adventFreeText,
  decideAdvent,
  parseAdventLink,
  type AdventFacts,
} from './advent.ts';
import { formField } from './issue-form.ts';
import { github, repoPath, type GitHubReader } from './github-api.ts';
import { scanParticipantText } from './injection-scan.ts';

interface Repository {
  full_name: string;
  private: boolean;
  owner: { login: string; type: string };
}

interface LinkedItem {
  number: number;
  title: string;
  body: string | null;
  state: string;
  user: { login: string };
  pull_request?: { merged_at: string | null };
}

/** The linked item's own words, for the skill to weigh against the challenge, and never acted on. */
interface Linked {
  title: string;
  body: string;
  merged?: boolean;
  state: string;
}

/** Fills in the facts about the linked repository and item, and gives the item's own words. */
async function readLink(
  reader: GitHubReader,
  facts: AdventFacts,
  repo: Repository,
  number: number,
): Promise<Linked | undefined> {
  const owner = repo.owner.login;
  facts.repo = { fullName: repo.full_name, owner };
  facts.authorIsMember =
    repo.owner.type === 'Organization' &&
    (await reader.exists(
      `orgs/${encodeURIComponent(owner)}/public_members/${encodeURIComponent(facts.author)}`,
    ));
  // The issues endpoint answers for pull requests too, and says which it is.
  const item = await reader.get<LinkedItem>(`${repoPath(repo.full_name)}/issues/${number}`);
  if (!item) return undefined;
  facts.item = {
    kind: item.pull_request ? 'pull' : 'issue',
    number: item.number,
    author: item.user.login,
  };
  return {
    title: item.title.slice(0, 200),
    body: (item.body ?? '').slice(0, 2000),
    state: item.state,
    ...(item.pull_request ? { merged: item.pull_request.merged_at !== null } : {}),
  };
}

/** What the script decides about Advent challenge issue `number`, with what it read to decide. */
export async function checkAdvent(
  reader: GitHubReader,
  repository: string,
  number: string,
  calendar: AdventCalendar,
) {
  const issue = await reader.get<{
    user: { login: string };
    title: string;
    body: string | null;
    created_at: string;
  }>(`${repoPath(repository)}/issues/${number}`);
  if (!issue) throw new Error(`Issue ${number} not found`);

  // Stryker disable next-line StringLiteral: any plain stand-in for no body names no field and says nothing to an agent.
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
  const repo = link && (await reader.get<Repository>(repoPath(link.repo)));
  // A private repository is left out, as if GitHub couldn't find it.
  const linked =
    link && repo && !repo.private ? await readLink(reader, facts, repo, link.number) : undefined;

  const decision = decideAdvent(facts);
  const challenge = decision.check
    ? calendar.challenges.find((entry) => entry.day === decision.day)
    : undefined;
  return { decision, challenge, linked, facts };
}

/* v8 ignore start -- the skill's entry point: reading the environment, then printing */
if (process.argv[1]?.endsWith('check-advent.ts')) {
  const repository = process.env.GITHUB_REPOSITORY;
  const number = process.env.ISSUE_NUMBER;
  if (!repository || !number || !/^\d+$/.test(number)) {
    throw new Error('Set GITHUB_REPOSITORY and ISSUE_NUMBER');
  }
  const calendar = cleanCalendar(
    JSON.parse(
      readFileSync(new URL('../carnival/challenges/advent.json', import.meta.url), 'utf8'),
    ),
  );
  console.log(JSON.stringify(await checkAdvent(github, repository, number, calendar), null, 2));
}
/* v8 ignore stop */
