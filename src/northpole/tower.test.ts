import { describe, expect, it } from 'vitest';
import { drawingOf } from '../test-support/recording-canvas';
import { cogTurn, drawTower, TOWER } from './tower';
import { drawPlot } from './render';
import { PAVILION } from './stall-plan';
import type { NorthPoleSquare } from './square';
import type { Plot } from './world';

const plot: Plot = {
  kind: 'attraction',
  id: 'the-factory',
  number: 9,
  x: 2,
  y: 2,
  w: 2,
  h: 2,
  door: { x: 4, y: 3 },
};
const square = (id: string, tower?: string): NorthPoleSquare => ({
  id,
  name: 'The Factory',
  description: '',
  draw: () => undefined,
  ...(tower ? { stall: { shape: 'shed' as const, roof: 'gold' as const, tower } } : {}),
});

describe('a tower', () => {
  it('spells TESSL down its front in gold, and still hangs its square at its foot', () => {
    let painted = 0;
    const calls = drawingOf((ctx) => {
      drawTower(ctx, plot, square('the-factory'), () => (painted += 1), 0, 'TESSL');
    });
    const texts = calls.filter(([name]) => name === 'fillText').map(([, text]) => text);
    for (const letter of 'TESSL') expect(texts).toContain(letter);
    expect(texts.some((text) => String(text).startsWith('The'))).toBe(true);
    expect(painted).toBe(1);
  });

  it('stands taller than any pavilion, so a click anywhere on it opens it', () => {
    let tower = { h: 0 };
    let pavilion = { h: 0 };
    drawingOf((ctx) => {
      tower = drawPlot(ctx, plot, square('the-factory', 'TESSL'), () => undefined, 0);
      pavilion = drawPlot(
        ctx,
        { ...plot, id: 'ferris-wheel' },
        square('ferris-wheel'),
        () => undefined,
        0,
      );
    });
    expect(tower.h).toBeGreaterThan(pavilion.h);
    expect(TOWER.hall + TOWER.tower).toBeGreaterThan(PAVILION.wall + PAVILION.roof);
  });

  it("is an attraction's to ask for: a booth asking for one keeps its stall", () => {
    let booth = { h: 0 };
    let tower = { h: 0 };
    drawingOf((ctx) => {
      booth = drawPlot(
        ctx,
        { ...plot, kind: 'booth', id: 'ana' },
        square('ana', 'ANA'),
        () => undefined,
        0,
      );
      tower = drawPlot(ctx, plot, square('the-factory', 'TESSL'), () => undefined, 0);
    });
    expect(booth.h).toBeLessThan(tower.h);
  });

  it('turns its cog once every twelve seconds', () => {
    expect(cogTurn(0)).toBe(0);
    expect(cogTurn(3_000)).toBeCloseTo(Math.PI / 2);
    expect(cogTurn(12_000)).toBeCloseTo(0);
  });
});
