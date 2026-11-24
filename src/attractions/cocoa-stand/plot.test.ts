import { describe, expect, it } from 'vitest';
import { RISE, steam } from './plot';

describe('steam', () => {
  it('rises from the mug and starts again', () => {
    expect(steam(0, 0).rise).toBe(0);
    expect(steam(0, RISE / 2).rise).toBeCloseTo(0.5);
    expect(steam(0, RISE).rise).toBeCloseTo(0);
  });

  it('stays between the mug and gone, and curls both ways', () => {
    for (let time = 0; time < RISE * 2; time += 100) {
      const { rise, curl } = steam(3, time);
      expect(rise).toBeGreaterThanOrEqual(0);
      expect(rise).toBeLessThan(1);
      expect(Math.abs(curl)).toBeLessThanOrEqual(1);
    }
  });

  it('gives each mug its own moment', () => {
    expect(steam(1, 0).rise).not.toBeCloseTo(steam(0, 0).rise);
  });
});
