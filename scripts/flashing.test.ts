import { describe, expect, it } from 'vitest';
import { luminance, MAX_PER_SECOND, maxFlashesPerSecond, type Sample } from './flashing.ts';

/** Brightness sampled every `step` ms for `ms`, from `at(t)`. */
const sample = (ms: number, step: number, at: (t: number) => number): Sample[] =>
  Array.from({ length: Math.floor(ms / step) }, (_, i) => ({
    t: i * step,
    brightness: at(i * step),
  }));

describe('luminance', () => {
  it('runs from black to white', () => {
    expect(luminance(0, 0, 0)).toBe(0);
    expect(luminance(255, 255, 255)).toBeCloseTo(1);
  });
});

describe('maxFlashesPerSecond', () => {
  it('finds a fast strobe', () => {
    // On and off 10 times a second.
    const strobe = sample(2000, 25, (t) => (Math.floor(t / 50) % 2 ? 1 : 0));
    expect(maxFlashesPerSecond(strobe)).toBeGreaterThan(MAX_PER_SECOND);
  });

  it('allows a slow pulse', () => {
    // Once a second, gently.
    const pulse = sample(3000, 25, (t) => 0.5 + 0.4 * Math.sin((t / 1000) * 2 * Math.PI));
    expect(maxFlashesPerSecond(pulse)).toBeLessThanOrEqual(MAX_PER_SECOND);
  });

  it('ignores small flicker', () => {
    const flicker = sample(2000, 25, (t) => (Math.floor(t / 50) % 2 ? 0.52 : 0.5));
    expect(maxFlashesPerSecond(flicker)).toBe(0);
  });
});
