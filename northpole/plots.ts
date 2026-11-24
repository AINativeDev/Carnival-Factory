/**
 * Which plot every booth stands on, and the plots held for the booths being
 * built. Plain functions, so the map, the deploy and the tests work them out
 * the same way.
 *
 * A booth's plot comes from, in order: its pin in `plots.json`; else its own
 * `booths/<login>/plot.json`, which the factory writes when it builds a new
 * booth on the plot its construction site held; else the next free plot. A
 * booth with a pin or a `plot.json` never moves, whatever else changes.
 *
 * The booths being built are never written down: the deploy reads the open,
 * accepted booth requests and holds the next free plots for them, in order of
 * issue number, in `pending.json`.
 */

/** What a booth's own `plot.json` says: its plot, and the issue that asked for the booth. */
export interface PlotFile {
  plot: number;
  /** The booth request's issue number: when two booths claim one plot, the lower keeps it. */
  issue?: number;
}

/** How far along a booth request is. */
export type Stage = 'building' | 'checks' | 'almost' | 'maintainer';

/** What each stage says on the sign and the tag. */
export const STAGE_TEXT: Record<Stage, string> = {
  building: 'Building',
  checks: 'Checks running',
  almost: 'Almost there',
  maintainer: 'Waiting for a maintainer',
};

/** One accepted booth request not merged yet, as `pending.json` lists it. */
export interface PendingBooth {
  /** The request's author, as GitHub's API names them, in lower case. */
  login: string;
  /** The request's issue number. */
  issue: number;
  /** The plot held for it. A booth that already exists keeps its own. */
  plot: number;
  stage: Stage;
}

/** The most entries the page reads from `pending.json`. */
export const MAX_PENDING = 100;

/** A GitHub login: letters, digits and single hyphens, at most 39 characters. */
const LOGIN = /^[a-z\d](?:[a-z\d]|-(?=[a-z\d])){0,38}$/i;

const isPlot = (value: unknown): value is number =>
  typeof value === 'number' && Number.isInteger(value) && value >= 0 && value < 10000;

/** A booth's `plot.json` if it's valid: a whole number for the plot, and maybe the issue. */
export function readPlotFile(value: unknown): PlotFile | undefined {
  if (!value || typeof value !== 'object') return undefined;
  const { plot, issue } = value as Record<string, unknown>;
  if (!isPlot(plot)) return undefined;
  if (typeof issue === 'number' && Number.isInteger(issue) && issue > 0) return { plot, issue };
  return { plot };
}

/**
 * `pending.json`'s entries the page can trust: valid logins, issue and plot
 * numbers and stages, one per login, at most `MAX_PENDING`. Anything else,
 * including any other field, is dropped.
 */
export function readPending(value: unknown): PendingBooth[] {
  if (!Array.isArray(value)) return [];
  const seen = new Set<string>();
  const pending: PendingBooth[] = [];
  for (const entry of value.slice(0, MAX_PENDING)) {
    if (!entry || typeof entry !== 'object') continue;
    const { login, issue, plot, stage } = entry as Record<string, unknown>;
    if (typeof login !== 'string' || !LOGIN.test(login)) continue;
    if (typeof issue !== 'number' || !Number.isInteger(issue) || issue <= 0) continue;
    if (!isPlot(plot)) continue;
    if (typeof stage !== 'string' || !Object.hasOwn(STAGE_TEXT, stage)) continue;
    const id = login.toLowerCase();
    if (seen.has(id)) continue;
    seen.add(id);
    pending.push({ login: id, issue, plot, stage: stage as Stage });
  }
  return pending;
}

/**
 * Every booth's plot number. Pins come first, then each booth's own
 * `plot.json`, the lower issue number first when two claim the same plot,
 * then the rest take the lowest free numbers in the order given. A file's
 * plot that's pinned to another booth, or taken by an earlier file, falls back
 * to the next free one.
 */
export function boothPlotNumbers(
  ids: readonly string[],
  pinned: Record<string, number> = {},
  files: Record<string, PlotFile> = {},
): Map<string, number> {
  const numbers = new Map<string, number>();
  const taken = new Set<number>();
  for (const id of ids) {
    const number = pinned[id];
    if (isPlot(number) && !taken.has(number)) {
      numbers.set(id, number);
      taken.add(number);
    }
  }
  const claims = ids
    .filter((id) => !numbers.has(id) && Object.hasOwn(files, id) && readPlotFile(files[id]))
    .sort(
      (a, b) =>
        (files[a].issue ?? Infinity) - (files[b].issue ?? Infinity) || (a < b ? -1 : a > b ? 1 : 0),
    );
  for (const id of claims) {
    const { plot } = files[id];
    if (taken.has(plot)) continue;
    numbers.set(id, plot);
    taken.add(plot);
  }
  let next = 0;
  for (const id of ids) {
    if (numbers.has(id)) continue;
    while (taken.has(next)) next++;
    numbers.set(id, next);
    taken.add(next);
  }
  return numbers;
}

/**
 * Holds a plot for each pending request: the next free plots after every
 * taken one, in order of issue number, so two requests never share a plot.
 * A login asked for twice keeps its first request's plot.
 */
export function reservePlots(
  requests: readonly { login: string; issue: number }[],
  taken: Iterable<number>,
): Map<string, number> {
  const used = new Set(taken);
  const reserved = new Map<string, number>();
  let next = 0;
  for (const { login } of [...requests].sort((a, b) => a.issue - b.issue)) {
    if (reserved.has(login)) continue;
    while (used.has(next)) next++;
    reserved.set(login, next);
    used.add(next);
  }
  return reserved;
}

/**
 * Where the map draws the pending requests, given the booths it has: a
 * request whose login already has a booth is an update, shown on that booth.
 * The others are construction sites on the plot `pending.json` held for them,
 * or, if a booth took that plot meanwhile, the next free one.
 */
export function placePending(
  pending: readonly PendingBooth[],
  booths: ReadonlyMap<string, number>,
): { sites: Map<string, number>; updates: Set<string> } {
  const updates = new Set<string>();
  const sites = new Map<string, number>();
  const used = new Set(booths.values());
  const moved: PendingBooth[] = [];
  for (const entry of [...pending].sort((a, b) => a.issue - b.issue)) {
    if (booths.has(entry.login)) updates.add(entry.login);
    else if (sites.has(entry.login)) continue;
    else if (used.has(entry.plot)) moved.push(entry);
    else {
      sites.set(entry.login, entry.plot);
      used.add(entry.plot);
    }
  }
  for (const [login, plot] of reservePlots(moved, used)) sites.set(login, plot);
  return { sites, updates };
}

/**
 * The booths that were construction sites before and are booths now, so the
 * map can greet each one with sparkles, once.
 */
export function landedBooths(wereSites: Iterable<string>, booths: ReadonlySet<string>): string[] {
  return [...new Set(wereSites)].filter((login) => booths.has(login));
}
