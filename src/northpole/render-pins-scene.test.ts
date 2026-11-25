/**
 * Pins the rest of the map's drawing, the people, the sky, the island and the
 * things standing on it, so splitting the renderer into small files
 * (docs/adr/0019-small-files.md) is proven to draw exactly the same.
 */
import { describe, expect, it } from 'vitest';
import { pinDrawing } from '../test-support/recording-canvas';
import { buildWorld, type ThingKind } from './world';
import * as render from './render';

const TIMES = [0, 4321];
const world = buildWorld(['ferris-wheel', 'gift-shop'], ['ann', 'bob', 'cat'], undefined, {
  levels: ['dan'],
});
const island = {
  top: { x: 0, y: -300 },
  right: { x: 600, y: 0 },
  bottom: { x: 0, y: 300 },
  left: { x: -600, y: 0 },
};
const KINDS: ThingKind[] = [
  'tree',
  'drift',
  'cabin',
  'lamp',
  'fence',
  'stable',
  'sleigh',
  'town-tree',
  'wheel',
  'tent',
  'bench',
  'cart',
  'arch',
  'banner',
  'bunting',
  'carousel',
];
const look = { coat: '#111111', hat: '#222222', scale: 1.2 };
const avatar = { width: 1, height: 1 } as unknown as CanvasImageSource;

/** Pins a drawing that returns nothing, once at each time in `TIMES`. */
const atTimes = (draw: (ctx: CanvasRenderingContext2D, time: number) => void) =>
  pinDrawing((ctx) => {
    for (const t of TIMES) draw(ctx, t);
  });

describe('the scene, pinned before the renderer split', () => {
  it('draws the people the same', () => {
    const prints: Record<string, string> = {};
    for (const facing of [-1, 1])
      for (const flag of [false, true]) {
        const at = `${String(facing)} ${String(flag)}`;
        prints[`person ${at}`] = atTimes((ctx, t) => {
          render.drawPerson(ctx, { x: 1, y: 2 }, look, facing, flag, t);
        });
        prints[`reindeer ${at}`] = atTimes((ctx, t) => {
          render.drawReindeer(ctx, { x: 3, y: 1 }, facing, flag, t);
        });
      }
    prints.portrait = atTimes((ctx, t) => {
      render.portrait(ctx, 12, t ? avatar : undefined);
    });
    expect(prints).toMatchSnapshot();
  });

  it('draws the sky and the island the same', () => {
    expect({
      sky: atTimes((ctx) => {
        render.drawSky(ctx, 800, 600);
      }),
      mountains: atTimes((ctx) => {
        render.drawMountains(ctx, 800, 600);
      }),
      clouds: atTimes((ctx, t) => {
        render.drawClouds(ctx, 800, 600, t);
      }),
      snowfall: atTimes((ctx, t) => {
        render.drawSnowfall(ctx, 800, 600, t);
      }),
      aurora: atTimes((ctx, t) => {
        render.drawAurora(ctx, 800, t, t ? 1 : 0.4);
      }),
      island: atTimes((ctx) => {
        render.drawIsland(ctx, world, island, 40);
      }),
      'front fence': atTimes((ctx) => {
        render.drawFrontFence(ctx, island);
      }),
      lights: atTimes((ctx, t) => {
        render.drawStringLights(ctx, island, t > 0, t);
      }),
      pools: atTimes((ctx, t) => {
        render.drawLightPools(ctx, world, t);
      }),
      ripples: atTimes((ctx, t) => {
        render.drawRipples(ctx, world, t);
      }),
    }).toMatchSnapshot();
  });

  it('draws every thing the same', () => {
    const prints: Record<string, string> = {};
    for (const kind of KINDS)
      for (const seed of [0.2, 0.8])
        prints[`${kind} ${String(seed)}`] = atTimes((ctx, t) => {
          render.drawThing(ctx, { kind, x: 3, y: -2, w: 2, h: 3, seed, blocks: true }, t);
        });
    expect(prints).toMatchSnapshot();
  });
});
