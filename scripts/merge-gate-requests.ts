/**
 * The booth request behind a factory pull request, and the booths that merged
 * on their own lately: what the merge gate needs to know who a booth belongs
 * to, to hold each person to one merge an hour, and to tell whether the map
 * is behind.
 */
import { RATE_LIMIT_MS } from './booth-gate.ts';
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

/**
 * When this participant last had a booth merge on its own, within the rate
 * limit's window. Merging updates a pull request, so walking closed pull
 * requests by update time back to the window's start sees every merge in it.
 */
export async function lastAutoMerge(
  github: GitHub,
  repository: string,
  owner: string,
  now: Date,
): Promise<Date | undefined> {
  const since = now.getTime() - RATE_LIMIT_MS;
  let last: Date | undefined;
  for (const pull of await closedSince(github, since)) {
    if (!pull.merged_at || !names(pull.labels).includes('auto-merged')) continue;
    const at = new Date(pull.merged_at);
    if (at.getTime() < since) continue;
    const issue = await boothRequest(github, repository, pull);
    if (issue?.user.login.toLowerCase() !== owner) continue;
    if (!last || at > last) last = at;
  }
  return last;
}
