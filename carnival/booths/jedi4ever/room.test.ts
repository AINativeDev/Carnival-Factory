import { describe, expect, it } from 'vitest';
import { snowflake, twinkle } from './room';

describe('the room', () => {
  it('keeps the snow inside the window', () => {
    for (let i = 0; i < 9; i++) {
      for (const time of [0, 777, 12_345, 99_999]) {
        const { x, y } = snowflake(i, time);
        expect(x).toBeGreaterThanOrEqual(0);
        expect(x).toBeLessThan(1);
        expect(y).toBeGreaterThanOrEqual(0);
        expect(y).toBeLessThan(1);
      }
    }
  });

  it('twinkles the lights softly, never off', () => {
    for (let time = 0; time < 10_000; time += 250) {
      expect(twinkle(3, time)).toBeGreaterThanOrEqual(0.55);
      expect(twinkle(3, time)).toBeLessThanOrEqual(1);
    }
  });
});
