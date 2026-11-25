/**
 * Writes how many advent challenges each participant has had accepted to the
 * file named by its argument, for the build to bake into the page
 * (ADVENT_FILE in vite.config.ts). It reads the accepted Advent challenge
 * issues, labelled `advent-done` and `accepted`, and the repository's comments
 * since the calendar's first door could open, through the GitHub API: a
 * hundred comments a request, so the requests grow with the comments, not
 * with one more for every accepted day.
 *
 * Run by .github/workflows/pages.yml with GITHUB_TOKEN and GITHUB_REPOSITORY set.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { cleanCalendar } from '../northpole/advent.ts';
import { adventCounts, type AdventRecord } from './advent.ts';
import { getAll, repoPath } from './github-api.ts';

const repository = process.env.GITHUB_REPOSITORY;
const out = process.argv[2];
if (!repository || !out) throw new Error('Set GITHUB_REPOSITORY, and name the file to write');

const { year } = cleanCalendar(
  JSON.parse(readFileSync(new URL('../carnival/challenges/advent.json', import.meta.url), 'utf8')),
);
// The first door opens at midnight on 1 December somewhere, which is 30 November in UTC.
const since = `${String(year).padStart(4, '0')}-11-30T00:00:00Z`;

const issues = await getAll<AdventRecord['issue'] & { pull_request?: unknown }>(
  `${repoPath(repository)}/issues?labels=advent-done,accepted&state=all`,
);
const comments = await getAll<AdventRecord['comments'][number] & { issue_url: string }>(
  `${repoPath(repository)}/issues/comments?since=${since}&sort=created&direction=asc`,
);
const byIssue = new Map<number, AdventRecord['comments']>();
for (const comment of comments) {
  const number = Number(comment.issue_url.match(/\/issues\/(\d+)$/)?.[1]);
  if (!number) continue;
  if (!byIssue.has(number)) byIssue.set(number, []);
  byIssue.get(number)!.push(comment);
}
const records: AdventRecord[] = issues
  .filter((issue) => !issue.pull_request)
  .map((issue) => ({ issue, comments: byIssue.get(issue.number) ?? [] }));

const counts = adventCounts(records);
writeFileSync(out, JSON.stringify(counts, null, 2) + '\n');
console.log(`${Object.keys(counts).length} participant(s) with accepted advent challenges.`);
