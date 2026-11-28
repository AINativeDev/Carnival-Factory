/**
 * The plain facts Feed the Loop is played on: the four skills and their cards
 * down the left of the drawing, where a tap lands in a box, where each station stands round the loop, which
 * skill each leg asks for, and the floating words a tap or a station leaves.
 */
import { theme } from '../../../src/northpole/theme';

const { colors } = theme;

/** The skills on the cards, top to bottom, with the colour each glows in. */
export const SKILLS = [
  { name: 'SPECS', color: colors.ice },
  { name: 'TESTS', color: colors.mint },
  { name: 'REVIEW', color: colors.violet },
  { name: 'DOCS', color: colors.gold },
] as const;

/** The skill cards down the left of the drawing: their left, top, size and the gap between them. */
export const CARDS = { x: 4, y: 17, w: 24, h: 8.4, gap: 2 };

/** Where each station stands round the loop, as a fraction of a lap from request. */
export const STATIONS = [0, 0.25, 0.5, 0.75] as const;

/** The station names, in loop order. */
export const STATION_NAMES = ['REQUEST', 'BUILD', 'REVIEW', 'MERGE'] as const;

/** A box in the drawing's units. */
export interface Box {
  x: number;
  y: number;
  w: number;
  h: number;
}

/** Whether `x`, `y` is inside `box`. */
export const inBox = (box: Box, x: number, y: number) =>
  x >= box.x && x <= box.x + box.w && y >= box.y && y <= box.y + box.h;

/** The top of card `n`. */
export const cardTop = (n: number) => CARDS.y + n * (CARDS.h + CARDS.gap);

/** The card at `x`, `y`, or -1 when the point misses every card. */
export function cardAt(x: number, y: number): number {
  if (x < CARDS.x || x > CARDS.x + CARDS.w) return -1;
  const n = Math.floor((y - CARDS.y) / (CARDS.h + CARDS.gap));
  if (n < 0 || n >= SKILLS.length) return -1;
  return y - cardTop(n) <= CARDS.h ? n : -1;
}

/**
 * The skill leg `count` asks for: a scramble that looks random but is the same
 * every visit, so a round can be learnt but not guessed from the last one.
 */
export function needFor(count: number): number {
  const scramble = Math.sin(count * 12.9898 + 4.1) * 43_758.5453;
  return Math.floor((scramble - Math.floor(scramble)) * SKILLS.length);
}

/** Where the parcel is round the loop, from 0 at request to 1, `progress` of the way into the leg for station `leg`. */
export function alongOf(leg: number, progress: number): number {
  const from = STATIONS.at((leg + 3) % 4) ?? 0;
  return (from + progress / 4) % 1;
}

/**
 * What left a floating word or a sparkle: a tap where it landed, a right
 * answer or a jam at a station, or a booth shipped at merge, with its points.
 */
export interface Pop {
  kind: 'tap' | 'right' | 'jam' | 'ship';
  at: number;
  points: number;
  leg?: number;
  x?: number;
  y?: number;
}

/** How long a pop shows, in ms. */
export const POP_LIFE = 1_000;

/** The pops with `pop` added, keeping only the latest few. */
export const stepPops = (pops: readonly Pop[], pop: Pop): Pop[] => [...pops, pop].slice(-8);
