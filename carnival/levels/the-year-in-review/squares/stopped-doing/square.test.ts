import { describe, expect, it } from 'vitest';
import square, { PERIOD, strikeDrawn } from './square';

describe('strikeDrawn', () => {
  it('moves gently there and back, the same every round', () => {
    expect(strikeDrawn(0)).toBeCloseTo(0);
    expect(strikeDrawn(PERIOD / 4)).toBeCloseTo(1);
    expect(strikeDrawn((PERIOD * 3) / 4)).toBeCloseTo(-1);
    expect(strikeDrawn(PERIOD + 123)).toBeCloseTo(strikeDrawn(123));
  });
});

describe('the item', () => {
  it('stands on a display, named for its question', () => {
    expect(square.stall?.display).toBe(true);
    expect(square.description.endsWith('?')).toBe(true);
  });
});
