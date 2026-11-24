import { describe, expect, it } from 'vitest';
import { RIDE, sleighAt, trackY } from './plot';

describe('trackY', () => {
  it('is highest at the top of the hill, in the middle', () => {
    for (const x of [0, 16, 30, 70, 84, 100]) expect(trackY(50)).toBeLessThan(trackY(x));
  });

  it('stays inside the plot', () => {
    for (let x = 0; x <= 100; x++) {
      expect(trackY(x)).toBeGreaterThan(20);
      expect(trackY(x)).toBeLessThan(90);
    }
  });
});

describe('sleighAt', () => {
  it('rides the track from one edge to the other', () => {
    expect(sleighAt(0).x).toBe(0);
    expect(sleighAt(RIDE / 2).x).toBeCloseTo(50);
    expect(sleighAt(RIDE - 1).x).toBeCloseTo(100, 0);
    const { x, y } = sleighAt(RIDE / 3);
    expect(y).toBeCloseTo(trackY(x));
  });

  it('only ever goes forwards', () => {
    let last = -1;
    for (let time = 0; time < RIDE; time += 50) {
      const { x } = sleighAt(time);
      expect(x).toBeGreaterThanOrEqual(last);
      last = x;
    }
  });

  it('climbs the hill and tips down the other side', () => {
    expect(sleighAt(RIDE * 0.4).angle).toBeLessThan(0);
    expect(sleighAt(RIDE * 0.6).angle).toBeGreaterThan(0);
  });
});
