import { describe, expect, it } from 'vitest';
import square, { PERIOD, dropSwing } from './square';

describe('dropSwing', () => {
  it('moves gently there and back, the same every round', () => {
    expect(dropSwing(0)).toBeCloseTo(0);
    expect(dropSwing(PERIOD / 4)).toBeCloseTo(1);
    expect(dropSwing((PERIOD * 3) / 4)).toBeCloseTo(-1);
    expect(dropSwing(PERIOD + 123)).toBeCloseTo(dropSwing(123));
  });
});

describe('the item', () => {
  it('stands on a display, named for its question', () => {
    expect(square.stall?.display).toBe(true);
    expect(square.description.endsWith('?')).toBe(true);
  });
});
