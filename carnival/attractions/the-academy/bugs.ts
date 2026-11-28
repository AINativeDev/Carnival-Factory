/**
 * The three bugs that scuttle across the test mat at the checks, and which one
 * a tap squashes. They wander on slow loops from `time` alone, so the
 * drawing and the rules always agree on where each one is.
 */

/** How many bugs there are to squash. */
export const BUGS = 3;
/** How far from a bug's middle a tap still squashes it, in the square's units. */
const REACH = 8;

/** Where bug `n` is at `time`, on the test mat on the floor, right of the ticket and under the checks' board. */
export function bugPlace(n: number, time: number): { x: number; y: number; heading: number } {
  const a = time / (1_100 + n * 270) + n * 2.1;
  const b = time / (1_500 + n * 190) + n * 1.3;
  return { x: 67 + 21 * Math.sin(a), y: 62 + 7 * Math.sin(b), heading: Math.cos(a) };
}

/** The bug a tap at `x`, `y` squashes at `time`, skipping those squashed already, or -1 for none. */
export function bugAt(x: number, y: number, time: number, squashed: readonly number[]): number {
  for (let n = 0; n < BUGS; n++) {
    if (squashed.includes(n)) continue;
    const place = bugPlace(n, time);
    if (Math.hypot(place.x - x, place.y - y) <= REACH) return n;
  }
  return -1;
}

/** The first bug not squashed yet, for the Squash button, or -1 once all are. */
export function nextBug(squashed: readonly number[]): number {
  for (let n = 0; n < BUGS; n++) if (!squashed.includes(n)) return n;
  return -1;
}
