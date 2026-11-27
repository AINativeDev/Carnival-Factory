import { describe, expect, it } from 'vitest';
import { levelOptions, northPoleOptions, square } from '../test-support/map-fixtures';
import { islandBox, layoutOf, layWorld, replan } from './map-plan';
import type { MapRun } from './map-state';

const island = {
  left: { x: -400, y: 10 },
  top: { x: 0, y: -200 },
  right: { x: 420, y: 12 },
  bottom: { x: 5, y: 230 },
};

describe("the box the island's cached layers cover", () => {
  it('takes in the island, its slab, the fence lights above it and a margin either side', () => {
    expect(islandBox(island)).toEqual({ x: -408, y: -240, w: 836, h: 606 });
  });

  it("reaches up past an indoor level's back walls instead", () => {
    expect(islandBox(island, true)).toEqual({ x: -408, y: -336, w: 836, h: 702 });
  });
});

describe('laying out the world', () => {
  it("lays out a level's own world as it is", () => {
    const options = levelOptions([]);
    expect(layWorld(options, [])).toBe(options.level?.world);
  });

  it('names every spot in a line, open spots with no id', () => {
    const world = layWorld(northPoleOptions([]), []);
    const plan = layoutOf(world);
    expect(plan.split(',')).toHaveLength(world.spots.length);
    expect(plan).toContain('booth:jedi4ever:');
    expect(plan).toMatch(/(^|,)open::\d+(,|$)/);
    expect(plan).toMatch(/(^|,)platform:tester:\d+(,|$)/);
  });

  it('leaves out an attraction whose way in is already on the map', () => {
    const options = northPoleOptions([]);
    const withDevcon = northPoleOptions([], {
      attractions: [...options.attractions, { ...square('ai-devcon') }],
    });
    expect(layoutOf(layWorld(withDevcon, []))).toBe(layoutOf(layWorld(options, [])));
    expect(layoutOf(layWorld(options, []))).toContain('attraction:ferris-wheel:');
  });
});

describe('taking in new booth requests', () => {
  it('lays the world out again only when a spot moved', () => {
    const options = northPoleOptions([]);
    const m = { options, layout: '', pending: new Map() } as unknown as MapRun;
    expect(replan(m, [])).toBe(true);
    const first = m.world;
    expect(m.layout).toBe(layoutOf(first));
    expect(replan(m, [])).toBe(false);
    expect(m.world).toBe(first);
    const site = { login: 'zed', issue: 7, stage: 'building' as const, spot: 40 };
    expect(replan(m, [site])).toBe(true);
    expect(m.world).not.toBe(first);
    expect(m.pending.get('zed')).toBe(site);
    expect(m.layout).toContain('site:zed:');
  });
});
