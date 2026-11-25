import { describe, expect, it } from 'vitest';
import { BELFRY, bellSwing, HOUSE, SWING } from './attraction';

describe('bellSwing', () => {
  it('swings the bell there and back, never further than it can go', () => {
    expect(bellSwing(0)).toBe(0);
    expect(bellSwing(SWING / 4)).toBeCloseTo(0.4);
    expect(bellSwing((SWING * 3) / 4)).toBeCloseTo(-0.4);
  });
});

describe('the schoolhouse', () => {
  it('keeps its spire and star inside the square', () => {
    // The scene's ground sits 66 units down; the star stands on the belfry's top, 21 above it.
    const top = 66 - (HOUSE.h + 6 + BELFRY.h) - 21;
    expect(top).toBeGreaterThanOrEqual(0);
  });
});
