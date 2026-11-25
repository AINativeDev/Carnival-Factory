// The plain timing behind the booth's motion, kept apart from the drawing so it can be tested.

/** How long a puff of steam takes to rise and fade, in milliseconds. */
export const PUFF = 3_200;

/** How far through its rise steam puff `n` is at `time`: 0 at the iron, 1 gone. */
export function rise(time: number, n: number): number {
  const t = (time / PUFF + n / 3) % 1;
  return t < 0 ? t + 1 : t;
}

/** Where the slow gleam on the frozen falls is, 0 to 1 from the top down, repeating every 6 seconds. */
export function gleam(time: number): number {
  const t = (time / 6_000) % 1;
  return t < 0 ? t + 1 : t;
}
