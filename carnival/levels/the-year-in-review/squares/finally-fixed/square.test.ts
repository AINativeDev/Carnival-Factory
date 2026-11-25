import { describe, expect, it } from 'vitest';
import square, { PERIOD, wrenchTurn } from './square';

describe('wrenchTurn', () => {
  it('moves gently there and back, the same every round', () => {
    expect(wrenchTurn(0)).toBeCloseTo(0);
    expect(wrenchTurn(PERIOD / 4)).toBeCloseTo(1);
    expect(wrenchTurn((PERIOD * 3) / 4)).toBeCloseTo(-1);
    expect(wrenchTurn(PERIOD + 123)).toBeCloseTo(wrenchTurn(123));
  });
});

describe('the item', () => {
  it('stands on a display, named for its question', () => {
    expect(square.stall?.display).toBe(true);
    expect(square.description.endsWith('?')).toBe(true);
  });
});
