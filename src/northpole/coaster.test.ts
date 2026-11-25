import { describe, expect, it } from 'vitest';
import { drawingOf, fingerprint } from '../test-support/recording-canvas';
import { drawCoaster, drawCoasterLoop } from './coaster';
import { LOOP_TIME, STRAIGHT_TIME, rideCoaster } from './coaster-ride';
import { levelWorld, type NorthPoleLevel } from './level';
import { validateLevel } from './level-check';
import { theme } from './theme';
import type { Thing } from './world';

/** A ride north and round a corner: a straight, a loop, then two straights turning east. */
const things = rideCoaster(
  (
    [
      ['coaster', 0, 3],
      ['coaster-loop', 0, 2],
      ['coaster', 0, 1],
      ['coaster', 1, 1],
    ] as const
  ).map(([kind, x, y]) => ({ kind, x, y, w: 1, h: 1, seed: 0, blocks: kind !== 'coaster' })),
);
const draw = (thing: Thing, time: number) =>
  drawingOf((ctx) => {
    (thing.kind === 'coaster-loop' ? drawCoasterLoop : drawCoaster)(ctx, thing, time);
  });
const ride = (time: number) => things.flatMap((thing) => draw(thing, time));
const TIMES = [0, 300, STRAIGHT_TIME + LOOP_TIME / 2, STRAIGHT_TIME + LOOP_TIME + 500];

describe('the coaster', () => {
  it('draws the track, the loop and the ticket riding them as pinned', () => {
    expect(TIMES.map((time) => fingerprint(ride(time)))).toMatchInlineSnapshot(`
      [
        "1d0202bd9a6c50c1 (393 calls)",
        "0f3928f89c684125 (393 calls)",
        "61bb4bf696339f30 (393 calls)",
        "4d9d5c6fe942dd03 (393 calls)",
      ]
    `);
  });

  it('draws the ticket on one piece at a time, the one it is riding', () => {
    for (const time of TIMES) {
      const tickets = things.filter((thing) =>
        draw(thing, time).some(([name, text]) => name === 'fillText' && text === '#'),
      );
      expect(tickets).toHaveLength(1);
    }
  });

  it('keeps the track still while the ticket moves on', () => {
    const first = things.at(0);
    if (!first) throw new Error('no track');
    expect(draw(first, 1000)).toEqual(draw(first, 1500));
    expect(draw(first, 100)).not.toEqual(draw(first, 200));
  });

  it('paints only with the theme', () => {
    const palette = new Set<unknown>(Object.values(theme.colors));
    for (const time of TIMES)
      for (const [name, value] of ride(time))
        if (name === '=fillStyle' || name === '=strokeStyle') expect(palette).toContain(value);
  });
});

describe('a coaster in a level', () => {
  const level = (props: NonNullable<NorthPoleLevel['props']>): NorthPoleLevel => ({
    id: 'someone',
    name: 'Somewhere',
    description: 'A test fair.',
    theme: 'dusk',
    size: 11,
    props,
    arrival: { x: 5, y: 9 },
    exits: [{ x: 0, y: 0 }],
  });

  it('is laid as a ride, which people walk under but not through a loop', () => {
    const world = levelWorld(
      level([
        { kind: 'coaster', x: 5, y: 5 },
        { kind: 'coaster-loop', x: 6, y: 5 },
      ]),
    );
    expect(world.things.map((thing) => [thing.kind, thing.blocks, thing.ride?.from])).toEqual([
      ['coaster', false, 0],
      ['coaster-loop', true, STRAIGHT_TIME],
    ]);
  });

  it("won't let the track jump from one place to another", () => {
    expect(
      validateLevel(
        level([
          { kind: 'coaster', x: 5, y: 5 },
          { kind: 'coaster', x: 7, y: 5 },
        ]),
        'someone',
      ),
    ).toEqual(["prop 1, a coaster, doesn't join prop 0, the coaster piece before it"]);
  });
});
