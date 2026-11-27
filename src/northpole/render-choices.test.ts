import { describe, expect, it } from 'vitest';
import { pinDrawing } from '../test-support/recording-canvas';
import { drawOpenSpot } from './open-spot';
import { drawAttraction } from './pavilion';
import { drawSpot } from './render';
import type { NorthPoleSquare } from './square';
import type { Spot } from './world';

const spot = (kind: Spot['kind']): Spot => ({
  kind,
  ...(kind === 'open' ? {} : { id: 'a' }),
  number: 4,
  x: 5,
  y: 5,
  w: 3,
  h: 3,
  door: { x: 6, y: 8 },
});
const square = (extra: object = {}): NorthPoleSquare => ({
  id: 'a',
  name: 'Santa’s Big Attraction',
  description: '',
  draw: () => undefined,
  ...extra,
});

describe('what drawSpot stands on a spot', () => {
  it('stands a free spot as one, still unless the player is at it, whatever square is given', () => {
    const open = spot('open');
    const still = pinDrawing((ctx) => drawOpenSpot(ctx, open, 500, false));
    expect(pinDrawing((ctx, paint) => drawSpot(ctx, open, undefined, paint, 500))).toBe(still);
    expect(pinDrawing((ctx, paint) => drawSpot(ctx, open, square(), paint, 500))).toBe(still);
    expect(pinDrawing((ctx, paint) => drawSpot(ctx, open, undefined, paint, 500, true))).toBe(
      pinDrawing((ctx) => drawOpenSpot(ctx, open, 500, true)),
    );
  });

  it('stands a booth spot with no square as a free spot', () => {
    const booth = spot('booth');
    expect(pinDrawing((ctx, paint) => drawSpot(ctx, booth, undefined, paint, 0))).toBe(
      pinDrawing((ctx) => drawOpenSpot(ctx, booth, 0, false)),
    );
  });

  it('stands an attraction as a pavilion whatever else it says it is, but a level square', () => {
    const attraction = spot('attraction');
    const other = square({ kind: 'attraction' });
    expect(pinDrawing((ctx, paint) => drawSpot(ctx, attraction, other, paint, 0))).toBe(
      pinDrawing((ctx, paint) => drawAttraction(ctx, attraction, other, paint, 0)),
    );
  });
});
