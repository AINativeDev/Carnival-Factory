import { describe, expect, it } from 'vitest';
import { brightness, SWELL } from './square';

describe('brightness', () => {
  it('swells and fades slowly, and never goes dark', () => {
    for (let time = 0; time < SWELL * 2; time += 61) {
      expect(brightness(time)).toBeGreaterThanOrEqual(0.7);
      expect(brightness(time)).toBeLessThanOrEqual(1);
    }
    expect(brightness(SWELL / 4)).toBeCloseTo(1);
    expect(brightness((SWELL * 3) / 4)).toBeCloseTo(0.7);
  });
});
