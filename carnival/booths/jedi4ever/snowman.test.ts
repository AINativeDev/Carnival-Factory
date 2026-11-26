import { describe, expect, it } from 'vitest';
import type { Ctx } from './brushes';
import { SNOWMAN_GAP, snowmanAt, snowmen, waveAngle, WAVE_REACH } from './snowman';

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

/** The twig widths each snowman in view strokes, painted on a canvas that keeps only those. */
function twigWidths(size: number): number[] {
  const widths: number[] = [];
  const canvas = new Proxy(
    {
      set lineWidth(width: number) {
        widths.push(width);
      },
    },
    {
      get: (target, key) =>
        key in target ? (Reflect.get(target, key) as unknown) : () => undefined,
    },
  );
  for (const one of snowmen(size, 0, 0)) one.paint(canvas as unknown as Ctx);
  return widths;
}

describe('snowmen', () => {
  it('scales the twig arms with the square, even far down the road', () => {
    const small = twigWidths(100);
    const large = twigWidths(400);
    expect(small.length).toBeGreaterThan(0);
    small.forEach((width, i) => {
      expect(large[i]).toBeCloseTo(width * 4);
    });
  });
});
