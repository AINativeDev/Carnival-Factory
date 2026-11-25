import { describe, expect, it } from 'vitest';
import { levelWorld, validateLevel, type NorthPoleLevel } from './level';
import { LEVEL_PROPS } from './level-props';
import { key, walkable } from './world';

/** An open 15 by 15 level, with room for any prop in the middle and a stream down one side. */
const open = (props: NonNullable<NorthPoleLevel['props']>): NorthPoleLevel => ({
  id: 'someone',
  name: 'Somewhere',
  description: 'A test fair.',
  theme: 'dusk',
  size: 15,
  ground: [{ tile: 'water', area: { x: 14, y: 0, w: 1, h: 15 } }],
  props,
  arrival: { x: 1, y: 13 },
  exits: [{ x: 1, y: 1 }],
});

describe('the show in the catalogue', () => {
  it('gives each performer, ride and piece of dressing its footprint', () => {
    const footprints = Object.fromEntries(
      (
        [
          'fire-breather',
          'juggler',
          'stilt-walker',
          'acrobats',
          'band',
          'strongman',
          'ferris-wheel',
          'carousel',
          'balloon',
          'conveyor',
          'cog',
          'candy-pipe',
          'lantern',
        ] as const
      ).map((kind) => {
        const { w, h, blocks } = LEVEL_PROPS[kind];
        return [kind, `${String(w)}x${String(h)}${blocks ? '' : ' open'}`];
      }),
    );
    expect(footprints).toEqual({
      'fire-breather': '1x1',
      juggler: '1x1',
      'stilt-walker': '2x1',
      acrobats: '1x1',
      band: '1x1',
      strongman: '1x1',
      'ferris-wheel': '3x3',
      carousel: '3x3',
      balloon: '2x2',
      conveyor: '1x3',
      cog: '1x1',
      'candy-pipe': '2x1',
      lantern: '1x1 open',
    });
  });

  it('places every one of them in a level that keeps the rules', () => {
    for (const kind of Object.keys(LEVEL_PROPS) as (keyof typeof LEVEL_PROPS)[]) {
      expect(validateLevel(open([{ kind, x: 6, y: 6, variant: 0.5 }]), 'someone')).toEqual([]);
    }
  });

  it('blocks the whole of a ride, and lets people walk under a lantern', () => {
    const world = levelWorld(
      open([
        { kind: 'carousel', x: 4, y: 4 },
        { kind: 'lantern', x: 9, y: 9 },
      ]),
    );
    // The level is laid out centred on (0, 0), 7 tiles each way.
    for (let x = 4; x < 7; x++)
      for (let y = 4; y < 7; y++) expect(world.blocked.has(key(x - 7, y - 7))).toBe(true);
    expect(walkable(world, 2, 2)).toBe(true);
    expect(world.things.map((t) => [t.kind, t.w, t.h, t.blocks])).toEqual([
      ['carousel', 3, 3, true],
      ['lantern', 1, 1, false],
    ]);
  });

  it("won't put a ride on the water, across the edge or over a performer", () => {
    expect(validateLevel(open([{ kind: 'balloon', x: 13, y: 5 }]), 'someone')).toEqual([
      'prop 0, a balloon, stands on water or ice at 14, 5',
    ]);
    expect(validateLevel(open([{ kind: 'ferris-wheel', x: 13, y: 13 }]), 'someone')).toEqual([
      'prop 0, a ferris-wheel, is not inside the level',
    ]);
    expect(
      validateLevel(
        open([
          { kind: 'juggler', x: 7, y: 7 },
          { kind: 'carousel', x: 6, y: 6 },
        ]),
        'someone',
      ),
    ).toEqual(['prop 1, a carousel, stands on prop 0, a juggler, at 7, 7']);
  });

  it("won't let a ride shut a square away from visitors", () => {
    const walled = open([
      { kind: 'conveyor', x: 3, y: 0 },
      { kind: 'conveyor', x: 3, y: 3 },
      { kind: 'carousel', x: 0, y: 3 },
    ]);
    expect(validateLevel(walled, 'someone')).toEqual([
      "exit 0 can't be walked to from the arrival point",
    ]);
  });
});
