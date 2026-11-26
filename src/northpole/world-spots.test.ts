import { describe, expect, it } from 'vitest';
import pinned from './spots.json';
import { reachable } from './pathfinding';
import { key, type Box } from './world';
import { buildWorld } from './world-build';
import { attractionSpot, boothSpot, spotNumbers } from './world-spots';
import { ATTRACTIONS, booths } from '../test-support/sample-squares';

describe('spotNumbers', () => {
  it('keeps pinned squares on their numbers and gives the rest the lowest free ones', () => {
    const numbers = spotNumbers(['amy', 'bob', 'cat'], { bob: 0 });
    expect([...numbers]).toEqual([
      ['bob', 0],
      ['amy', 1],
      ['cat', 2],
    ]);
  });

  it('ignores a pin that is taken or not a spot number', () => {
    const numbers = spotNumbers(['amy', 'bob', 'cat'], { amy: 1, bob: 1, cat: -2 });
    expect(numbers.get('amy')).toBe(1);
    expect(new Set(numbers.values()).size).toBe(3);
  });

  it('pins every square that is on the map today', () => {
    expect(Object.keys(pinned.booths)).toContain('jedi4ever');
    expect(Object.keys(pinned.attractions).length).toBeGreaterThanOrEqual(8);
  });
});

describe('where each spot is', () => {
  it('grows new lanes as booths fill the old ones', () => {
    const small = buildWorld(ATTRACTIONS, booths(2));
    const big = buildWorld(ATTRACTIONS, booths(40));
    expect(big.extent).toBeGreaterThan(small.extent);
    expect(boothSpot(40)).not.toEqual(boothSpot(4));
  });

  it('puts attractions round the town square, closer in than any booth', () => {
    const near = (box: Box) => Math.max(Math.abs(box.x), Math.abs(box.y));
    for (let n = 0; n < 8; n++) expect(near(attractionSpot(n))).toBeLessThan(near(boothSpot(0)));
  });
});

describe('the sleigh station', () => {
  const levels = ['jedi4ever', 'snowelf', 'comet'];

  it('has a platform for each level by the main path, each with its door on it', () => {
    for (const count of [1, 10, 40]) {
      const world = buildWorld(ATTRACTIONS, booths(count), undefined, { levels });
      const platforms = world.spots.filter((spot) => spot.kind === 'platform');
      expect(platforms.map((spot) => spot.id)).toEqual(levels);
      const reach = reachable(world, world.start);
      for (const spot of platforms) {
        expect(world.ground.get(key(spot.door.x, spot.door.y))).toBe('path');
        expect(reach.has(key(spot.door.x, spot.door.y))).toBe(true);
        expect(Math.max(spot.x + spot.w, spot.y + spot.h)).toBeLessThanOrEqual(world.extent);
      }
      // No platform stands on any other spot.
      for (const spot of platforms)
        for (const other of world.spots) {
          if (other === spot) continue;
          const apart =
            spot.x + spot.w <= other.x ||
            other.x + other.w <= spot.x ||
            spot.y + spot.h <= other.y ||
            other.y + other.h <= spot.y;
          expect(apart, `${spot.id} and ${other.kind} ${other.id ?? other.number}`).toBe(true);
        }
    }
  });

  it('leaves the world as it was when there are no levels', () => {
    const before = buildWorld(ATTRACTIONS, booths(4));
    const after = buildWorld(ATTRACTIONS, booths(4), undefined, { levels: [] });
    expect(after.extent).toBe(before.extent);
    expect(after.spots).toEqual(before.spots);
  });
});
