import { describe, expect, it } from 'vitest';
import pinned from './plots.json';
import { reachable } from './pathfinding';
import { key, type Box } from './world';
import { buildWorld } from './world-build';
import { attractionPlot, boothPlot, plotNumbers } from './world-plots';
import { ATTRACTIONS, booths } from '../test-support/sample-squares';

describe('plotNumbers', () => {
  it('keeps pinned squares on their numbers and gives the rest the lowest free ones', () => {
    const numbers = plotNumbers(['amy', 'bob', 'cat'], { bob: 0 });
    expect([...numbers]).toEqual([
      ['bob', 0],
      ['amy', 1],
      ['cat', 2],
    ]);
  });

  it('ignores a pin that is taken or not a plot number', () => {
    const numbers = plotNumbers(['amy', 'bob', 'cat'], { amy: 1, bob: 1, cat: -2 });
    expect(numbers.get('amy')).toBe(1);
    expect(new Set(numbers.values()).size).toBe(3);
  });

  it('pins every square that is on the map today', () => {
    expect(Object.keys(pinned.booths)).toContain('jedi4ever');
    expect(Object.keys(pinned.attractions).length).toBeGreaterThanOrEqual(8);
  });
});

describe('where each plot is', () => {
  it('grows new lanes as booths fill the old ones', () => {
    const small = buildWorld(ATTRACTIONS, booths(2));
    const big = buildWorld(ATTRACTIONS, booths(40));
    expect(big.extent).toBeGreaterThan(small.extent);
    expect(boothPlot(40)).not.toEqual(boothPlot(4));
  });

  it('puts attractions round the town square, closer in than any booth', () => {
    const near = (box: Box) => Math.max(Math.abs(box.x), Math.abs(box.y));
    for (let n = 0; n < 8; n++) expect(near(attractionPlot(n))).toBeLessThan(near(boothPlot(0)));
  });
});

describe('the sleigh station', () => {
  const levels = ['jedi4ever', 'snowelf', 'comet'];

  it('has a platform for each level by the main path, each with its door on it', () => {
    for (const count of [1, 10, 40]) {
      const world = buildWorld(ATTRACTIONS, booths(count), undefined, { levels });
      const platforms = world.plots.filter((plot) => plot.kind === 'platform');
      expect(platforms.map((plot) => plot.id)).toEqual(levels);
      const reach = reachable(world, world.start);
      for (const plot of platforms) {
        expect(world.ground.get(key(plot.door.x, plot.door.y))).toBe('path');
        expect(reach.has(key(plot.door.x, plot.door.y))).toBe(true);
        expect(Math.max(plot.x + plot.w, plot.y + plot.h)).toBeLessThanOrEqual(world.extent);
      }
      // No platform stands on any other plot.
      for (const plot of platforms)
        for (const other of world.plots) {
          if (other === plot) continue;
          const apart =
            plot.x + plot.w <= other.x ||
            other.x + other.w <= plot.x ||
            plot.y + plot.h <= other.y ||
            other.y + other.h <= plot.y;
          expect(apart, `${plot.id} and ${other.kind} ${other.id ?? other.number}`).toBe(true);
        }
    }
  });

  it('leaves the world as it was when there are no levels', () => {
    const before = buildWorld(ATTRACTIONS, booths(4));
    const after = buildWorld(ATTRACTIONS, booths(4), undefined, { levels: [] });
    expect(after.extent).toBe(before.extent);
    expect(after.plots).toEqual(before.plots);
  });
});
