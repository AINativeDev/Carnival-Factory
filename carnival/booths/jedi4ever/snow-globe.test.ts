import { describe, expect, it } from 'vitest';
import { globeFlake, onGlobe, swirlOf, SWIRL } from './snow-globe';

describe('the snow globe', () => {
  it('swirls after a tap and settles in four seconds', () => {
    expect(swirlOf(0)).toBe(1);
    expect(swirlOf(SWIRL)).toBe(0);
    expect(swirlOf(-Infinity)).toBe(0);
    expect(globeFlake(3, 0)).not.toEqual(globeFlake(3, SWIRL));
    expect(globeFlake(3, SWIRL)).toEqual(globeFlake(3, SWIRL + 5_000));
    // Never tapped: the snow still rests on the bottom, at finite places.
    expect(globeFlake(3, Infinity)).toEqual(globeFlake(3, SWIRL));
    expect(Number.isFinite(globeFlake(3, Infinity).x)).toBe(true);
    expect(onGlobe(60, 76)).toBe(true);
    expect(onGlobe(10, 10)).toBe(false);
  });
});
