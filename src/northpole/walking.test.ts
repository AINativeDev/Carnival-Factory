import { assert, describe, expect, it } from 'vitest';
import { findPath } from './pathfinding';
import {
  canStand,
  moveBy,
  nearestStand,
  plotAtDoor,
  screenDirection,
  strollAt,
  walkable,
  walkAlong,
} from './walking';
import { key, toScreen } from './world';
import { buildWorld } from './world-build';
import { ATTRACTIONS, booths, plotWhere } from '../test-support/sample-squares';

describe('walking', () => {
  const world = buildWorld(ATTRACTIONS, booths(10));

  it('starts on open ground inside the entrance arch', () => {
    expect(canStand(world, world.start)).toBe(true);
  });

  it('blocks buildings, trees, stalls and water, but not paths or snow', () => {
    for (const thing of world.things.filter((t) => t.blocks))
      expect(walkable(world, thing.x, thing.y), JSON.stringify(thing)).toBe(false);
    for (const plot of world.plots.filter((p) => p.kind !== 'open'))
      expect(walkable(world, plot.x, plot.y)).toBe(false);
    for (const [at, ground] of world.ground)
      if (ground === 'water' || ground === 'ice') expect(world.blocked.has(at)).toBe(true);
    expect(walkable(world, world.extent + 1, 0)).toBe(false);
  });

  it('keeps clear of the town tree joining a path from part-way across a tile', () => {
    const at = { x: -0.71, y: 0.6 };
    expect(canStand(world, at)).toBe(true);
    // The map starts a click's walk at the middle of the player's own tile.
    const way = findPath(world, { x: -1, y: 1 }, { x: 0, y: 1 });
    assert(way);
    let walk = { position: at, path: [{ x: -1, y: 1 }, ...way] };
    while (walk.path.length) {
      walk = walkAlong(walk.position, walk.path, 0.02);
      expect(canStand(world, walk.position), JSON.stringify(walk.position)).toBe(true);
    }
  });

  it('stops at what is blocked and slides along it', () => {
    // The town tree is at (0, 0): walking straight into it goes nowhere.
    const below = { x: 0, y: 1 };
    expect(moveBy(world, below, 0, -0.5)).toEqual(below);
    // Walking at it slantwise slides past.
    expect(moveBy(world, below, 0.3, -0.5)).toEqual({ x: 0.3, y: 1 });
    expect(moveBy(world, { x: 0, y: 2 }, 0.5, 0)).toEqual({ x: 0.5, y: 2 });
  });

  it('turns the arrow keys into directions on screen', () => {
    const right = screenDirection(1, 0);
    const screen = toScreen(right);
    expect(screen.y).toBeCloseTo(0);
    expect(screen.x).toBeGreaterThan(0);
    const up = toScreen(screenDirection(0, -1));
    expect(up.x).toBeCloseTo(0);
    expect(up.y).toBeLessThan(0);
    expect(screenDirection(1, 0).x ** 2 + screenDirection(1, 0).y ** 2).toBeCloseTo(1);
    expect(screenDirection(0, 0)).toEqual({ x: 0, y: 0 });
  });

  it('walks along a path at the pace it is given', () => {
    const path = [
      { x: 1, y: 0 },
      { x: 2, y: 0 },
    ];
    expect(walkAlong({ x: 0, y: 0 }, path, 0.5)).toEqual({ position: { x: 0.5, y: 0 }, path });
    expect(walkAlong({ x: 0, y: 0 }, path, 1.5)).toEqual({
      position: { x: 1.5, y: 0 },
      path: [{ x: 2, y: 0 }],
    });
    expect(walkAlong({ x: 0, y: 0 }, path, 5)).toEqual({ position: { x: 2, y: 0 }, path: [] });
  });

  it('knows which plot you are standing at', () => {
    const booth = plotWhere(world, (p) => p.id === 'elf-3');
    expect(plotAtDoor(world, booth.door)).toBe(booth);
    expect(plotAtDoor(world, world.start)).toBeUndefined();
  });

  it('keeps a stroller with nowhere to go standing where they are', () => {
    const still = { from: { x: 2, y: 3 }, to: { x: 2, y: 3 }, seed: 0.5 };
    expect(strollAt(still, 5000)).toMatchObject({ x: 2, y: 3 });
  });

  it('keeps strollers on walkable ground', () => {
    for (const stroll of world.strolls)
      for (const time of [0, 5000, 60000]) {
        const at = strollAt(stroll, time);
        expect(walkable(world, Math.round(at.x), Math.round(at.y))).toBe(true);
      }
  });

  it('sends a walker with nowhere at all to stand back to the start', () => {
    const tiles = [-1, 0, 1].flatMap((x) => [-1, 0, 1].map((y) => key(x, y)));
    const walledIn = { ...world, extent: 1, blocked: new Set(tiles) };
    expect(nearestStand(walledIn, { x: 0, y: 0 })).toEqual(world.start);
  });
});
