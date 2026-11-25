/**
 * What the auto-merge gate reads of GitHub's pull requests and issues, with
 * the API client passed in, so scripts/auto-merge-booths.ts uses the real one
 * and the tests a scripted one (ADR 0031). Only reads: the writes stay in
 * gate-pull.ts and the entry point.
 */
import { RATE_LIMIT_MS } from './booth-gate.ts';
import { requestKind } from './gate-request.ts';
import { linkedIssue } from './ownership.ts';

/** The gate's way to GitHub: one REST call on this repository, and whether it may write. */
export interface GitHub {
  /** `owner/name` of the repository the gate looks after. */
  repository: string;
  /** Only say what would happen, without writing anything. */
  dryRun: boolean;
  /** One REST call on `repos/<repository>/<path>`; it throws unless GitHub answers 2xx. */
  call<T>(method: string, path: string, body?: unknown): Promise<T>;
}

export interface User {
  login: string;
  type: string;
}
export interface Label {
  name: string;
}
export interface Pull {
  number: number;
  title: string;
  body: string | null;
  user: User;
  labels: Label[];
  updated_at: string;
  merged_at: string | null;
  head: { ref: string; sha: string; repo: { full_name: string } | null };
}
export interface Issue {
  number: number;
  state: string;
  title: string;
  body: string | null;
  user: User;
  labels: Label[];
}
export interface Comment {
  id: number;
  body: string;
  user: User;
}

export const names = (labels: readonly Label[]) => labels.map((label) => label.name);

/** Every page of a list endpoint, so no history is cut off at 100; `stop` ends early. */
export async function getAll<T>(
  github: GitHub,
  path: string,
  stop?: (page: T[]) => boolean,
): Promise<T[]> {
  const all: T[] = [];
  for (let page = 1; ; page++) {
    const batch = await github.call<T[]>(
      'GET',
      `${path}${path.includes('?') ? '&' : '?'}per_page=100&page=${page}`,
    );
    all.push(...batch);
    if (batch.length < 100 || stop?.(batch)) return all;
  }
}

/** The request issue a factory pull request builds, if it's a booth or level request by a person. */
export async function squareRequest(github: GitHub, pull: Pull): Promise<Issue | undefined> {
  const number = linkedIssue(pull.body ?? '', github.repository);
  if (!number) return undefined;
  const issue = await github.call<Issue>('GET', `issues/${number}`);
  if (issue.user.type === 'Bot' || !requestKind(names(issue.labels))) return undefined;
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
 * When this participant last had a booth or level merge on its own, within
 * the rate limit's window. Merging updates a pull request, so walking closed
 * pull requests by update time back to the window's start sees every merge in it.
 */
export async function lastAutoMerge(
  github: GitHub,
  owner: string,
  now: Date,
): Promise<Date | undefined> {
  const since = now.getTime() - RATE_LIMIT_MS;
  let last: Date | undefined;
  for (const pull of await closedSince(github, since)) {
    if (!pull.merged_at || !names(pull.labels).includes('auto-merged')) continue;
    const at = new Date(pull.merged_at);
    if (at.getTime() < since) continue;
    const issue = await squareRequest(github, pull);
    if (issue?.user.login.toLowerCase() !== owner) continue;
    if (!last || at > last) last = at;
  }
  return last;
}
