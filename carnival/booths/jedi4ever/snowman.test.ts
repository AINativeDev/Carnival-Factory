import { describe, expect, it } from 'vitest';
import { WAVE_PERIOD, WAVE_REACH, waveOf } from './snowman';

describe('the snowman’s wave', () => {
  it('swings the arm slowly back and forth, never past its reach', () => {
    for (let time = 0; time < 2 * WAVE_PERIOD; time += 100) {
      expect(Math.abs(waveOf(time))).toBeLessThanOrEqual(WAVE_REACH + 1e-9);
    }
    expect(waveOf(WAVE_PERIOD / 4)).toBeCloseTo(WAVE_REACH);
    expect(waveOf((3 * WAVE_PERIOD) / 4)).toBeCloseTo(-WAVE_REACH);
  });

  it('repeats each period, and before time began too', () => {
    expect(waveOf(1234 + WAVE_PERIOD)).toBeCloseTo(waveOf(1234));
    expect(waveOf(-WAVE_PERIOD / 4)).toBeCloseTo(-WAVE_REACH);
  });
});
