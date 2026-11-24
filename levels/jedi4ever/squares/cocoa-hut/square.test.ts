import { describe, expect, it } from 'vitest';
import { steamAt } from './square';

describe('steamAt', () => {
  it('rises from 0 to 1 and starts again, each cup in turn', () => {
    expect(steamAt(0, 0)).toBe(0);
    expect(steamAt(1200, 0)).toBeCloseTo(0.5);
    expect(steamAt(2400, 0)).toBeCloseTo(0);
    expect(steamAt(0, 1)).toBeCloseTo(1 / 3);
  });
});
