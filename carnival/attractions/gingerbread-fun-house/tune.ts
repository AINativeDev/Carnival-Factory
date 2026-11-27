/**
 * Icing Echo's tune: how many notes the house knows each round, how fast it
 * plays them, and the steady pseudo-random picks that choose its notes and
 * which two the mirrors swap. Plain functions, so the tests can play it.
 */

/** How long the house waits before it plays a round's tune, in ms. */
export const LEAD = 1_000;
/** How long the fun-house mirrors take to swap two notes' places. */
export const SWAP = 1_400;
/** How long the house cheers a tune echoed right before the next round. */
export const CHEER = 1_100;
/** The first round on which the mirrors swap two notes once the house has played. */
export const SWAP_FROM = 4;

/** How many notes the house knows in `round`: four, a fifth from round 5 and a sixth from round 8. */
export function notesIn(round: number): number {
  return 4 + (round >= 5 ? 1 : 0) + (round >= 8 ? 1 : 0);
}

/** How long each note of `round`'s tune takes, in ms: quicker every round, down to a floor. */
export function stepOf(round: number): number {
  return Math.max(380, 760 - 32 * (round - 1));
}

/** A steady pseudo-random number from 0 to 1 for `seed` and `n`: the same every time it's asked. */
export function hash(seed: number, n: number): number {
  const s = Math.sin(seed * 12.9898 + n * 78.233) * 43_758.5453;
  return s - Math.floor(s);
}

/** A steady pick from 0 to `count` - 1 for `seed` and `n`. */
export function pick(seed: number, n: number, count: number): number {
  return Math.min(count - 1, Math.floor(hash(seed, n) * count));
}

/** Smooth from 0 to 1 as `t` goes from 0 to 1, flat outside. */
export function ease(t: number): number {
  const c = Math.min(1, Math.max(0, t));
  return c * c * (3 - 2 * c);
}

/**
 * How lit a note is `t` of the way through its light, from 0 to 1: it swells
 * in over the first fifth and fades over the rest, so it glows, never flashes.
 */
export function swell(t: number): number {
  if (t < 0 || t > 1) return 0;
  return t < 0.2 ? ease(t / 0.2) : 1 - ease((t - 0.2) / 0.8);
}
