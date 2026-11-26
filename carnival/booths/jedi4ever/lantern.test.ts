import { describe, expect, it } from 'vitest';
import { FLICKER_PERIOD, flameAt } from './lantern';

describe('flameAt', () => {
  it('stays gentle: the flame never dies down or flares up much', () => {
    for (let time = 0; time < 3 * FLICKER_PERIOD; time += 50) {
      const { height, strength } = flameAt(time);
      expect(height).toBeGreaterThanOrEqual(0.85);
      expect(height).toBeLessThanOrEqual(1.15);
      expect(strength).toBeGreaterThanOrEqual(0.7);
      expect(strength).toBeLessThanOrEqual(1);
    }
  });

  it('really flickers, and repeats each period', () => {
    expect(flameAt(0)).not.toEqual(flameAt(FLICKER_PERIOD / 3));
    expect(flameAt(777 + FLICKER_PERIOD).height).toBeCloseTo(flameAt(777).height);
  });
});
