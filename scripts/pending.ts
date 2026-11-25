/**
 * The booth requests being built, for `pending.json`: how far along each one
 * is, and where it stands on the map. Plain functions, so the deploy
 * (scripts/write-pending.ts) and the tests work them out the same way.
 *
 * Only what the GitHub API says about a request goes in: its author's login,
 * its issue number and labels, and its pull request's checks. Never its title
 * or body.
 */
import {
  MAX_PENDING,
  readPending,
  type PendingBooth,
  type Stage,
} from '../src/northpole/construction-sites.ts';
import { reservePlots } from '../src/northpole/plots.ts';

/** The label the gate puts on a request, or its pull request, that a person has to look at. */
export const NEEDS_HUMAN = 'needs-human';

/** How a pull request's checks stand: some still running, all passed, or one failed. */
export type Checks = 'running' | 'passed' | 'failed';

/** One accepted booth request, as the deploy reads it from the API. */
export interface Request {
  login: string;
  issue: number;
  labels: readonly string[];
  /** Its open pull request, if the factory has opened one. */
  pull?: { labels: readonly string[]; checks: Checks };
}

/**
 * How far along a request is: waiting for a maintainer once it's marked
 * `needs-human`, building until it has a pull request, then its checks
 * running, and almost there once they've passed and only the reviews are left.
 * A failed check stays "Checks running": the factory fixes it and runs them again.
 */
export function stageOf(request: Pick<Request, 'labels' | 'pull'>): Stage {
  const labels = [...request.labels, ...(request.pull?.labels ?? [])];
  if (labels.includes(NEEDS_HUMAN)) return 'maintainer';
  if (!request.pull) return 'building';
  return request.pull.checks === 'passed' ? 'almost' : 'checks';
}

/** How a pull request's check runs stand. None yet counts as running. */
export function checksOf(runs: readonly { status: string; conclusion: string | null }[]): Checks {
  if (!runs.length || runs.some((run) => run.status !== 'completed')) return 'running';
  const fine = ['success', 'neutral', 'skipped'];
  return runs.every((run) => fine.includes(run.conclusion ?? '')) ? 'passed' : 'failed';
}

/**
 * The requests `pending.json` can list: each login's latest, in order of issue
 * number, at most `MAX_PENDING`. The deploy reads only these ones' pull
 * requests and checks, so its work stays bounded however many are open.
 */
export function latestRequests<T extends { login: string; issue: number }>(
  requests: readonly T[],
): T[] {
  const latest = new Map<string, T>();
  for (const request of requests) {
    const login = request.login.toLowerCase();
    const had = latest.get(login);
    if (!had || request.issue > had.issue) latest.set(login, request);
  }
  return [...latest.values()].sort((a, b) => a.issue - b.issue).slice(0, MAX_PENDING);
}

/**
 * `pending.json`'s entries: one per login, its latest request, in order of
 * issue number. A login with a booth already is changing it, so its entry
 * names that booth's plot. The others get the next free plots after every
 * booth's, in order of issue number. Every entry passes `readPending`, the
 * page's own check.
 */
export function pendingList(
  requests: readonly Request[],
  booths: ReadonlyMap<string, number>,
): PendingBooth[] {
  const chosen = latestRequests(requests).map((request) => ({
    ...request,
    login: request.login.toLowerCase(),
  }));
  const reserved = reservePlots(
    chosen.filter((request) => !booths.has(request.login)),
    booths.values(),
  );
  return readPending(
    chosen.map((request) => ({
      login: request.login,
      issue: request.issue,
      plot: booths.get(request.login) ?? reserved.get(request.login),
      stage: stageOf(request),
    })),
  );
}
