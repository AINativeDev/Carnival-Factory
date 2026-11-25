import { describe, expect, it } from 'vitest';
import square, { PERIOD, bubbleBob } from './square';

describe('bubbleBob', () => {
  it('moves gently there and back, the same every round', () => {
    expect(bubbleBob(0)).toBeCloseTo(0);
    expect(bubbleBob(PERIOD / 4)).toBeCloseTo(1);
    expect(bubbleBob((PERIOD * 3) / 4)).toBeCloseTo(-1);
    expect(bubbleBob(PERIOD + 123)).toBeCloseTo(bubbleBob(123));
  });
});

describe('the item', () => {
  it('stands on a display, named for its question', () => {
    expect(square.stall?.display).toBe(true);
    expect(square.description.endsWith('?')).toBe(true);
  });
});
