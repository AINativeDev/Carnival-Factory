/**
 * The factory's numbers page's figures, `#/factory`: how many booths and attractions
 * the map has, counted from the squares in this build, and how much the
 * factory has built, from the numbers the deploy read
 * (scripts/factory-stats.ts), checked and worded. Plain functions, kept apart
 * from the page itself (src/factory.ts) so the counting and wording are tested.
 */
import type { FactoryStats } from '../scripts/factory-stats';

/** What this build counts from its own folders. */
export interface SquareCounts {
  booths: number;
  attractions: number;
  /** Distinct booth owners. */
  people: number;
}

/** The counts from the squares on the map: each booth's id is its owner's login. */
export const squareCounts = (booths: string[], attractions: string[]): SquareCounts => ({
  booths: booths.length,
  attractions: attractions.length,
  // Stryker disable next-line MethodExpression: logins in upper case count each person once just the same
  people: new Set(booths.map((id) => id.toLowerCase())).size,
});

/** A count the page can show: a whole number, at least 0. */
const count = (value: unknown): number | undefined =>
  typeof value === 'number' && Number.isInteger(value) && value >= 0 ? value : undefined;

/** A date the page can show: an ISO time, nothing else. */
const isoTime = (value: unknown): string | undefined =>
  typeof value === 'string' &&
  /^\d{4}-\d\d-\d\dT\d\d:\d\d(:\d\d(\.\d+)?)?Z$/.test(value) &&
  !Number.isNaN(Date.parse(value))
    ? value
    : undefined;

const NUMBERS = [
  'builds',
  'merged',
  'autoMerged',
  'requests',
  'accepted',
  'question',
  'declined',
  'findings',
  'fixed',
] as const;

/**
 * The factory's numbers rebuilt from whatever the build bundled, keeping only
 * whole numbers and an ISO time, so no text from an issue or pull request can
 * reach the page through them. Undefined when any count is missing.
 */
export function readFactoryStats(data: unknown): FactoryStats | undefined {
  if (!data || typeof data !== 'object') return undefined;
  const raw = data as Record<string, unknown>;
  const readAt = isoTime(raw.readAt);
  if (!readAt) return undefined;
  const stats = { readAt } as FactoryStats;
  for (const key of NUMBERS) {
    const value = count(raw[key]);
    if (value === undefined) return undefined;
    stats[key] = value;
  }
  const toMap = raw.toMap as Record<string, unknown> | undefined;
  const fastest = count(toMap?.fastest);
  const median = count(toMap?.median);
  const timed = count(toMap?.count);
  if (fastest !== undefined && median !== undefined && timed) {
    stats.toMap = { fastest, median, count: timed };
  }
  return stats;
}

/** One big number on the page: the number, its short label, and perhaps a line under it. */
export interface Figure {
  value: string;
  label: string;
  detail?: string;
}

const plural = (n: number, one: string, many = `${one}s`) => (n === 1 ? one : many);

/** A count with thousands separated the same wherever the visitor is: "1,234". */
export const number = (n: number) => String(n).replace(/\B(?=(\d{3})+$)/g, ',');

/** A time, such as "24 Nov 2026, 18:57 UTC". */
export function updatedAt(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  const months = 'Jan Feb Mar Apr May Jun Jul Aug Sep Oct Nov Dec'.split(' ');
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${date.getUTCDate()} ${months[date.getUTCMonth()]} ${date.getUTCFullYear()}, ${pad(date.getUTCHours())}:${pad(date.getUTCMinutes())} UTC`;
}

/** The page's big numbers: the map's own counts always, and the factory's when the build has them. */
export function factoryFigures(squares: SquareCounts, stats?: FactoryStats): Figure[] {
  const figures: Figure[] = [
    {
      value: number(squares.booths),
      label: `${plural(squares.booths, 'booth')} on the map`,
    },
    { value: number(squares.attractions), label: plural(squares.attractions, 'attraction') },
    {
      value: number(squares.people),
      label: `${plural(squares.people, 'person', 'people')} with a booth`,
    },
  ];
  if (!stats) return figures;
  const byHand = stats.merged - stats.autoMerged;
  figures.push(
    {
      value: number(stats.builds),
      label: `factory ${plural(stats.builds, 'build')}, ${number(stats.merged)} merged`,
      detail: `${number(stats.autoMerged)} merged on their own, ${number(byHand)} with a maintainer`,
    },
    {
      value: number(stats.requests),
      label: `booth ${plural(stats.requests, 'request')}`,
      detail: `${number(stats.accepted)} accepted, ${number(stats.question)} asked a question, ${number(stats.declined)} declined`,
    },
    {
      value: number(stats.findings),
      label: `review ${plural(stats.findings, 'finding')}`,
      detail: `${number(stats.fixed)} fixed`,
    },
  );
  if (stats.toMap) {
    figures.push({
      value: number(stats.toMap.fastest),
      label: `${plural(stats.toMap.fastest, 'minute')} from accepted request to map, at the fastest`,
      detail: `typically ${number(stats.toMap.median)} ${plural(stats.toMap.median, 'minute')}, over ${number(stats.toMap.count)} ${plural(stats.toMap.count, 'request')}`,
    });
  }
  return figures;
}

/** The line under the numbers: when they were read, or that the rest appear on the live map. */
export const factoryNote = (stats?: FactoryStats) =>
  stats
    ? `Last updated ${updatedAt(stats.readAt)}.`
    : "The factory's builds, requests and review findings appear on the live map.";
