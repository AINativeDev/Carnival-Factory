import { describe, expect, it } from 'vitest';
import square, { PERIOD, beeRound } from './square';

describe('beeRound', () => {
  it('moves gently there and back, the same every round', () => {
    expect(beeRound(0)).toBeCloseTo(0);
    expect(beeRound(PERIOD / 4)).toBeCloseTo(1);
    expect(beeRound((PERIOD * 3) / 4)).toBeCloseTo(-1);
    expect(beeRound(PERIOD + 123)).toBeCloseTo(beeRound(123));
  });
});

describe('the item', () => {
  it('stands on a display, named for its question', () => {
    expect(square.stall?.display).toBe(true);
    expect(square.description.endsWith('?')).toBe(true);
  });
});
