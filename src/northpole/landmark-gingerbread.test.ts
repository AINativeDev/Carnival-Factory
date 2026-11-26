/**
 * The Gingerbread Fun House on the map (issue #206): its name reads at the
 * opening zoom, its drawing still shows once, and the life round it moves
 * calmly from `time`, the same at the same moment.
 */
import { describe, expect, it } from 'vitest';
import { drawingOf, fingerprint, type CanvasCall } from '../test-support/recording-canvas';
import { chimneySmoke, PUFF } from './landmark-gingerbread-life';
import { drawGingerbreadHouse } from './landmark-gingerbread';
import type { NorthPoleSquare } from './square';
import type { Spot } from './world';

const spot: Spot = {
  kind: 'attraction',
  id: 'gingerbread-fun-house',
  number: 4,
  x: 5,
  y: 5,
  w: 3,
  h: 3,
  door: { x: 6, y: 8 },
};
const funHouse: NorthPoleSquare = {
  id: 'gingerbread-fun-house',
  name: 'Gingerbread Fun House',
  description: '',
  draw: () => undefined,
};

const drawnAt = (time: number, at: Spot = spot): CanvasCall[] =>
  drawingOf((ctx) => {
    drawGingerbreadHouse(ctx, at, funHouse, () => undefined, time);
  });

describe('the Gingerbread Fun House on the map', () => {
  it('wraps its name onto two lines, big enough to read at the opening zoom', () => {
    const calls = drawnAt(1000);
    const words = calls.filter(([name]) => name === 'fillText').map(([, text]) => text);
    expect(words).toEqual(['Gingerbread', 'Fun House']);
    const sizes = calls
      .filter(([name]) => name === '=font')
      .map(([, font]) => Number(/([\d.]+)px/.exec(String(font))?.[1]));
    expect(Math.min(...sizes)).toBeGreaterThanOrEqual(11);
  });

  it('paints its drawing once, with the door on either side', () => {
    for (const at of [spot, { ...spot, door: { x: 8, y: 6 } }]) {
      let painted = 0;
      drawingOf((ctx) => {
        drawGingerbreadHouse(ctx, at, funHouse, () => (painted += 1), 0);
      });
      expect(painted).toBe(1);
    }
  });

  it('draws the same at the same moment, and moves as time goes on', () => {
    expect(fingerprint(drawnAt(4321))).toBe(fingerprint(drawnAt(4321)));
    expect(fingerprint(drawnAt(4321))).not.toBe(fingerprint(drawnAt(5321)));
  });
});

describe('the chimney smoke', () => {
  const puffs = (time: number) =>
    drawingOf((ctx) => {
      chimneySmoke(ctx, { x: 0, y: 0 }, time);
    }).filter(([name]) => name === 'arc');

  it('rises in three puffs that come round again every PUFF', () => {
    expect(puffs(700)).toHaveLength(3);
    expect(puffs(700 + PUFF)).toEqual(puffs(700));
  });

  it('fades each puff as it rises, so none blinks off', () => {
    const fades = drawingOf((ctx) => {
      chimneySmoke(ctx, { x: 0, y: 0 }, PUFF - 1);
    })
      .filter(([name]) => name === '=globalAlpha')
      .map(([, alpha]) => Number(alpha));
    expect(Math.min(...fades.slice(0, 3))).toBeLessThan(0.01);
    expect(Math.max(...fades)).toBeLessThanOrEqual(1);
  });
});
