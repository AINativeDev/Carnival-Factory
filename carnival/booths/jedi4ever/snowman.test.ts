import { describe, expect, it } from 'vitest';
import { WAVE_PERIOD, armAngle } from './snowman';

describe('armAngle', () => {
  it('swings slowly back and forth within a small arc', () => {
    for (let time = 0; time < 2 * WAVE_PERIOD; time += 100) {
      expect(Math.abs(armAngle(time))).toBeLessThanOrEqual(0.5);
    }
  });

  it('reaches both ends of the arc and repeats each period', () => {
    expect(armAngle(WAVE_PERIOD / 4)).toBeCloseTo(0.5);
    expect(armAngle((3 * WAVE_PERIOD) / 4)).toBeCloseTo(-0.5);
    expect(armAngle(1234 + WAVE_PERIOD)).toBeCloseTo(armAngle(1234));
  });
});
