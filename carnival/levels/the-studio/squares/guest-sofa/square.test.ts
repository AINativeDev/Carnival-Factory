import { describe, expect, it } from 'vitest';
import { STEAM, steamAt } from './square';

describe('steamAt', () => {
  it('rises from the cup and starts again, each wisp in turn', () => {
    expect(steamAt(0, 0)).toBe(0);
    expect(steamAt(STEAM / 2, 0)).toBeCloseTo(0.5);
    expect(steamAt(0, 1)).toBeCloseTo(1 / 3);
    expect(steamAt(STEAM, 0)).toBeCloseTo(0);
  });
});
