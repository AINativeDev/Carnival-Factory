import { describe, expect, it } from 'vitest';
import square, { PERIOD, heatWave } from './square';

describe('heatWave', () => {
  it('moves gently there and back, the same every round', () => {
    expect(heatWave(0)).toBeCloseTo(0);
    expect(heatWave(PERIOD / 4)).toBeCloseTo(1);
    expect(heatWave((PERIOD * 3) / 4)).toBeCloseTo(-1);
    expect(heatWave(PERIOD + 123)).toBeCloseTo(heatWave(123));
  });
});

describe('the item', () => {
  it('stands on a display, named for its question', () => {
    expect(square.stall?.display).toBe(true);
    expect(square.description.endsWith('?')).toBe(true);
  });
});
