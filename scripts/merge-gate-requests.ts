/**
 * The booth request behind a factory pull request, and the pull requests that
 * closed lately: what the merge gate needs to know who a booth belongs to, and
 * to tell whether the map is behind.
 */
import { get, getAll, names, type GitHub, type Issue, type Pull } from './merge-gate-github.ts';
import { linkedIssue } from './ownership.ts';

/**
 * The request issue a factory pull request builds, if it's a booth request by
 * a person. Level requests and bots' issues never merge on their own.
 */
export async function boothRequest(
  github: GitHub,
  repository: string,
  pull: Pull,
): Promise<Issue | undefined> {
  const number = linkedIssue(pull.body ?? '', repository);
  if (!number) return undefined;
  const issue = await get<Issue>(github, `issues/${String(number)}`);
  if (issue.user.type === 'Bot' || !names(issue.labels).includes('booth-request')) return undefined;
  return issue;
}

/** Closed pull requests updated at or after `since`, newest first, read until older ones start. */
export async function closedSince(github: GitHub, since: number): Promise<Pull[]> {
  const pulls = await getAll<Pull>(
    github,
    'pulls?state=closed&sort=updated&direction=desc',
    (page) => page.some((pull) => new Date(pull.updated_at).getTime() < since),
  );
  return pulls.filter((pull) => new Date(pull.updated_at).getTime() >= since);
}
