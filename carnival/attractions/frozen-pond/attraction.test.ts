import { describe, expect, it } from 'vitest';
import { figureEight } from './attraction';

describe('figureEight', () => {
  it('starts and crosses itself in the middle of the pond', () => {
    expect(figureEight(0).x).toBeCloseTo(0);
    expect(figureEight(0).y).toBeCloseTo(0);
    expect(figureEight(0.5).x).toBeCloseTo(0);
    expect(figureEight(0.5).y).toBeCloseTo(0);
  });

  it('loops out to one side, then the other', () => {
    expect(figureEight(0.25).x).toBeCloseTo(1);
    expect(figureEight(0.75).x).toBeCloseTo(-1);
  });

  it('stays on the ice', () => {
    for (let phase = 0; phase < 1; phase += 0.01) {
      const { x, y } = figureEight(phase);
      expect(Math.abs(x)).toBeLessThanOrEqual(1);
      expect(Math.abs(y)).toBeLessThanOrEqual(0.5);
    }
  });
});
