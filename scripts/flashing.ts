/**
 * Seizure safety, after the WCAG "three flashes" rule: a flash is a pair of
 * opposite changes in brightness of at least `THRESHOLD`, and nothing may flash
 * more than `MAX_PER_SECOND` times in any one second. Plain functions over
 * brightness samples, so the smoke test can measure a square and Vitest can
 * test the rule.
 */

/** A change in relative brightness, 0 to 1, that counts as half a flash. */
export const THRESHOLD = 0.1;
export const MAX_PER_SECOND = 3;

export interface Sample {
  /** Milliseconds since sampling began. */
  t: number;
  /** Mean relative brightness of the square, 0 to 1. */
  brightness: number;
}

/** Relative luminance of an sRGB colour, 0 to 255 per channel. */
export function luminance(r: number, g: number, b: number): number {
  const linear = (c: number) => {
    const v = c / 255;
    return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * linear(r) + 0.7152 * linear(g) + 0.0722 * linear(b);
}

/**
 * The times of each flash: a swing of at least THRESHOLD one way, then one
 * back. Pairs don't overlap: after a flash, the next one needs two new swings.
 */
export function flashTimes(samples: readonly Sample[]): number[] {
  const flashes: number[] = [];
  let anchor = samples[0]?.brightness ?? 0;
  let lastDirection = 0;
  for (const { t, brightness } of samples) {
    const change = brightness - anchor;
    if (Math.abs(change) < THRESHOLD) continue;
    const direction = Math.sign(change);
    anchor = brightness;
    if (lastDirection !== 0 && direction !== lastDirection) {
      flashes.push(t);
      lastDirection = 0;
    } else {
      lastDirection = direction;
    }
  }
  return flashes;
}

/** The most flashes in any one-second window. */
export function maxFlashesPerSecond(samples: readonly Sample[]): number {
  const times = flashTimes(samples);
  let most = 0;
  for (let i = 0; i < times.length; i++) {
    let j = i;
    while (j < times.length && times[j] - times[i] < 1000) j++;
    most = Math.max(most, j - i);
  }
  return most;
}

/**
 * The share of the square that flashes too often: each cell of a grid has its
 * own brightness samples, so regions flashing out of step can't cancel out in
 * an average. WCAG counts a flash by area, so this is what the limit applies to.
 */
export function flashingArea(cells: readonly (readonly Sample[])[]): number {
  if (cells.length === 0) return 0;
  const flashing = cells.filter((cell) => maxFlashesPerSecond(cell) > MAX_PER_SECOND).length;
  return flashing / cells.length;
}

/** The largest share of the square that may flash more than MAX_PER_SECOND times a second. */
export const MAX_FLASHING_AREA = 0.25;
