import type { FactoryStats } from '../scripts/factory-stats';
import { HOW_IT_WORKS_URL, OWN_REPO_URL } from '../northpole/links';
import { SIGNUP_OFFER, showSignupOffer } from './offer';
import type { VisitHud } from './visit-hud';

/**
 * The factory's numbers page, `#/factory`: how many booths and attractions
 * the map has, counted from the squares in this build, and how much the
 * factory has built, from the numbers the deploy read
 * (scripts/factory-stats.ts). A build without them, such as a preview or
 * `npm run dev`, shows the counts it has and says the rest appear on the
 * live map.
 */

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

export interface FactoryHudOptions {
  squares: SquareCounts;
  stats?: FactoryStats;
  /** Leaves the page: Esc, or the Leave button. */
  onClose(): void;
}

/**
 * The numbers page over the map, in a visit's cream panel with its gold
 * border. Every number is set as text. Focus moves into it, and back out
 * when it closes.
 */
export function openFactoryHud(frame: HTMLElement, options: FactoryHudOptions): VisitHud {
  const before = document.activeElement as HTMLElement | null;
  const card = document.createElement('section');
  card.className = 'hud factory';
  card.setAttribute('aria-labelledby', 'factory-title');
  card.innerHTML = `
    <p class="visit-leave"><span>Esc to go back to the map</span> <button class="visit-close" type="button">Leave</button></p>
    <h2 id="factory-title" class="visit-title" tabindex="-1">The North Pole Carnival factory</h2>
    <p class="factory-intro">Every booth here began as an issue. A software factory built it, checked it and put it on the map.</p>
    <ul class="factory-figures"></ul>
    <p class="factory-note"></p>
    <p class="factory-how"><a href="${HOW_IT_WORKS_URL}" target="_blank" rel="noopener">How it works</a> <span aria-hidden="true">·</span> <a href="${OWN_REPO_URL}" target="_blank" rel="noopener">Run this on your own repo</a> <span aria-hidden="true">·</span> <a href="#/advent">The advent calendar</a></p>
    ${SIGNUP_OFFER}`;
  const $ = <T extends Element>(selector: string) => card.querySelector<T>(selector)!;

  for (const figure of factoryFigures(options.squares, options.stats)) {
    const item = document.createElement('li');
    item.className = 'factory-figure';
    const value = document.createElement('span');
    value.className = 'factory-value';
    value.textContent = figure.value;
    const label = document.createElement('span');
    label.className = 'factory-label';
    label.textContent = figure.label;
    item.append(value, ' ', label);
    if (figure.detail) {
      const detail = document.createElement('span');
      detail.className = 'factory-detail';
      detail.textContent = figure.detail;
      item.append(' ', detail);
    }
    $('.factory-figures').append(item);
  }
  $('.factory-note').textContent = factoryNote(options.stats);
  showSignupOffer(card);

  $('.visit-close').addEventListener('click', () => options.onClose());
  // The page has every key: the map behind it never walks, enters a square or opens its search.
  const onKeyDown = (event: KeyboardEvent) => {
    event.stopPropagation();
    if (event.key === 'Escape') {
      event.preventDefault();
      options.onClose();
    }
  };
  document.addEventListener('keydown', onKeyDown);

  frame.dataset.factory = '';
  frame.append(card);
  $<HTMLElement>('.visit-title').focus({ preventScroll: true });

  return {
    close() {
      document.removeEventListener('keydown', onKeyDown);
      delete frame.dataset.factory;
      const hadFocus = card.contains(document.activeElement);
      card.remove();
      if (hadFocus) {
        const back =
          before && before !== document.body && before.isConnected
            ? before
            : frame.querySelector<HTMLElement>('canvas');
        back?.focus({ preventScroll: true });
      }
    },
  };
}
