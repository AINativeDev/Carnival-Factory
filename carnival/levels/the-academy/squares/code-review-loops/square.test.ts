import { describe, expect, it } from 'vitest';
import { LOOP, lensAt, PAGES, reviewed } from './square';

describe('lensAt', () => {
  it('goes once round the loop and starts again', () => {
    expect(lensAt(0)).toBe(0);
    expect(lensAt(LOOP / 4)).toBeCloseTo(0.25);
    expect(lensAt(LOOP)).toBe(0);
  });
});

describe('reviewed', () => {
  it('ticks each page the lens has passed this round, and clears them for the next', () => {
    expect(reviewed(0)).toEqual(Array.from({ length: PAGES }, () => false));
    expect(reviewed(LOOP * 0.5).filter(Boolean)).toHaveLength(2);
    expect(reviewed(LOOP - 1).every(Boolean)).toBe(true);
  });
});
