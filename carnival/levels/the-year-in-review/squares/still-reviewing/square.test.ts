import { describe, expect, it } from 'vitest';
import square, { PERIOD, lensAlong } from './square';

describe('lensAlong', () => {
  it('moves gently there and back, the same every round', () => {
    expect(lensAlong(0)).toBeCloseTo(0);
    expect(lensAlong(PERIOD / 4)).toBeCloseTo(1);
    expect(lensAlong((PERIOD * 3) / 4)).toBeCloseTo(-1);
    expect(lensAlong(PERIOD + 123)).toBeCloseTo(lensAlong(123));
  });
});

describe('the item', () => {
  it('stands on a display, named for its question', () => {
    expect(square.stall?.display).toBe(true);
    expect(square.description.endsWith('?')).toBe(true);
  });
});
