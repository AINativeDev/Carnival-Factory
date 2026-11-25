import { describe, expect, it } from 'vitest';
import square, { PERIOD, hypeSize } from './square';

describe('hypeSize', () => {
  it('moves gently there and back, the same every round', () => {
    expect(hypeSize(0)).toBeCloseTo(0);
    expect(hypeSize(PERIOD / 4)).toBeCloseTo(1);
    expect(hypeSize((PERIOD * 3) / 4)).toBeCloseTo(-1);
    expect(hypeSize(PERIOD + 123)).toBeCloseTo(hypeSize(123));
  });
});

describe('the item', () => {
  it('stands on a display, named for its question', () => {
    expect(square.stall?.display).toBe(true);
    expect(square.description.endsWith('?')).toBe(true);
  });
});
