import { describe, expect, it } from 'vitest';
import { carouselRiders, TURN } from './attraction';

describe('carouselRiders', () => {
  it('starts the first reindeer at the front, in the middle', () => {
    const [first] = carouselRiders(4, 0);
    expect(first.across).toBeCloseTo(0);
    expect(first.depth).toBeCloseTo(1);
  });

  it('keeps every reindeer on the carousel and its pole', () => {
    for (let time = 0; time < TURN; time += 250) {
      for (const { across, depth, lift } of carouselRiders(6, time)) {
        expect(Math.hypot(across, depth)).toBeCloseTo(1);
        expect(lift).toBeGreaterThanOrEqual(0);
        expect(lift).toBeLessThanOrEqual(1);
      }
    }
  });

  it('comes back round after a full turn', () => {
    expect(carouselRiders(6, TURN)).toEqual(carouselRiders(6, 0));
  });
});
