/**
 * Pins every plot drawing the map makes, so splitting the renderer into small
 * files (docs/adr/0019-small-files.md) is proven to draw exactly the same:
 * each fingerprint was taken before the split and must never change with a
 * move. A change that means to draw differently updates its pin on purpose.
 */
import { describe, expect, it, vi } from 'vitest';
import { pinDrawing } from '../test-support/recording-canvas';
import { STALL_SHAPES, type NorthPoleSquare, type StallStyle } from './square';
import type { Plot } from './world';
import type { Owner } from './name-board';
import { drawPlatform, drawUpdateSign } from './platform';
import { drawPlotGlow, drawSelectionBeam, drawSelectionRing, drawSparkles } from './plot-marks';
import { drawPlot } from './render';
import { drawSite } from './site';

// The honours come from data the build bakes in: here one booth holds them all.
vi.mock('./badges', async (load) => ({
  ...(await load<typeof import('./badges')>()),
  badgeFor: (login: string) => (login === 'honoured' ? { login, repo: 'a/b' } : undefined),
}));
vi.mock('./advent', async (load) => ({
  ...(await load<typeof import('./advent')>()),
  // A login with no count at all decorates nothing, like one with none.
  adventCountFor: (login: string) => ({ honoured: 24, some: 13, plain: 0 })[login],
}));
vi.mock('./peoples-choice', async (load) => ({
  ...(await load<typeof import('./peoples-choice')>()),
  trophyFor: (login: string) => (login === 'honoured' ? 2 : undefined),
}));

const TIMES = [0, 4321];
const front: Plot = {
  kind: 'booth',
  id: 'b',
  number: 3,
  x: 2,
  y: 4,
  w: 2,
  h: 2,
  door: { x: 2, y: 6 },
};
const side: Plot = { ...front, number: 4, door: { x: 4, y: 4 } };
const attraction: Plot = {
  ...front,
  kind: 'attraction',
  number: 5,
  w: 3,
  h: 3,
  door: { x: 5, y: 5 },
};
const avatar = { width: 1, height: 1 } as unknown as CanvasImageSource;
const OWNERS: (Owner | undefined)[] = [
  undefined,
  { color: '#ff0000', you: false },
  { color: '#00ff00', you: true, avatar },
  { color: '#0000ff', you: false, by: '' },
];

const square = (id: string, stall?: StallStyle): NorthPoleSquare => ({
  id,
  name: `The ${id} booth with a long name`,
  description: '',
  draw: () => undefined,
  ...(stall ? { stall } : {}),
});

/** Draws `plot` at every time in `TIMES`, with `square` on it. */
const atTimes = (plot: Plot, sq: NorthPoleSquare | undefined, near = false, owner?: Owner) =>
  pinDrawing((ctx, paint) => TIMES.map((t) => drawPlot(ctx, plot, sq, paint, t, near, owner)));

describe('the plots, pinned before the renderer split', () => {
  it('draws every stall shape the same, on either face, for every owner and honour', () => {
    const prints: Record<string, string> = {};
    for (const shape of STALL_SHAPES)
      for (const id of ['plain', 'some', 'honoured'])
        for (const [p, plot] of [front, side].entries())
          for (const [o, owner] of OWNERS.entries())
            prints[`${shape} ${id} ${String(p)} ${String(o)}`] = atTimes(
              plot,
              square(id, { shape, roof: 'pine' }),
              false,
              owner,
            );
    prints['default stall'] = atTimes(front, square('plain'));
    prints.trimmed = atTimes(side, square('x', { shape: 'tent', roof: 'gold', trim: 'violet' }));
    expect(prints).toMatchSnapshot();
  });

  it('draws attractions, towers and open plots the same', () => {
    const prints: Record<string, string> = {};
    for (const number of [0, 1, 2, 3])
      prints[`pavilion ${String(number)}`] = atTimes({ ...attraction, number }, square('a'));
    prints['pavilion front'] = atTimes({ ...attraction, door: { x: 2, y: 7 } }, square('a'));
    for (const shape of STALL_SHAPES)
      prints[`attraction ${shape}`] = atTimes(
        attraction,
        square('honoured', { shape, roof: 'berry' }),
      );
    prints.tower = atTimes(
      attraction,
      square('f', { shape: 'shed', roof: 'gold', landmark: 'tower', letters: 'TESSL' }),
    );
    prints.open = atTimes({ ...front, kind: 'open' }, undefined);
    prints['open near'] = atTimes({ ...front, kind: 'open' }, undefined, true);
    prints['no square'] = atTimes(front, undefined);
    expect(prints).toMatchSnapshot();
  });

  it('draws sites, platforms and the marks on a plot the same', () => {
    const label = { name: 'Frosty Fields', by: 'by @someone', color: '#123456' };
    const prints: Record<string, string> = {};
    for (const near of [false, true])
      for (const t of TIMES) {
        const at = `${String(near)} ${String(t)}`;
        prints[`site ${at}`] = pinDrawing((ctx) =>
          drawSite(ctx, side, { login: 'elf', stage: 'Building' }, t, near),
        );
        for (const closed of [false, true])
          prints[`platform ${at} ${String(closed)}`] = pinDrawing((ctx) =>
            drawPlatform(ctx, front, { ...label, closed }, t, near),
          );
      }
    prints.update = pinDrawing((ctx) => {
      drawUpdateSign(ctx, side);
    });
    for (const age of [-1, 0, 900, 2599, 2600])
      prints[`sparkles ${String(age)}`] = pinDrawing((ctx) => {
        drawSparkles(ctx, front, age);
      });
    for (const kind of ['attraction', 'booth', 'open'] as const)
      prints[`glow ${kind}`] = pinDrawing((ctx) => {
        drawPlotGlow(ctx, { ...front, kind }, 0.7);
      });
    for (const strength of [0, 0.5, 1]) {
      prints[`ring ${String(strength)}`] = pinDrawing((ctx) => {
        drawSelectionRing(ctx, front, strength);
      });
      prints[`beam ${String(strength)}`] = pinDrawing((ctx) => {
        drawSelectionBeam(ctx, side, -120, strength, 4);
      });
    }
    expect(prints).toMatchSnapshot();
  });
});
