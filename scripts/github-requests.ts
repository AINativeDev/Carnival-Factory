/**
 * A request and the factory's pull requests as the GitHub GraphQL API gives
 * them, and the facts read straight off one: which squares a pull request
 * touches, which issue its branch is for, what the assessment decided and how
 * many review findings it had. Kept apart from scripts/square-history.ts,
 * which shapes them into every square's history, because the factory's
 * numbers (scripts/factory-stats.ts) read the same facts.
 */

/** What the assessment decided about a request. */
export type Decision = 'accepted' | 'question' | 'declined' | 'waiting';

/** An issue as the GitHub GraphQL API gives it. */
export interface RawIssue {
  number: number;
  title: string;
  url: string;
  createdAt: string;
  author: { login: string } | null;
  labels: { nodes: { name: string }[] };
  /** When labels were added, for when a request was accepted. */
  timelineItems?: { nodes: { createdAt: string; label?: { name: string } | null }[] };
}

/** A pull request as the GitHub GraphQL API gives it. */
export interface RawPull {
  number: number;
  url: string;
  state: 'OPEN' | 'MERGED' | 'CLOSED';
  mergedAt: string | null;
  headRefName: string;
  isCrossRepository: boolean;
  labels?: { nodes: { name: string }[] };
  commits: { totalCount: number };
  files: { nodes: { path: string }[] } | null;
  reviewThreads: {
    nodes: { isResolved: boolean; comments: { nodes: { author: { login: string } | null }[] } }[];
  };
}

/** The issue label of a booth request. */
export const REQUEST_LABEL = 'booth-request';
/** The logins whose review threads are findings. */
export const REVIEWERS = ['tessl-reviewer'];

/** The squares a set of changed files touches, as `<kind>/<id>`. */
export function squaresTouched(paths: string[]): string[] {
  const squares = new Set<string>();
  for (const path of paths) {
    const { kind, id } =
      /^(?:carnival\/)?(?<kind>booth|attraction|level)s\/(?<id>[a-z0-9]+(?:-[a-z0-9]+)*)\//i.exec(
        path,
      )?.groups ?? {};
    if (kind && id) squares.add(`${kind}/${id.toLowerCase()}`);
  }
  return [...squares].sort();
}

/** The issue a factory branch is for: `tessl/issue-<n>`. */
export function branchIssue(branch: string): number | undefined {
  const match = branch.match(/^tessl\/issue-(\d+)$/);
  return match ? Number(match[1]) : undefined;
}

/** What the assessment decided, from the request's labels and whether the factory built it. */
export function decisionOf(labels: string[], built: boolean): Decision {
  if (labels.includes('declined')) return 'declined';
  if (labels.includes('needs-info')) return 'question';
  if (built || labels.includes('tessl')) return 'accepted';
  return 'waiting';
}

/** Review findings: threads a reviewer started, and how many of those were resolved. */
export function countFindings(
  pull: RawPull,
  reviewers: string[] = REVIEWERS,
): {
  findings: number;
  fixed: number;
} {
  const isReviewer = (login = '') => reviewers.includes(login.replace(/\[bot\]$/, ''));
  const threads = pull.reviewThreads.nodes.filter((thread) =>
    isReviewer(thread.comments.nodes[0]?.author?.login),
  );
  return { findings: threads.length, fixed: threads.filter((t) => t.isResolved).length };
}
