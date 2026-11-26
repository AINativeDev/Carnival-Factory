/**
 * The booth or level request behind a factory pull request, and the pull
 * requests that closed lately: what the merge gate needs to know who a booth
 * or level belongs to, and to tell whether the map is behind.
 */
import type { RequestKind } from './booth-gate.ts';
import { get, getAll, names, type GitHub, type Issue, type Pull } from './merge-gate-github.ts';
import { linkedIssue } from './ownership.ts';

/** What a request builds, from its label: a level request's is a level, any other a booth. */
export const requestKind = (issue: Issue): RequestKind =>
  names(issue.labels).includes('level-request') ? 'level' : 'booth';

/**
 * The request issue a factory pull request builds, if it's a booth or level
 * request by a person (ADR 0043). Bots' issues never merge on their own.
 */
export async function participantRequest(
  github: GitHub,
  repository: string,
  pull: Pull,
): Promise<Issue | undefined> {
  const number = linkedIssue(pull.body ?? '', repository);
  if (!number) return undefined;
  const issue = await get<Issue>(github, `issues/${String(number)}`);
  const labels = names(issue.labels);
  const asked = labels.includes('booth-request') || labels.includes('level-request');
  return issue.user.type === 'Bot' || !asked ? undefined : issue;
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
