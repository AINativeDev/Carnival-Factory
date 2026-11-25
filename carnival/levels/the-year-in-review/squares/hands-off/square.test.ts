import { describe, expect, it } from 'vitest';
import square, { PERIOD, lockSwing } from './square';

describe('lockSwing', () => {
  it('moves gently there and back, the same every round', () => {
    expect(lockSwing(0)).toBeCloseTo(0);
    expect(lockSwing(PERIOD / 4)).toBeCloseTo(1);
    expect(lockSwing((PERIOD * 3) / 4)).toBeCloseTo(-1);
    expect(lockSwing(PERIOD + 123)).toBeCloseTo(lockSwing(123));
  });
});

describe('the item', () => {
  it('stands on a display, named for its question', () => {
    expect(square.stall?.display).toBe(true);
    expect(square.description.endsWith('?')).toBe(true);
  });
});
