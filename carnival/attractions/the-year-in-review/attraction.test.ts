import { describe, expect, it } from 'vitest';
import { DRIFT, fleckAt, HALL } from './attraction';

describe('fleckAt', () => {
  it('drifts each fleck down the square and starts it again at the top', () => {
    expect(fleckAt(0, 0).y).toBe(4);
    expect(fleckAt(DRIFT / 2, 0).y).toBeCloseTo(39);
    expect(fleckAt(DRIFT, 0).y).toBeCloseTo(4);
    expect(fleckAt(-DRIFT / 4, 0).y).toBeCloseTo(56.5);
  });

  it('keeps every fleck inside the square', () => {
    for (let n = 0; n < 9; n++)
      for (const time of [0, 1234, 5678]) {
        const { x, y } = fleckAt(time, n);
        expect(x).toBeGreaterThanOrEqual(0);
        expect(x).toBeLessThanOrEqual(100);
        expect(y).toBeLessThanOrEqual(74);
      }
  });
});

describe('the gallery', () => {
  it('keeps its dome inside the square', () => {
    // The scene's ground sits 66 units down; the dome stands on the roof and rises 8 more.
    expect(66 - (HALL.h + 6) - 8).toBeGreaterThanOrEqual(0);
  });
});
