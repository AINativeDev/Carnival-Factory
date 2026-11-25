import { describe, expect, it } from 'vitest';
import square, { PERIOD, sunRise } from './square';

describe('sunRise', () => {
  it('moves gently there and back, the same every round', () => {
    expect(sunRise(0)).toBeCloseTo(0);
    expect(sunRise(PERIOD / 4)).toBeCloseTo(1);
    expect(sunRise((PERIOD * 3) / 4)).toBeCloseTo(-1);
    expect(sunRise(PERIOD + 123)).toBeCloseTo(sunRise(123));
  });
});

describe('the item', () => {
  it('stands on a display, named for its question', () => {
    expect(square.stall?.display).toBe(true);
    expect(square.description.endsWith('?')).toBe(true);
  });
});
