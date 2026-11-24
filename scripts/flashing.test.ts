import { describe, expect, it } from 'vitest';
import {
  flashingArea,
  luminance,
  MAX_FLASHING_AREA,
  MAX_PER_SECOND,
  maxFlashesPerSecond,
  type Sample,
} from './flashing.ts';

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

describe('flash counting', () => {
  it('counts a swing and its return as one flash, without overlap', () => {
    // A change every 250 ms: two full cycles a second, so two flashes.
    const slow = sample(4000, 25, (t) => (Math.floor(t / 250) % 2 ? 1 : 0));
    expect(maxFlashesPerSecond(slow)).toBe(2);
  });
});

describe('flashingArea', () => {
  it('finds halves that swap black and white, which an average would hide', () => {
    const left = sample(2000, 25, (t) => (Math.floor(t / 50) % 2 ? 1 : 0));
    const right = sample(2000, 25, (t) => (Math.floor(t / 50) % 2 ? 0 : 1));
    const average = left.map((s, i) => ({
      t: s.t,
      brightness: (s.brightness + right[i].brightness) / 2,
    }));
    expect(maxFlashesPerSecond(average)).toBe(0);
    expect(flashingArea([left, left, right, right])).toBeGreaterThan(MAX_FLASHING_AREA);
  });

  it('allows a small twinkle in one corner', () => {
    const still = sample(2000, 25, () => 0.5);
    const twinkle = sample(2000, 25, (t) => (Math.floor(t / 50) % 2 ? 1 : 0));
    expect(flashingArea([twinkle, ...Array.from({ length: 15 }, () => still)])).toBeLessThanOrEqual(
      MAX_FLASHING_AREA,
    );
  });
});
