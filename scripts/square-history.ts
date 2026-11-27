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
import {
  REQUEST_LABEL,
  branchIssue,
  countFindings,
  decisionOf,
  squaresTouched,
} from './github-requests.ts';
import type { Decision, RawIssue, RawPull } from './github-requests.ts';
import { creditsOf } from './square-credits.ts';

export type HistoryKind = 'booth' | 'attraction' | 'level';

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

/** Each request form's label, and the kind of square it asks for: the author's own. */
const REQUEST_KINDS: Record<string, HistoryKind> = {
  [REQUEST_LABEL]: 'booth',
  'level-request': 'level',
};

/** The longest title kept. */
export const MAX_TITLE = 120;

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
    // Stryker disable next-line ConditionalExpression: with no issue, `issues.has` is false and it skips just the same.
    if (issue === undefined || pull.isCrossRepository || !issues.has(issue)) continue;
    // Stryker disable next-line ArrayDeclaration: any made-up path touches no square, just as no path does.
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
    // Stryker disable next-line MethodExpression: another label makes an `undefined/<login>` key, which no square has.
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
