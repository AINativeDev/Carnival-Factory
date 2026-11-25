/**
 * Requests and pull requests as the GitHub API gives them, made small for the
 * tests of every square's history and of the facts read off a pull request,
 * which both need them.
 */
import type { RawIssue, RawPull } from '../github-requests.ts';

export const REPO = 'https://github.com/o/r';

/** A request, issue `number`, by `login`, with these labels. */
export const issue = (
  number: number,
  login: string,
  labels: string[],
  createdAt: string,
): RawIssue => ({
  number,
  title: `Request ${number}`,
  url: `${REPO}/issues/${number}`,
  createdAt,
  author: { login },
  labels: { nodes: labels.map((name) => ({ name })) },
});

/** A review thread started by `login`. */
export const thread = (login: string, isResolved: boolean) => ({
  isResolved,
  comments: { nodes: [{ author: { login } }] },
});

/** A merged pull request from `branch`, changing `paths`, with any field overridden. */
export const pull = (
  number: number,
  branch: string,
  paths: string[],
  extra: Partial<RawPull> = {},
): RawPull => ({
  number,
  url: `${REPO}/pull/${number}`,
  state: 'MERGED',
  mergedAt: '2026-11-24T15:18:46Z',
  headRefName: branch,
  isCrossRepository: false,
  commits: { totalCount: 3 },
  files: { nodes: paths.map((path) => ({ path })) },
  reviewThreads: { nodes: [] },
  ...extra,
});
