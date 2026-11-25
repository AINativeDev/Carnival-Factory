import { describe, expect, it } from 'vitest';
import { blinking, HOP, hopHeight, PENGUIN_FEET, PENGUINS, penguinAt, shuffleOf } from './penguins';

/** Where penguin `index` stands at `time`, failing the test when there is no such penguin. */
function standing(index: number, time: number): number {
  const spot = PENGUINS.at(index);
  if (!spot) throw new Error(`No penguin ${String(index)}`);
  return spot.x + shuffleOf(index, time);
}

describe('the penguins', () => {
  it('finds the penguin under the pointer, and none on the empty floor', () => {
    PENGUINS.forEach((_, index) => {
      const x = standing(index, 0);
      expect(penguinAt(x, PENGUIN_FEET - 8, 0)).toBe(index);
      expect(penguinAt(x, PENGUIN_FEET - 14, 0)).toBe(index);
    });
    expect(penguinAt(standing(0, 0), 40, 0)).toBe(-1);
    expect(penguinAt(90, PENGUIN_FEET - 8, 0)).toBe(-1);
  });

  it('follows a penguin as it shuffles, never far from its spot', () => {
    for (let time = 0; time < 20_000; time += 250) {
      PENGUINS.forEach((penguin, index) => {
        const shuffle = shuffleOf(index, time);
        expect(Math.abs(shuffle)).toBeLessThanOrEqual(1.5);
        expect(penguinAt(penguin.x + shuffle, PENGUIN_FEET - 6, time)).toBe(index);
      });
    }
  });

  it('blinks now and then, and mostly keeps its eyes open', () => {
    const times = Array.from({ length: 4_000 }, (_, i) => i * 10);
    const shut = times.filter((time) => blinking(0, time)).length;
    expect(shut).toBeGreaterThan(0);
    expect(shut / times.length).toBeLessThan(0.1);
  });

  it('hops up and back down after a tap', () => {
    expect(hopHeight(-1)).toBe(0);
    expect(hopHeight(0)).toBe(0);
    expect(hopHeight(HOP / 2)).toBeCloseTo(6);
    expect(hopHeight(HOP)).toBe(0);
    expect(hopHeight(Infinity)).toBe(0);
  });

  it('follows a penguin up as it hops', () => {
    const x = standing(1, 0);
    const lifts = PENGUINS.map((_, index) => (index === 1 ? hopHeight(HOP / 2) : 0));
    expect(penguinAt(x, PENGUIN_FEET - 20, 0, lifts)).toBe(1);
    expect(penguinAt(x, PENGUIN_FEET - 20, 0)).toBe(-1);
    expect(penguinAt(x, PENGUIN_FEET + 1, 0, lifts)).toBe(-1);
  });
});
