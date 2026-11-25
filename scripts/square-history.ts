/**
 * How every booth, attraction and level came to be: the requests that shaped it and
 * the factory's pull requests that built them, read from the repository's
 * issues and pull requests when the site is built. Plain functions, so the
 * shaping is tested; scripts/write-square-history.ts does the reading.
 *
 * Everything here is public on the repository already. Titles and logins are
 * participants' text, so they're capped, and the page only ever sets them as
 * text. This is the one data script for a square's past: the credits read
 * the same file.
 */

import type { FactoryStats } from './factory-stats.ts';
import { creditsOf } from './square-credits.ts';

export type HistoryKind = 'booth' | 'attraction' | 'level';

/** What the assessment decided about a request. */
export type Decision = 'accepted' | 'question' | 'declined' | 'waiting';

/** One of the factory's pull requests for a request. */
export interface HistoryPull {
  number: number;
  url: string;
  state: 'open' | 'merged' | 'closed';
  /** Review findings raised on it, and how many of those were resolved. */
  findings: number;
  fixed: number;
  /** How many commits it took. The factory pushes after every commit, so these are its pushes. */
  commits: number;
  /** ISO time it merged. */
  mergedAt?: string;
  /** Its preview of this square, while it's open. */
  preview?: string;
}

/** One request that shaped a square, and what came of it. */
export interface HistoryEntry {
  /** The request's issue. */
  issue: number;
  title: string;
  url: string;
  /** Its author, as GitHub shows the login. */
  author: string;
  /** ISO time it was opened. */
  openedAt: string;
  decision: Decision;
  /** Newest first. */
  pulls: HistoryPull[];
}

/** Who made a square, and who improved it since, as GitHub shows their logins. */
export interface Credits {
  /** A booth's owner. An attraction has none on record. */
  maker?: string;
  /** In the order their changes merged, each once. */
  improvers: string[];
}

/** Every square's history, keyed `<kind>/<id>`. */
export interface SquareHistory {
  /** ISO time the data was read. */
  builtAt: string;
  squares: Record<string, HistoryEntry[]>;
  /** Every square the factory has built into, keyed the same way. */
  credits: Record<string, Credits>;
  /** The factory's numbers, for the `#/factory` page (scripts/factory-stats.ts). */
  factory?: FactoryStats;
}

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

/** The issue label of a booth request, and the logins whose review threads are findings. */
export const REQUEST_LABEL = 'booth-request';
/** Each request form's label, and the kind of square it asks for: the author's own. */
const REQUEST_KINDS: Record<string, HistoryKind> = {
  [REQUEST_LABEL]: 'booth',
  'level-request': 'level',
};
export const REVIEWERS = ['tessl-reviewer'];

/** The longest title kept. */
export const MAX_TITLE = 120;

/** The squares a set of changed files touches, as `<kind>/<id>`. */
export function squaresTouched(paths: string[]): string[] {
  const squares = new Set<string>();
  for (const path of paths) {
    const match = path.match(
      /^(?:carnival\/)?(booth|attraction|level)s\/([a-z0-9]+(?:-[a-z0-9]+)*)\//i,
    );
    if (match) squares.add(`${match[1]}/${match[2].toLowerCase()}`);
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

/** Text capped at `max` characters, on one line. */
export function cap(text: string, max = MAX_TITLE): string {
  const chars = [...text.replace(/\s+/g, ' ').trim()];
  return chars.length > max ? `${chars.slice(0, max - 1).join('')}…` : chars.join('');
}

export interface ShapeOptions {
  /** The squares on the map, as `<kind>/<id>`. Nothing else gets a history. */
  squares: string[];
  issues: RawIssue[];
  pulls: RawPull[];
  /** The site's address, for preview links; without it there are none. */
  site?: string;
  builtAt: string;
}

/**
 * Every square's history. A request belongs to the squares its factory pull
 * requests change, and a booth or level request also to its author's own, so one
 * that was declined or asked a question still shows there. Each square lists
 * only the pull requests that changed it. Newest first.
 */
export function shapeHistory(options: ShapeOptions): SquareHistory {
  const known = new Set(options.squares);
  const issues = new Map(options.issues.map((issue) => [issue.number, issue]));

  // The factory's pull requests, by the issue their branch names.
  const pullsFor = new Map<number, { pull: RawPull; squares: string[] }[]>();
  for (const pull of options.pulls) {
    const issue = branchIssue(pull.headRefName);
    if (issue === undefined || pull.isCrossRepository || !issues.has(issue)) continue;
    const squares = squaresTouched((pull.files?.nodes ?? []).map((file) => file.path));
    pullsFor.set(issue, [...(pullsFor.get(issue) ?? []), { pull, squares }]);
  }

  const squares: Record<string, HistoryEntry[]> = {};
  const sorted = [...options.issues].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  for (const issue of sorted) {
    const labels = issue.labels.nodes.map((label) => label.name);
    const pulls = (pullsFor.get(issue.number) ?? []).sort((a, b) => b.pull.number - a.pull.number);
    const author = issue.author?.login ?? 'ghost';
    const where = new Set(pulls.flatMap((p) => p.squares));
    for (const label of labels.filter((name) => Object.hasOwn(REQUEST_KINDS, name)))
      where.add(`${REQUEST_KINDS[label]}/${author.toLowerCase()}`);
    for (const square of [...where].filter((s) => known.has(s)).sort()) {
      (squares[square] ??= []).push({
        issue: issue.number,
        title: cap(issue.title),
        url: issue.url,
        author: cap(author, 39),
        openedAt: issue.createdAt,
        decision: decisionOf(labels, pulls.length > 0),
        pulls: pulls
          .filter((p) => p.squares.includes(square))
          .map(({ pull }) => shapePull(pull, square, options)),
      });
    }
  }
  const credits: Record<string, Credits> = {};
  for (const [square, entries] of Object.entries(squares)) {
    const credit = creditsOf(square, entries);
    if (credit) credits[square] = credit;
  }
  return { builtAt: options.builtAt, squares, credits };
}

function shapePull(pull: RawPull, square: string, options: ShapeOptions): HistoryPull {
  const state = pull.state === 'MERGED' ? 'merged' : pull.state === 'OPEN' ? 'open' : 'closed';
  const shaped: HistoryPull = {
    number: pull.number,
    url: pull.url,
    state,
    ...countFindings(pull),
    commits: pull.commits.totalCount,
  };
  if (pull.mergedAt) shaped.mergedAt = pull.mergedAt;
  if (state === 'open' && options.site) {
    shaped.preview = `${options.site}previews/pr-${pull.number}/#/${square}`;
  }
  return shaped;
}
