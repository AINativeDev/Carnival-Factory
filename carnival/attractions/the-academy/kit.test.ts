import { describe, expect, it } from 'vitest';
import { easeIn, popIn, scatter, smooth, wrap } from './kit';

/** Every character one unit wide. */
const measure = (line: string) => line.length;

describe('wrapping words', () => {
  it('fills each line up to the width and keeps a too-long word whole', () => {
    expect(wrap('What helps an agent build', 12, measure)).toEqual([
      'What helps',
      'an agent',
      'build',
    ]);
    expect(wrap('Supercalifragilistic is long', 6, measure)).toEqual([
      'Supercalifragilistic',
      'is',
      'long',
    ]);
    expect(wrap('  ', 10, measure)).toEqual([]);
  });
});

describe('the easing and the scatter', () => {
  it('ease from 0 to 1 and stay there', () => {
    expect(smooth(-1)).toBe(0);
    expect(smooth(0.5)).toBe(0.5);
    expect(smooth(3)).toBe(1);
    expect(popIn(0)).toBeCloseTo(0);
    expect(popIn(1)).toBe(1);
    expect(Math.max(...[0.6, 0.7, 0.8, 0.9].map((t) => popIn(t)))).toBeGreaterThan(1);
    expect(Math.min(...[-1, 0, 0.01].map((t) => popIn(t)))).toBeGreaterThanOrEqual(0);
  });

  it('eases new words in over about 300 ms, rising one unit as they come', () => {
    expect(easeIn(-50)).toEqual({ alpha: 0, rise: 1 });
    expect(easeIn(150)).toEqual({ alpha: 0.5, rise: 0.5 });
    expect(easeIn(300)).toEqual({ alpha: 1, rise: 0 });
  });

  it('scatters the same way every time, between 0 and 1', () => {
    const all = Array.from({ length: 50 }, (_, n) => scatter(n));
    expect(all.every((s) => s >= 0 && s < 1)).toBe(true);
    expect(scatter(7)).toBe(scatter(7));
  });
});
