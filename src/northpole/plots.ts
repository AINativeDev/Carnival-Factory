/**
 * Which plot every booth stands on, and the plots held for the booths being
 * built. Plain functions, so the map, the deploy and the tests work them out
 * the same way.
 *
 * A booth's plot comes from, in order: its pin in `plots.json`; else its own
 * `carnival/booths/<login>/plot.json`, which the factory writes when it builds a new
 * booth on the plot its construction site held; else the next free plot. A
 * booth with a pin or a `plot.json` never moves, whatever else changes.
 *
 * The booths being built are never written down: the deploy reads the open,
 * accepted booth requests and holds the next free plots for them, in order of
 * issue number, in `pending.json` (read in `construction-sites.ts`).
 */
import { isPlot, MAX_PENDING, type PendingBooth } from './construction-sites.ts';

/** What a booth's own `plot.json` says: its plot, and the issue that asked for the booth. */
export interface PlotFile {
  plot: number;
  /** The booth request's issue number: when two booths claim one plot, the lower keeps it. */
  issue?: number;
}

/**
 * The first plot number a booth's `plot.json` or a construction site can't
 * claim, with `booths` booths on the map. A held plot is always the next free
 * one, so it's below the booths and the most requests pending added together.
 * A claim past it would stretch the island, and the work of building it, far
 * beyond every square, so it takes the next free plot instead.
 */
export const plotLimit = (booths: number) => booths + MAX_PENDING;

/** A booth's `plot.json` if it's valid: a whole number for the plot, and maybe the issue. */
export function readPlotFile(value: unknown): PlotFile | undefined {
  if (!value || typeof value !== 'object') return undefined;
  const { plot, issue } = value as Record<string, unknown>;
  if (!isPlot(plot)) return undefined;
  if (typeof issue === 'number' && Number.isInteger(issue) && issue > 0) return { plot, issue };
  return { plot };
}

/**
 * Every booth's plot number. Pins come first, then each booth's own
 * `plot.json`, the lower issue number first when two claim the same plot,
 * then the rest take the lowest free numbers in the order given. A file's
 * plot that's pinned to another booth, taken by an earlier file, or past
 * `plotLimit`, falls back to the next free one.
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
    .flatMap((id) => {
      const file = Object.hasOwn(files, id) ? files[id] : undefined;
      return !numbers.has(id) && file && readPlotFile(file) ? [{ id, file }] : [];
    })
    .sort(
      (a, b) =>
        (a.file.issue ?? Infinity) - (b.file.issue ?? Infinity) ||
        Number(a.id > b.id) - Number(a.id < b.id),
    );
  const limit = plotLimit(ids.length);
  for (const { id, file } of claims) {
    const { plot } = file;
    if (taken.has(plot) || plot >= limit) continue;
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
 * or, if a booth took that plot meanwhile or it's past `plotLimit`, the next
 * free one.
 */
export function placePending(
  pending: readonly PendingBooth[],
  booths: ReadonlyMap<string, number>,
): { sites: Map<string, number>; updates: Set<string> } {
  const updates = new Set<string>();
  const sites = new Map<string, number>();
  const used = new Set(booths.values());
  const limit = plotLimit(booths.size);
  const moved: PendingBooth[] = [];
  for (const entry of [...pending].sort((a, b) => a.issue - b.issue)) {
    if (booths.has(entry.login)) updates.add(entry.login);
    else if (sites.has(entry.login)) continue;
    else if (used.has(entry.plot) || entry.plot >= limit) moved.push(entry);
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

/**
 * The construction sites to remember for next time: the ones up now, then the
 * ones remembered before that aren't booths here yet. A page from an older
 * deploy doesn't know a booth that just landed, so it keeps that site in mind
 * until a page that knows the booth greets it.
 */
export function sitesToRemember(
  were: Iterable<string>,
  sites: readonly string[],
  booths: ReadonlySet<string>,
): string[] {
  const now = new Set(sites);
  return [...sites, ...[...new Set(were)].filter((login) => !now.has(login) && !booths.has(login))];
}
