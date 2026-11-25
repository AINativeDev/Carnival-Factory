import { describe, expect, it } from 'vitest';
import { gleam, PUFF, rise } from './motion';

describe('rise', () => {
  it('stays between 0 and 1 and repeats every puff', () => {
    for (const time of [0, 500, 3_199, 10_000, 123_456]) {
      for (const n of [0, 1, 2]) {
        const t = rise(time, n);
        expect(t).toBeGreaterThanOrEqual(0);
        expect(t).toBeLessThan(1);
        expect(rise(time + PUFF, n)).toBeCloseTo(t, 6);
      }
    }
  });
});

describe('gleam', () => {
  it('slides down the ice and starts over every 6 seconds', () => {
    expect(gleam(0)).toBe(0);
    expect(gleam(3_000)).toBeCloseTo(0.5);
    expect(gleam(6_000)).toBe(0);
  });
});
