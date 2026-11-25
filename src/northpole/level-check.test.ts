import { describe, expect, it } from 'vitest';
import { levelWorld, type NorthPoleLevel } from './level';
import { validateLevel } from './level-check';

/** A small level that passes: one square, one exit, open snow between. */
const small = (): NorthPoleLevel => ({
  id: 'someone',
  name: 'Somewhere',
  description: 'A small test level.',
  theme: 'dusk',
  size: 11,
  arrival: { x: 5, y: 8 },
  exits: [{ x: 1, y: 8 }],
  squares: [{ id: 'hut', x: 4, y: 2 }],
});

/** The problems with a level changed by `change`, as data a participant could write. */
const problemsWith = (change: Record<string, unknown>, folder = 'someone') =>
  validateLevel({ ...small(), ...change }, folder, ['hut']);

describe('checking what a level is called', () => {
  it('wants a login for a folder, and a name and description of a sensible length', () => {
    expect(problemsWith({ id: 'not a login' }, 'not a login')).toContain(
      'its folder "not a login" is not a GitHub login',
    );
    expect(problemsWith({ name: 42 })).toContain('its name is missing');
    expect(problemsWith({ name: '   ' })).toContain('its name is missing');
    expect(problemsWith({ description: 'x'.repeat(161) })).toContain(
      'its description is over 160 characters',
    );
  });
});

describe('checking where everything stands', () => {
  it('wants lists, and whole tiles inside the level for every area', () => {
    expect(problemsWith({ props: 'pine' })).toContain('its props must be a list');
    expect(
      problemsWith({
        ground: [
          null,
          { tile: 'path', area: 5 },
          { tile: 'path', area: { x: 0, y: 0, w: 0 } },
          { tile: 'path', area: { x: 10, y: 10, w: 2, h: 2 } },
        ],
        blocked: [{ x: 1.5, y: 0 }, null],
      }),
    ).toEqual([
      'ground 0 is "undefined", not one of snow, ice, path, water, bridge, floor, carpet',
      'ground 1 is not inside the level',
      'ground 2 is not inside the level',
      'ground 3 is not inside the level',
      'blocked area 0 is not inside the level',
      'blocked area 1 is not inside the level',
    ]);
  });

  it('wants a variant from 0 to 1, and one pond at most', () => {
    expect(
      problemsWith({
        props: [
          null,
          { kind: 'pine', x: 0, y: 0, variant: 2 },
          { kind: 'pond', x: 0, y: 4 },
          { kind: 'pond', x: 5, y: 6 },
        ],
      }),
    ).toEqual([
      'prop 0 is "undefined", which isn\'t in the catalogue',
      "prop 1's variant must be a number from 0 to 1",
      'it has more than one pond',
    ]);
  });

  it('wants every square named once, in kebab-case, and every exit a place', () => {
    const problems = validateLevel(
      {
        ...small(),
        squares: [
          null,
          { id: 7, x: 0, y: 0 },
          { id: 'hut', x: 4, y: 2 },
          { id: 'hut', x: 0, y: 0 },
        ],
        exits: [null],
      },
      'someone',
      ['hut'],
    );
    expect(problems).toEqual([
      "square 0's id must be kebab-case",
      "square 1's id must be kebab-case",
      'two squares are called "hut"',
      'exit 0 and its door must be inside the level',
    ]);
  });

  it('wants every square and its door inside the level', () => {
    expect(problemsWith({ squares: [{ id: 'hut', x: 9, y: 2 }] })).toEqual([
      'square "hut" and its door must be inside the level',
    ]);
    expect(problemsWith({ squares: [{ id: 'hut', x: 12, y: 2 }] })).toEqual([
      'square "hut" and its door must be inside the level',
    ]);
  });
});

describe('checking visitors can arrive', () => {
  it('wants the arrival point inside the level, on a tile a visitor can stand on', () => {
    expect(problemsWith({ arrival: { x: 11, y: 0 } })).toEqual([
      'its arrival point is not inside the level',
    ]);
    expect(problemsWith({ blocked: [{ x: 5, y: 8 }] })).toEqual([
      'visitors arrive on a tile they cannot stand on',
    ]);
  });

  it('lays out a level with no props and no ground', () => {
    const world = levelWorld(small());
    expect(world.things).toEqual([]);
    expect(world.ground.size).toBe(0);
  });
});
