import { EMPTY_SEASON, readSeason, type SeasonData, type SeasonStats } from '../scripts/season';

declare const __SEASON__: unknown;
/** Every participant's season, built into the page (see vite.config.ts), so the card makes no request. */
export const SEASON: SeasonData =
  typeof __SEASON__ === 'object' ? readSeason(__SEASON__) : EMPTY_SEASON;

/** One number on the card, and what it counts. */
export interface SeasonLine {
  value: number;
  label: string;
}

const plural = (n: number, one: string, many: string) => (n === 1 ? one : many);

/**
 * The numbers a participant's card shows, in order: only those that apply, so
 * a number that is zero, or has no source yet, is left out.
 */
export function seasonLines(stats: SeasonStats | undefined): SeasonLine[] {
  if (!stats) return [];
  const lines: [number | undefined, string, string][] = [
    [stats.requests, 'request made', 'requests made'],
    [stats.shipped, 'request shipped', 'requests shipped'],
    [stats.findingsFixed, 'review finding fixed', 'review findings fixed'],
    [stats.featured, 'time featured', 'times featured'],
    [stats.votes, 'vote received', 'votes received'],
    [stats.advent, 'advent challenge done', 'advent challenges done'],
  ];
  return lines
    .filter(([value]) => value !== undefined && value > 0)
    .map(([value, one, many]) => ({ value: value!, label: plural(value!, one, many) }));
}

/** The card's headline: a summary of the season, or a warm welcome when there's little to show. */
export function seasonHeadline(lines: readonly SeasonLine[]): string {
  return lines.length > 0 ? 'My season at the North Pole' : 'My first season at the North Pole';
}

/** The share text the card starts with, which its owner can change before copying it. */
export function seasonShareText(
  login: string,
  boothName: string,
  stats: SeasonStats | undefined,
  link: string,
): string {
  const shipped = stats?.shipped ?? 0;
  const what =
    shipped > 0
      ? `I shipped ${shipped} ${plural(shipped, 'request', 'requests')} to ${boothName}`
      : `I built ${boothName}`;
  return `My season at the North Pole Carnival as @${login}: ${what}. Come visit: ${link}`;
}
