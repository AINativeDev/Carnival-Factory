/**
 * Indoor levels (ADR 0040): the floor, the walls a prop may hang on, and the
 * rules `validateLevel` keeps for them, so a room is checked like any level.
 */
import { describe, expect, it } from 'vitest';
import { levelWorld, type NorthPoleLevel } from './level';
import { validateLevel } from './level-check';
import { hangsOnWall, propPlace } from './level-props';
import { islandCorners } from './camera';
import { islandBox } from './map-plan';
import { FLAT } from './show';
import { walkable } from './walking';
import { key } from './world';

/** A small room with a door home, and whatever props a test gives it. */
const room = (
  props: NonNullable<NorthPoleLevel['props']>,
  extra: Partial<NorthPoleLevel> = {},
): NorthPoleLevel => ({
  id: 'someone',
  name: 'A room',
  description: 'A test room.',
  theme: 'dusk',
  indoor: true,
  size: 11,
  ground: [{ tile: 'carpet', area: { x: 3, y: 3, w: 3, h: 3 } }],
  props,
  arrival: { x: 5, y: 9 },
  exits: [{ x: 6, y: 6 }],
  ...extra,
});

describe('what hangs on a wall', () => {
  it('runs along the upper right wall on row 0, and down the upper left one otherwise', () => {
    expect(hangsOnWall('blackboard')).toBe(true);
    expect(hangsOnWall('desk')).toBe(false);
    expect(propPlace('blackboard', { x: 2, y: 0 })).toEqual({
      box: { x: 2, y: 0, w: 3, h: 1 },
      wall: 'right',
    });
    expect(propPlace('blackboard', { x: 0, y: 2 })).toEqual({
      box: { x: 0, y: 2, w: 1, h: 3 },
      wall: 'left',
    });
    expect(propPlace('sofa', { x: 4, y: 4 })).toEqual({ box: { x: 4, y: 4, w: 2, h: 1 } });
  });
});

describe('an indoor level', () => {
  it('passes the checks with its props on the walls and the floor', () => {
    const level = room([
      { kind: 'blackboard', x: 3, y: 0 },
      { kind: 'wall-window', x: 0, y: 4 },
      { kind: 'on-air-light', x: 0, y: 0 },
      { kind: 'rug', x: 1, y: 7 },
      { kind: 'plant', x: 9, y: 1 },
    ]);
    expect(validateLevel(level, 'someone')).toEqual([]);
  });

  it('hangs things only on the back walls of an indoor level', () => {
    expect(validateLevel(room([{ kind: 'wall-door', x: 4, y: 4 }]), 'someone')).toEqual([
      'prop 0, a wall-door, must hang on a back wall of an indoor level',
    ]);
    const outdoor = room([{ kind: 'acoustic-panel', x: 0, y: 3 }], { indoor: false });
    expect(validateLevel(outdoor, 'someone')).toEqual([
      'prop 0, a acoustic-panel, must hang on a back wall of an indoor level',
    ]);
    const odd = room([], { indoor: 'yes' as unknown as boolean });
    expect(validateLevel(odd, 'someone')).toEqual(['its indoor must be true or false']);
  });

  it('is floored with boards where its ground says nothing else, and says it is indoors', () => {
    const world = levelWorld(room([{ kind: 'projector-screen', x: 0, y: 2 }]));
    expect(world.indoor).toBe(true);
    expect(world.ground.get(key(-5, -5))).toBe('floor');
    expect(world.ground.get(key(-1, -1))).toBe('carpet');
    const screen = world.things.find((thing) => thing.kind === 'projector-screen');
    expect(screen).toMatchObject({ x: -5, y: -3, w: 1, h: 2, wall: 'left', blocks: true });
    expect(walkable(world, -5, -3)).toBe(false);
  });

  it('leaves an outdoor level as it was', () => {
    const world = levelWorld(room([], { indoor: false }));
    expect('indoor' in world).toBe(false);
    expect(world.ground.get(key(-5, -5))).toBeUndefined();
  });

  it('lets people walk over the rug and the cable, drawn flat under everything', () => {
    const world = levelWorld(
      room([
        { kind: 'rug', x: 1, y: 7 },
        { kind: 'cable', x: 8, y: 2 },
      ]),
    );
    expect(walkable(world, -4, 2)).toBe(true);
    expect(walkable(world, 3, -3)).toBe(true);
    expect([...FLAT].sort()).toEqual(['cable', 'confetti', 'drift', 'rug']);
  });

  it('caches its layers tall enough for its walls', () => {
    const island = islandCorners(levelWorld(room([])));
    const outdoor = islandBox(island);
    const indoor = islandBox(island, true);
    expect(indoor.y).toBeLessThan(outdoor.y - 80);
    expect(indoor.y + indoor.h).toBe(outdoor.y + outdoor.h);
  });
});
