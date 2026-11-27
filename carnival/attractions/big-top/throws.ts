/**
 * A bauble's flight in the Juggling Elf act: thrown from where it was caught,
 * up in an arc and down to the elf's other hand. Past the hands it keeps
 * falling to the ring's floor, and that's a drop. Everything is in the
 * scene's 0 to 100 units, and moves from `time`.
 */

/** Where the elf's hands are, how far apart, and the sawdust a dropped bauble lands on. */
export const HANDS = { x: 50, y: 63, spread: 8, floor: 76 };
/** How far into its flight a bauble can first be caught: from just past the top of its arc. */
export const CATCHABLE = 0.5;
/** How far into its flight a bauble falls past the hands before it's dropped. */
export const DROPPED = 1.16;
/** How far a tap may miss a bauble and still catch it, in scene units. */
export const REACH = 10;
/** The slowest and the quickest a bauble's flight takes, in ms, before each throw's own wobble. */
const SLOWEST = 2_300;
const QUICKEST = 1_350;

/** One throw of a bauble: when, from where, to which hand, how long it's up and how high it goes. */
export interface Toss {
  at: number;
  fromX: number;
  fromY: number;
  toX: number;
  dur: number;
  peak: number;
}

/** A steady pseudo-random number from 0 to 1 for `n`: the same every time, so throws vary but never jitter. */
export function wobble(n: number): number {
  const s = Math.sin(n * 12.9898 + 78.233) * 43_758.5453;
  return s - Math.floor(s);
}

/** How far through its flight a bauble is at `time`: below 0 still in the hand, 1 at the hands, past 1 falling. */
export function flight(toss: Toss, time: number): number {
  return (time - toss.at) / toss.dur;
}

/** Where a bauble is at `time`: on its arc, held before it's thrown, or lying on the sawdust once it fell. */
export function baubleAt(toss: Toss, time: number): { x: number; y: number } {
  const s = Math.max(0, flight(toss, time));
  // Past the hands it drifts on a little further, then lies where it fell.
  const along = Math.min(s, 1.25);
  const x = toss.fromX + (toss.toX - toss.fromX) * along;
  const y = toss.fromY + (HANDS.y - toss.fromY) * s - 4 * toss.peak * s * (1 - s);
  return { x, y: Math.min(HANDS.floor, y) };
}

/** How long a throw is up after `catches` catches: quicker as the act goes on. */
export function pace(catches: number): number {
  return Math.max(QUICKEST, SLOWEST - catches * 22);
}

/**
 * Throw number `n` of the act, at `time`, from (x, y) to the far hand: each
 * throw a little higher or lower and quicker or slower than the last, so the
 * baubles come down one at a time.
 */
export function tossFrom(x: number, y: number, time: number, catches: number, n: number): Toss {
  const side = x < HANDS.x ? 1 : -1;
  return {
    at: time,
    fromX: x,
    fromY: y,
    toX: HANDS.x + side * (HANDS.spread - 2 + wobble(n) * 4),
    dur: pace(catches) * (0.85 + wobble(n + 3) * 0.3),
    peak: 22 + wobble(n + 7) * 14,
  };
}
