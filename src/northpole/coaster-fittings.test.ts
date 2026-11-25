import { describe, expect, it } from 'vitest';
import { drawingOf, fingerprint } from '../test-support/recording-canvas';
import { drawCoasterDrop, drawCoasterLift, drawCoasterStation } from './coaster-fittings';
import { STRAIGHT_TIME } from './coaster-pieces';
import { rideCoaster } from './coaster-ride';
import { theme } from './theme';
import type { Thing } from './world';

/** A ride east: a station, a lift hill up, a drop down, and a station again. */
const things = rideCoaster(
  (
    [
      ['coaster-station', 0, 0, 0],
      ['coaster-lift', 1, 0, 0.5],
      ['coaster-drop', 2, 0, 0.2],
      ['coaster-station', 3, 0, 0],
    ] as const
  ).map(([kind, x, y, seed]) => ({ kind, x, y, w: 1, h: 1, seed, blocks: false })),
);
const DRAW = {
  'coaster-station': drawCoasterStation,
  'coaster-lift': drawCoasterLift,
  'coaster-drop': drawCoasterDrop,
} as const;
const draw = (thing: Thing, time: number) =>
  drawingOf((ctx) => {
    if (thing.kind in DRAW) DRAW[thing.kind as keyof typeof DRAW](ctx, thing, time);
  });
const ride = (time: number) => things.flatMap((thing) => draw(thing, time));
const TIMES = [0, 600, 1400, STRAIGHT_TIME * 4];

describe('the coaster fittings', () => {
  it('draws the stations, the lift hill and the drop, with the ticket riding them, as pinned', () => {
    expect(TIMES.map((time) => fingerprint(ride(time)))).toMatchInlineSnapshot(`
      [
        "591f2c1ce55cb42b (404 calls)",
        "1d8bac64b32bee0b (404 calls)",
        "998a1be4d14d134c (404 calls)",
        "5110220a4fa2bac7 (404 calls)",
      ]
    `);
  });

  it('keeps every fitting still while the ticket moves on', () => {
    // The ticket is on the lift hill from 400 to 1300 milliseconds, and past it from 1320.
    const nth = (n: number) => {
      const thing = things.at(n);
      if (!thing) throw new Error(`no piece ${String(n)}`);
      return thing;
    };
    for (const n of [0, 2]) expect(draw(nth(n), 600)).toEqual(draw(nth(n), 1200));
    expect(draw(nth(1), 1600)).toEqual(draw(nth(1), 1700));
  });

  it('paints only with the theme', () => {
    const palette = new Set<unknown>(Object.values(theme.colors));
    for (const time of TIMES)
      for (const [name, value] of ride(time))
        if (name === '=fillStyle' || name === '=strokeStyle') expect(palette).toContain(value);
  });
});
