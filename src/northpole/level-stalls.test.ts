import { describe, expect, it } from 'vitest';
import { drawingOf } from '../test-support/recording-canvas';
import { drawSpot } from './render';
import type { NorthPoleSquare } from './square';
import type { Spot } from './world';

const spot: Spot = {
  kind: 'attraction',
  id: 'workshop',
  number: 3,
  x: 2,
  y: 2,
  w: 2,
  h: 2,
  door: { x: 4, y: 2 },
};
const square = (stall?: NorthPoleSquare['stall']): NorthPoleSquare => ({
  id: 'workshop',
  name: 'Workshop',
  description: '',
  draw: () => undefined,
  ...(stall ? { stall } : {}),
});
const texts = (draw: (ctx: CanvasRenderingContext2D) => void) =>
  drawingOf(draw)
    .filter(([name]) => name === 'fillText')
    .map(([, text]) => String(text));

describe("a level's squares on the map", () => {
  it('stand as the stall each one chose, signed by nobody', () => {
    const signs = texts((ctx) => {
      drawSpot(ctx, spot, square({ shape: 'cabin', roof: 'pine' }), () => undefined, 0);
    });
    expect(signs).toContain('Workshop');
    expect(signs.some((text) => text.includes('@'))).toBe(false);
  });

  it('draw differently from the pavilion an attraction without a stall gets', () => {
    const cabin = drawingOf((ctx) => {
      drawSpot(ctx, spot, square({ shape: 'cabin', roof: 'pine' }), () => undefined, 0);
    });
    const pavilion = drawingOf((ctx) => {
      drawSpot(ctx, spot, square(), () => undefined, 0);
    });
    expect(cabin).not.toEqual(pavilion);
  });

  it("keep a booth's own sign, with its owner", () => {
    const signs = texts((ctx) => {
      drawSpot(
        ctx,
        { ...spot, kind: 'booth', id: 'ana' },
        { ...square({ shape: 'shed', roof: 'gold' }), id: 'ana' },
        () => undefined,
        0,
      );
    });
    expect(signs).toContain('by @ana');
  });
});
