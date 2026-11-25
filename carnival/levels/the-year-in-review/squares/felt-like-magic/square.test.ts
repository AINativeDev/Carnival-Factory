import { describe, expect, it } from 'vitest';
import square, { PERIOD, sparkle } from './square';

describe('sparkle', () => {
  it('moves gently there and back, the same every round', () => {
    expect(sparkle(0)).toBeCloseTo(0);
    expect(sparkle(PERIOD / 4)).toBeCloseTo(1);
    expect(sparkle((PERIOD * 3) / 4)).toBeCloseTo(-1);
    expect(sparkle(PERIOD + 123)).toBeCloseTo(sparkle(123));
  });
});

describe('the item', () => {
  it('stands on a display, named for its question', () => {
    expect(square.stall?.display).toBe(true);
    expect(square.description.endsWith('?')).toBe(true);
  });
});
