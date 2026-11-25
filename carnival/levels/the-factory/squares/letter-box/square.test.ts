import { describe, expect, it } from 'vitest';
import { FLIGHT, letterAt } from './square';

describe('letterAt', () => {
  it('flies from the ground to the slot and starts again', () => {
    expect(letterAt(0, 0)).toBe(0);
    expect(letterAt(FLIGHT / 2, 0)).toBeCloseTo(0.5);
    expect(letterAt(FLIGHT, 0)).toBeCloseTo(0);
  });

  it('sends the letters in turn', () => {
    expect(letterAt(0, 1)).toBeCloseTo(1 / 3);
    expect(letterAt(0, 2)).toBeCloseTo(2 / 3);
  });
});
