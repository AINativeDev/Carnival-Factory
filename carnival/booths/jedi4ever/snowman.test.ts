import { describe, expect, it } from 'vitest';
import { SNOWMAN_GAP, snowmanAt, waveAngle, WAVE_REACH } from './snowman';

describe('snowmanAt', () => {
  it('stands the same way every time it is asked', () => {
    expect(snowmanAt(3)).toEqual(snowmanAt(3));
  });

  it('is there now and then, not at every spot and not never', () => {
    const found = Array.from({ length: 60 }, (_, i) => snowmanAt(i)).filter(Boolean);
    expect(found.length).toBeGreaterThan(10);
    expect(found.length).toBeLessThan(50);
  });

  it('stands on either side of the road', () => {
    const sides = new Set(Array.from({ length: 60 }, (_, i) => snowmanAt(i)?.side));
    expect(sides.has(-1)).toBe(true);
    expect(sides.has(1)).toBe(true);
  });

  it('keeps a long gap between snowmen', () => {
    expect(SNOWMAN_GAP).toBeGreaterThanOrEqual(60);
  });
});

describe('waveAngle', () => {
  it('keeps the arm down while the van is far off', () => {
    expect(waveAngle(WAVE_REACH + 10, 1.234)).toBe(0);
  });

  it('keeps the arm down once the van has gone by', () => {
    expect(waveAngle(-3, 1.234)).toBe(0);
  });

  it('swings the arm up and down as the van passes', () => {
    const angles = [0, 0.1, 0.2, 0.3, 0.4].map((t) => waveAngle(5, t));
    expect(Math.max(...angles)).toBeGreaterThan(0.3);
    expect(Math.min(...angles)).toBeLessThan(Math.max(...angles) - 0.3);
    expect(new Set(angles).size).toBeGreaterThan(1);
  });
});
