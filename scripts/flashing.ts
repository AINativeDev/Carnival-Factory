/**
 * The flashing check the smoke test runs on every square: plain functions, so
 * the rule can be tested on made-up frames. It follows the general flash
 * threshold in WCAG 2.3.1: a flash is a pair of opposing changes in relative
 * luminance of 10% or more, where the darker side is below 0.8, and nothing
 * may flash more than three times in any one second.
 */

/** The most flashes allowed in any one second. */
export const MAX_FLASHES_PER_SECOND = 3;
/** The smallest change in relative luminance that counts towards a flash. */
const CHANGE = 0.1;
/** A change only counts while its darker side is below this. */
const DARK = 0.8;

/** One frame's luminance in each region of the square, from 0 to 1, at `time` milliseconds. */
export interface Sample {
  time: number;
  regions: readonly number[];
}

/**
 * When one region's luminance swung up or down far enough to count, each the
 * opposite way to the last: a swing is measured from the darkest or brightest
 * point since the last one, so a slow fade counts as much as a jump.
 */
function swings(samples: readonly Sample[], region: number): { time: number; up: boolean }[] {
  const out: { time: number; up: boolean }[] = [];
  let lo = samples[0]?.regions[region] ?? 0;
  let hi = lo;
  for (const { time, regions } of samples.slice(1)) {
    const v = regions[region];
    lo = Math.min(lo, v);
    hi = Math.max(hi, v);
    const last = out.at(-1)?.up;
    if (last !== true && v - lo >= CHANGE && lo < DARK) out.push({ time, up: true });
    else if (last !== false && hi - v >= CHANGE && v < DARK) out.push({ time, up: false });
    else continue;
    lo = hi = v;
  }
  return out;
}

/**
 * The most flashes any region made in any one second. A flash is a swing one
 * way and back, so two opposing swings make one.
 */
export function flashesPerSecond(samples: readonly Sample[]): number {
  const regions = samples[0]?.regions.length ?? 0;
  let most = 0;
  for (let region = 0; region < regions; region++) {
    const turns = swings(samples, region);
    for (let n = 0; n < turns.length; n++) {
      const inSecond = turns.filter(
        (t) => t.time >= turns[n].time && t.time < turns[n].time + 1000,
      );
      most = Math.max(most, Math.floor(inSecond.length / 2));
    }
  }
  return most;
}
