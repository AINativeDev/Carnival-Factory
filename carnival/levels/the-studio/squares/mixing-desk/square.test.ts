import { describe, expect, it } from 'vitest';
import { SLIDERS, sliderAt } from './square';

describe('sliderAt', () => {
  it('keeps every slider in its slot, each moving on its own', () => {
    for (let time = 0; time < 5_000; time += 250)
      for (let n = 0; n < SLIDERS; n++) {
        expect(sliderAt(time, n)).toBeGreaterThanOrEqual(0);
        expect(sliderAt(time, n)).toBeLessThanOrEqual(1);
      }
    expect(sliderAt(1_000, 0)).not.toBeCloseTo(sliderAt(1_000, 1));
  });
});
