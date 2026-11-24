import { describe, expect, it } from 'vitest';
import { levelWorld, validateLevel, type NorthPoleLevel } from './level';
import { squaresByLevel } from './levels';
import { findPath, walkable } from './world';

/** A small level that passes: one square, one exit, open snow between. */
const small = (): NorthPoleLevel => ({
  id: 'someone',
  name: 'Somewhere',
  description: 'A small test level.',
  theme: 'dusk',
  size: 11,
  props: [{ kind: 'pine', x: 0, y: 0 }],
  arrival: { x: 5, y: 8 },
  exits: [{ x: 1, y: 8 }],
  squares: [{ id: 'hut', x: 4, y: 2 }],
});

describe('validateLevel', () => {
  it('passes a level that keeps every rule', () => {
    expect(validateLevel(small(), 'someone', ['hut'])).toEqual([]);
  });

  it('wants plain data, its own folder for an id, and a known theme', () => {
    expect(validateLevel(undefined, 'someone')).toEqual([
      'level.ts must export its NorthPoleLevel',
    ]);
    const problems = validateLevel({ ...small(), id: 'other', theme: 'neon' }, 'someone', ['hut']);
    expect(problems).toContain('its id must be "someone", its folder\'s name');
    expect(problems.some((p) => p.startsWith('its theme must be one of'))).toBe(true);
  });

  it('keeps to the size limits', () => {
    for (const size of [7, 10, 43, 12.5])
      expect(validateLevel({ ...small(), size }, 'someone', ['hut'])[0]).toMatch(/size/);
  });

  it('takes only known tiles and catalogue props, inside the level', () => {
    const problems = validateLevel(
      {
        ...small(),
        ground: [{ tile: 'lava', area: { x: 0, y: 0 } }],
        props: [
          { kind: 'rocket', x: 0, y: 0 },
          { kind: 'cabin', x: 9, y: 9 },
        ],
      },
      'someone',
      ['hut'],
    );
    expect(problems).toEqual([
      'ground 0 is "lava", not one of snow, ice, path, water, bridge',
      'prop 0 is "rocket", which isn\'t in the catalogue',
      'prop 1, a cabin, is not inside the level',
    ]);
  });

  it('puts nothing on water, or on top of anything else', () => {
    const problems = validateLevel(
      {
        ...small(),
        ground: [{ tile: 'water', area: { x: 4, y: 2, w: 1, h: 1 } }],
        props: [{ kind: 'lamp', x: 1, y: 9 }],
      },
      'someone',
      ['hut'],
    );
    expect(problems).toEqual([
      'square "hut" stands on water or ice at 4, 2',
      'exit 0 stands on prop 0, a lamp, at 1, 9',
    ]);
  });

  it('needs every square folder placed, and every placed square to have a folder', () => {
    expect(validateLevel(small(), 'someone', ['shed'])).toEqual([
      'square "hut" has no squares/hut/square.ts',
      "squares/shed/ isn't placed in the level's squares",
    ]);
  });

  it('has at most 8 squares, and at least one exit', () => {
    const squares = Array.from({ length: 9 }, (_, n) => ({ id: `s${n}`, x: 0, y: n }));
    expect(validateLevel({ ...small(), squares }, 'someone', [])).toContain(
      'it has over 8 squares',
    );
    expect(validateLevel({ ...small(), exits: [] }, 'someone', ['hut'])).toContain(
      'it needs at least one exit back to the North Pole',
    );
  });

  it('walks from the arrival point to every square and exit', () => {
    // A wall of water right across the level, between the arrival point and the hut.
    const walled = {
      ...small(),
      ground: [{ tile: 'water' as const, area: { x: 0, y: 5, w: 11, h: 1 } }],
    };
    expect(validateLevel(walled, 'someone', ['hut'])).toEqual([
      'square "hut" can\'t be walked to from the arrival point',
    ]);
    // A bridge over it lets visitors across.
    walled.ground.push({ tile: 'bridge' as never, area: { x: 6, y: 5, w: 1, h: 1 } });
    expect(validateLevel(walled, 'someone', ['hut'])).toEqual([]);
  });
});

describe('levelWorld', () => {
  it('centres the level, with its squares and exits on plots and visitors at the arrival', () => {
    const world = levelWorld(small());
    expect(world.extent).toBe(5);
    expect(world.start).toEqual({ x: 0, y: 3 });
    expect(world.plots.map((p) => [p.kind, p.id, p.x, p.y, p.door])).toEqual([
      ['attraction', 'hut', -1, -3, { x: 1, y: -3 }],
      ['exit', 'north-pole', -4, 3, { x: -2, y: 3 }],
    ]);
    expect(walkable(world, -5, -5)).toBe(false);
    expect(findPath(world, world.start, world.plots[0].door)).toBeDefined();
  });
});

describe('squaresByLevel', () => {
  it('lists each level’s squares from their paths', () => {
    const paths = ['../levels/b/squares/z/square.ts', '../levels/b/squares/a/square.ts'];
    expect(squaresByLevel(paths)).toEqual(new Map([['b', ['a', 'z']]]));
  });
});

// Every real level in levels/, as the page reads it: a broken one fails npm run check.
const levels = import.meta.glob<unknown>('../levels/*/level.ts', {
  eager: true,
  import: 'default',
});
const squares = squaresByLevel(Object.keys(import.meta.glob('../levels/*/squares/*/square.ts')));

describe('every level', () => {
  it('has at least the starter level', () => {
    expect(Object.keys(levels)).toContain('../levels/jedi4ever/level.ts');
  });

  for (const [path, level] of Object.entries(levels)) {
    const login = path.split('/').at(-2)!;
    it(`${login} passes validation`, () => {
      expect(validateLevel(level, login, squares.get(login) ?? [])).toEqual([]);
    });
  }
});
