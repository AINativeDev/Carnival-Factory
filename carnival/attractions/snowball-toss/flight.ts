/**
 * A snowball's flight: it arcs from the hand at the counter towards where it
 * was aimed, and the wind blowing across the booth bends it on the way, so it
 * lands to one side of the aim. Each round has its own wind, gusting gently.
 * Plain functions in the attraction's 0 to 100 units.
 */

/** How long a snowball is in the air, in ms. */
export const FLIGHT = 600;
/** Where every snowball leaves the hand: the middle of the counter at the front. */
export const HAND = { x: 50, y: 94 };
/** How far a full wind blows a snowball aside by the time it lands, in units. */
export const DRIFT = 9;

/** Each round's steady wind, from -1 (blowing left) to 1 (blowing right): stronger each round. */
const WINDS = [0.25, -0.5, 0.7] as const;
/** How much the wind gusts either side of its steady blow. */
const GUST = 0.3;

/** One snowball thrown at `at` towards `x`, `y` in a wind of `wind`, and whether a person threw it. */
export interface Throw {
  x: number;
  y: number;
  at: number;
  wind: number;
  played: boolean;
}

/** The wind in `round`, counted from 1, at `time`: its steady blow and a slow gust. */
export function windAt(round: number, time: number): number {
  const steady = WINDS.at(Math.min(WINDS.length, Math.max(1, round)) - 1) ?? 0;
  return steady + Math.sin(time / 1_900) * GUST;
}

/** Where `ball` lands: where it was aimed, blown aside by its wind. */
export function landingOf(ball: Throw): { x: number; y: number } {
  return { x: ball.x + ball.wind * DRIFT, y: ball.y };
}

/** Where `ball` is at `time`, arcing up from the hand and bending in the wind, or undefined once it has landed. */
export function flightOf(ball: Throw, time: number): { x: number; y: number } | undefined {
  const t = (time - ball.at) / FLIGHT;
  if (t < 0 || t >= 1) return undefined;
  return {
    x: HAND.x + (ball.x - HAND.x) * t + ball.wind * DRIFT * t * t,
    y: HAND.y + (ball.y - HAND.y) * t - Math.sin(t * Math.PI) * 18,
  };
}
