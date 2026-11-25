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
import { cleanCalendar } from '../src/northpole/advent.ts';
import { adventCounts, type AdventRecord } from './advent.ts';
import { github, repoPath, type GitHubReader } from './github-api.ts';

type Comment = AdventRecord['comments'][number] & { issue_url: string };

/** The repository's comments by the issue each is on; a comment on nothing GitHub can name is left out. */
export function commentsByIssue(comments: readonly Comment[]): Map<number, Comment[]> {
  const byIssue = new Map<number, Comment[]>();
  for (const comment of comments) {
    const number = Number(/\/issues\/(\d+)$/.exec(comment.issue_url)?.[1]);
    if (!number) continue;
    byIssue.set(number, [...(byIssue.get(number) ?? []), comment]);
  }
  return byIssue;
}

/** How many challenges each participant had accepted in `repository`, in the calendar of `year`. */
export async function readAdventCounts(
  reader: GitHubReader,
  repository: string,
  year: number,
): Promise<Record<string, number>> {
  // The first door opens at midnight on 1 December somewhere, which is 30 November in UTC.
  const since = `${String(year).padStart(4, '0')}-11-30T00:00:00Z`;
  const issues = await reader.getAll<AdventRecord['issue'] & { pull_request?: unknown }>(
    `${repoPath(repository)}/issues?labels=advent-done,accepted&state=all`,
  );
  const byIssue = commentsByIssue(
    await reader.getAll<Comment>(
      `${repoPath(repository)}/issues/comments?since=${since}&sort=created&direction=asc`,
    ),
  );
  const records: AdventRecord[] = issues
    .filter((issue) => !issue.pull_request)
    .map((issue) => ({ issue, comments: byIssue.get(issue.number) ?? [] }));
  return adventCounts(records);
}

/* v8 ignore start -- the deploy's entry point: reading the environment, then writing the file */
if (process.argv[1]?.endsWith('write-advent.ts')) {
  const repository = process.env.GITHUB_REPOSITORY;
  const out = process.argv[2];
  if (!repository || !out) throw new Error('Set GITHUB_REPOSITORY, and name the file to write');
  const { year } = cleanCalendar(
    JSON.parse(
      readFileSync(new URL('../carnival/challenges/advent.json', import.meta.url), 'utf8'),
    ),
  );
  const counts = await readAdventCounts(github, repository, year);
  writeFileSync(out, JSON.stringify(counts, null, 2) + '\n');
  console.log(`${Object.keys(counts).length} participant(s) with accepted advent challenges.`);
}
/* v8 ignore stop */
