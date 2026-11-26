import { assert, describe, expect, it } from 'vitest';
import { findPath, findPathToFirst, reachable } from './pathfinding';
import { walkable } from './walking';
import { key } from './world';
import { buildWorld } from './world-build';
import { ATTRACTIONS, booths } from '../test-support/sample-squares';

describe('finding the way', () => {
  const world = buildWorld(ATTRACTIONS, booths(10));

  it('finds a way from the town square to every spot', () => {
    for (const spot of world.spots) {
      const path = findPath(world, world.start, spot.door);
      assert(path, `${spot.kind} ${spot.id ?? spot.number}`);
      for (const step of path) expect(walkable(world, step.x, step.y)).toBe(true);
      expect(path.at(-1)).toEqual(spot.door);
    }
  });

  it('has no way to walk when already there, and none to goals nobody can stand on', () => {
    expect(findPath(world, world.start, world.start)).toEqual([]);
    expect(findPathToFirst(world, world.start, [{ x: 0, y: 0 }])).toBeUndefined();
  });

  it('takes the shortest way and no way at all to a blocked tile', () => {
    expect(findPath(world, { x: 0, y: 2 }, { x: 2, y: 2 })).toEqual([
      { x: 1, y: 2 },
      { x: 2, y: 2 },
    ]);
    expect(findPath(world, world.start, { x: 0, y: 0 })).toBeUndefined();
  });

  it('walks to the first goal it can reach, after any it cannot', () => {
    const { paddock } = world;
    const fenced = { x: paddock.x + 1, y: paddock.y + 1 };
    expect(walkable(world, fenced.x, fenced.y)).toBe(true);
    expect(reachable(world, world.start).has(key(fenced.x, fenced.y))).toBe(false);
    const goals = [fenced, { x: 0, y: 0 }, { x: 0, y: 2 }, { x: 1, y: 2 }];
    expect(findPathToFirst(world, world.start, goals)).toEqual(
      findPath(world, world.start, { x: 0, y: 2 }),
    );
    expect(findPathToFirst(world, world.start, [fenced, { x: 0, y: 0 }])).toBeUndefined();
  });
});
