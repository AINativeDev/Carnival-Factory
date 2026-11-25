import { describe, expect, it } from 'vitest';
import { TOWER, WAVE, waveAt } from './square';

describe('waveAt', () => {
  it('spreads each wave out from the antenna in turn, then starts again', () => {
    expect(waveAt(0, 0)).toBe(0);
    expect(waveAt(WAVE / 2, 0)).toBeCloseTo(0.5);
    expect(waveAt(0, 2)).toBeCloseTo(2 / 3);
    expect(waveAt(WAVE, 0)).toBeCloseTo(0);
  });

  it('keeps the widest wave inside the square, from the top of the tower', () => {
    expect(66 - TOWER.h - 3 - TOWER.reach).toBeGreaterThanOrEqual(0);
  });
});
