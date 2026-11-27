import { describe, expect, it } from 'vitest';
import {
  canStand,
  moveBy,
  nearestStand,
  spotAtDoor,
  strollAt,
  walkable,
  walkAlong,
} from './walking';
import { key, type Spot, type World } from './world';

/**
 * Walking at its edges, on a small bare world: the edge of the world, a body's
 * reach past its tile, exact distances and a stroll's turning point.
 */
const bare = (blocked: string[] = [], spots: Spot[] = []): World => ({
  ground: new Map(),
  blocked: new Set(blocked),
  things: [],
  spots,
  pond: { x: 0, y: 0, w: 0, h: 0 },
  paddock: { x: 0, y: 0, w: 0, h: 0 },
  strolls: [],
  extent: 3,
  start: { x: 0, y: 2 },
});

describe('where you can stand', () => {
  it('reaches the edge of the world on every side, and no further', () => {
    const world = bare();
    const sides = (far: number) => [
      { x: far, y: 0 },
      { x: -far, y: 0 },
      { x: 0, y: far },
      { x: 0, y: -far },
    ];
    for (const { x, y } of sides(3)) expect(walkable(world, x, y), `${x},${y}`).toBe(true);
    for (const { x, y } of sides(4)) expect(walkable(world, x, y), `${x},${y}`).toBe(false);
    expect(walkable(bare([key(1, 2)]), 1, 2)).toBe(false);
  });

  it("keeps a walker's body a fifth of a tile clear of anything blocked, on every side", () => {
    const right = bare([key(1, 0)]);
    expect(canStand(right, { x: 0.29, y: 0 })).toBe(true);
    expect(canStand(right, { x: 0.31, y: 0 })).toBe(false);
    const left = bare([key(-1, 0)]);
    expect(canStand(left, { x: -0.29, y: 0 })).toBe(true);
    expect(canStand(left, { x: -0.31, y: 0 })).toBe(false);
    const below = bare([key(0, 1)]);
    expect(canStand(below, { x: 0, y: 0.29 })).toBe(true);
    expect(canStand(below, { x: 0, y: 0.31 })).toBe(false);
    const above = bare([key(0, -1)]);
    expect(canStand(above, { x: 0, y: -0.31 })).toBe(false);
  });

  it('moves someone off a blocked tile to the nearest side, not a corner', () => {
    expect(nearestStand(bare([key(0, 0)]), { x: 0, y: 0 })).toEqual({ x: -1, y: 0 });
    expect(nearestStand(bare([key(0, 0), key(-1, 0)]), { x: 0, y: 0 })).toEqual({ x: 0, y: -1 });
  });

  it('measures the nearest side from wherever the walker stands', () => {
    expect(nearestStand(bare([key(1, 1)]), { x: 1, y: 1 })).toEqual({ x: 0, y: 1 });
    const threeSides = bare([key(0, 0), key(-1, 0), key(0, -1)]);
    expect(nearestStand(threeSides, { x: 0, y: 0 })).toEqual({ x: 0, y: 1 });
  });

  it('looks further out when every nearer tile is blocked', () => {
    const ring = [-1, 0, 1].flatMap((x) => [-1, 0, 1].map((y) => key(x, y)));
    expect(nearestStand(bare(ring), { x: 0, y: 0 })).toEqual({ x: -2, y: 0 });
  });

  it('reaches across the whole world for a walker off its edge', () => {
    const tiles = [-3, -2, -1, 0, 1, 2].flatMap((x) =>
      [-3, -2, -1, 0, 1, 2, 3].map((y) => key(x, y)),
    );
    expect(nearestStand(bare(tiles), { x: -4, y: 0 })).toEqual({ x: 3, y: 0 });
  });

  it('leaves a walker who can stand where they are, and one who does not move, just where they were', () => {
    const at = { x: 0.1, y: 0.1 };
    expect(nearestStand(bare(), at)).toBe(at);
    expect(moveBy(bare(), at, 0, 0)).toBe(at);
  });

  it('moves straight there when the way is clear, slantwise or along one axis', () => {
    expect(moveBy(bare(), { x: 0, y: 0 }, 0.1, 0.1)).toEqual({ x: 0.1, y: 0.1 });
    expect(moveBy(bare(), { x: 0, y: 0 }, 0, 0.1)).toEqual({ x: 0, y: 0.1 });
  });

  it('slides along y when only that half of the move is clear', () => {
    expect(moveBy(bare([key(1, 0), key(1, 1)]), { x: 0, y: 0 }, 1, 1)).toEqual({ x: 0, y: 1 });
  });
});

describe('walking a path, to the hundredth', () => {
  const path = [
    { x: 1, y: 0 },
    { x: 1, y: 2 },
  ];

  it('reaches a tile exactly as far as the walk goes, and drops it', () => {
    expect(walkAlong({ x: 0, y: 0 }, path, 1)).toEqual({
      position: { x: 1, y: 0 },
      path: [path[1]],
    });
  });

  it('goes part of the way along y too', () => {
    expect(walkAlong({ x: 0, y: 0 }, path, 2.5)).toEqual({
      position: { x: 1, y: 1.5 },
      path: [path[1]],
    });
  });

  it('stays put with no distance to go, even on a tile of the path', () => {
    expect(walkAlong({ x: 1, y: 0 }, path, 0)).toEqual({ position: { x: 1, y: 0 }, path });
  });
});

describe("the spot at a walker's door", () => {
  const spotAt = (x: number) => ({ door: { x, y: 0 } }) as Spot;

  it('is within three quarters of a tile of the door', () => {
    const world = bare([], [spotAt(0)]);
    expect(spotAtDoor(world, { x: 0.74, y: 0 })).toBe(world.spots[0]);
    expect(spotAtDoor(world, { x: 0, y: 0.75 })).toBeUndefined();
  });

  it('is the nearer of two doors', () => {
    const world = bare([], [spotAt(0), spotAt(1)]);
    expect(spotAtDoor(world, { x: 0.6, y: 0 })).toBe(world.spots[1]);
    expect(spotAtDoor(world, { x: 0.4, y: 0 })).toBe(world.spots[0]);
  });
});

describe('a stroll there and back', () => {
  const stroll = { from: { x: 1, y: 2 }, to: { x: 4, y: 6 }, seed: 0.5 };

  it('starts half-way through its round, at the far end, still facing there', () => {
    expect(strollAt(stroll, 0)).toEqual({ x: 4, y: 6, facing: 1 });
  });

  it('walks back at its own pace', () => {
    const at = strollAt(stroll, 1000);
    expect(at.x).toBeCloseTo(3.28);
    expect(at.y).toBeCloseTo(5.04);
    expect(at.facing).toBe(-1);
  });

  it('walks out again after it turns', () => {
    const at = strollAt({ ...stroll, seed: 0 }, 2500);
    expect(at.x).toBeCloseTo(1 + (3 * (2500 * 0.00084)) / 5);
    expect(at.y).toBeCloseTo(2 + (4 * (2500 * 0.00084)) / 5);
    expect(at.facing).toBe(1);
  });
});
