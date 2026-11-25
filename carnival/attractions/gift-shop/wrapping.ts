/**
 * Wrapping a present, as plain functions: taps pick the paper, then the
 * ribbon, then the bow, and the finished parcel goes up on the shop window's
 * shelves. The shop remembers only this: what's chosen so far, the parcels on
 * the shelves and when the last one was wrapped.
 */
import { theme } from '../../../src/northpole/theme';
import { GIFTS, type Gift } from './gifts';

const { colors } = theme;

/** The papers, ribbons and bows on the counter, four of each, one swatch apiece. */
export const PAPERS = [colors.berry, colors.pine, colors.violet, colors.gold] as const;
export const RIBBONS = [colors.snowLit, colors.gold, colors.berry, colors.mint] as const;
export const BOWS = ['loops', 'rosette', 'star', 'holly'] as const;
export type Bow = (typeof BOWS)[number];

/** What each step asks the visitor, in turn. */
const STEPS = ['paper', 'ribbon', 'bow'] as const;

// Lookups by number, so the static square check (scripts/square-code.ts),
// which reads each file on its own, sees every index is one.
export const paperOf = (n: number): string => PAPERS[n] ?? PAPERS[0];
export const ribbonOf = (n: number): string => RIBBONS[n] ?? RIBBONS[0];
export const bowOf = (n: number): Bow => BOWS[n] ?? BOWS[0];
export const stepOf = (n: number): string => STEPS[n] ?? STEPS[0];

/** A wrapped parcel: which paper, ribbon and bow it has, by their place in the lists above. */
export interface Parcel {
  paper: number;
  ribbon: number;
  bow: number;
}

/** How many parcels the window holds: three shelves of four. Wrap one more and it starts again. */
export const SHELF = 12;

/** How long the gift tag shows the gift just wrapped, in milliseconds. */
export const REVEAL = 4_000;

/** The shop's one memory: the step, the paper and ribbon chosen so far, the shelves and the count. */
export interface Wrapping {
  step: number;
  paper: number;
  ribbon: number;
  shelf: Parcel[];
  wrapped: number;
  wrappedAt: number;
}

export const START: Wrapping = {
  step: 0,
  paper: -1,
  ribbon: -1,
  shelf: [],
  wrapped: 0,
  wrappedAt: -Infinity,
};

/** The swatches' row on the card, in the square's 0 to 100 units: four, side by side. */
const SWATCH = { left: 13, top: 84.5, w: 16, h: 9, gap: 3 };

/** Where swatch `n` sits on the card. */
export const swatchBox = (n: number) => ({
  x: SWATCH.left + n * (SWATCH.w + SWATCH.gap),
  y: SWATCH.top,
  w: SWATCH.w,
  h: SWATCH.h,
});

/** Which swatch is at (x, y), in the square's units, or -1 for none. */
export function swatchAt(x: number, y: number): number {
  return [0, 1, 2, 3].findIndex((n) => {
    const box = swatchBox(n);
    return x >= box.x && x <= box.x + box.w && y >= box.y && y <= box.y + box.h;
  });
}

/** Whether the gift tag is still showing the gift just wrapped at `time`. */
export const revealing = (w: Wrapping, time: number) =>
  time >= w.wrappedAt && time - w.wrappedAt < REVEAL;

/** Picks option `pick` for this step; the bow finishes the parcel and puts it on the shelf. */
export function choose(w: Wrapping, pick: number, time: number): Wrapping {
  if (w.step === 0) return { ...w, step: 1, paper: pick };
  if (w.step === 1) return { ...w, step: 2, ribbon: pick };
  const parcel = { paper: w.paper, ribbon: w.ribbon, bow: pick };
  const shelf = w.shelf.length < SHELF ? [...w.shelf, parcel] : [parcel];
  return { step: 0, paper: -1, ribbon: -1, shelf, wrapped: w.wrapped + 1, wrappedAt: time };
}

/**
 * A tap at (x, y): while the tag shows the gift just wrapped, any tap puts it
 * away; otherwise a tap on a swatch picks it, and anywhere else does nothing.
 */
export function tap(w: Wrapping, x: number, y: number, time: number): Wrapping {
  if (revealing(w, time)) return { ...w, wrappedAt: -Infinity };
  const pick = swatchAt(x, y);
  return pick < 0 ? w : choose(w, pick, time);
}

/** The gift being wrapped on the counter: each of the shop's gifts in turn. */
export const giftOnCounter = (w: Wrapping): Gift => giftOf(w.wrapped);

/** The gift last wrapped, which the tag shows while `revealing`. */
export const giftJustWrapped = (w: Wrapping): Gift => giftOf(w.wrapped - 1);

/** The `n`th gift wrapped, counting from 0: each of the shop's gifts in turn. */
function giftOf(n: number): Gift {
  const turn: number = ((n % GIFTS.length) + GIFTS.length) % GIFTS.length;
  return GIFTS[turn] ?? GIFTS[0];
}

/** How far the newest parcel on the shelf still drops into place, from 1 to 0 over half a second. */
export const settling = (w: Wrapping, time: number) =>
  Math.max(0, 1 - Math.max(0, time - w.wrappedAt) / 500);
