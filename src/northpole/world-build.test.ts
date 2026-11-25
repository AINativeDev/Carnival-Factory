import { describe, expect, it } from 'vitest';
import { reachable } from './pathfinding';
import { canStand, nearestStand } from './walking';
import { key } from './world';
import { buildWorld, OPEN_PLOTS } from './world-build';
import { ATTRACTIONS, booths, placeOf, plotWhere } from '../test-support/sample-squares';

describe('buildWorld', () => {
  it('builds the same world from the same squares', () => {
    const a = buildWorld(ATTRACTIONS, booths(9));
    const b = buildWorld(ATTRACTIONS, booths(9));
    expect(b.plots).toEqual(a.plots);
    expect(b.things).toEqual(a.things);
    expect([...b.blocked].sort()).toEqual([...a.blocked].sort());
  });

  it('never moves an attraction or a pinned booth when a booth is added', () => {
    const pins = { attractions: {}, booths: { 'elf-1': 0, 'elf-0': 1, 'elf-2': 2 } };
    const before = buildWorld(ATTRACTIONS, booths(3), pins);
    // A new booth whose folder sorts before all the others.
    const after = buildWorld(ATTRACTIONS, ['aaron', ...booths(3)], pins);
    for (const id of [...ATTRACTIONS, ...booths(3)]) {
      expect(placeOf(after, id)).toEqual(placeOf(before, id));
    }
    const firstOpen = plotWhere(before, (p) => p.kind === 'open');
    expect(plotWhere(after, (p) => p.id === 'aaron').number).toBe(firstOpen.number);
  });

  it('gives a new booth the next free plot, the first open one', () => {
    const before = buildWorld(ATTRACTIONS, booths(4));
    const firstOpen = plotWhere(before, (p) => p.kind === 'open');
    const after = buildWorld(ATTRACTIONS, booths(5));
    const added = plotWhere(after, (p) => p.id === 'elf-4');
    expect({ x: added.x, y: added.y }).toEqual({ x: firstOpen.x, y: firstOpen.y });
  });

  it('keeps every plot, building and path apart', () => {
    const world = buildWorld(ATTRACTIONS.concat(booths(11)), booths(70));
    const covered = new Map<string, string>();
    for (const box of [...world.plots, ...world.things.filter((t) => t.blocks)]) {
      const name = JSON.stringify(box);
      for (let x = box.x; x < box.x + box.w; x++)
        for (let y = box.y; y < box.y + box.h; y++) {
          expect(covered.get(key(x, y)), name).toBeUndefined();
          covered.set(key(x, y), name);
        }
    }
    for (const plot of world.plots) {
      const door = world.ground.get(key(plot.door.x, plot.door.y));
      expect(door === 'path' || door === 'plaza').toBe(true);
    }
  });

  it('always has open plots waiting, more as booths are claimed', () => {
    for (const count of [0, 1, 6, 25]) {
      const world = buildWorld(ATTRACTIONS, booths(count));
      expect(world.plots.filter((p) => p.kind === 'open')).toHaveLength(OPEN_PLOTS);
      expect(world.plots.filter((p) => p.kind === 'booth')).toHaveLength(count);
    }
  });

  it('puts construction sites on their held plots, with open plots on top of them', () => {
    const pending = [
      { login: 'amy', issue: 7, plot: 4, stage: 'building' as const },
      { login: 'bob', issue: 9, plot: 5, stage: 'checks' as const },
    ];
    const world = buildWorld(ATTRACTIONS, booths(4), undefined, { pending });
    const sites = world.plots.filter((p) => p.kind === 'site');
    expect(sites.map((p) => [p.id, p.number])).toEqual([
      ['amy', 4],
      ['bob', 5],
    ]);
    expect(world.plots.filter((p) => p.kind === 'open').map((p) => p.number)).toEqual([6, 7, 8]);
    // The site stands where the booth will, and nothing else moves.
    const landed = buildWorld(ATTRACTIONS, [...booths(4), 'amy'], undefined, {
      files: { amy: { plot: 4, issue: 7 } },
      pending: pending.slice(1),
    });
    expect(placeOf(landed, 'amy')).toEqual(placeOf(world, 'amy'));
    for (const id of [...ATTRACTIONS, ...booths(4), 'bob'])
      expect(placeOf(landed, id)).toEqual(placeOf(world, id));
  });

  it('shows a change to an existing booth on that booth, not on a new plot', () => {
    const pending = [{ login: 'elf-1', issue: 7, plot: 1, stage: 'almost' as const }];
    const world = buildWorld(ATTRACTIONS, booths(3), undefined, { pending });
    expect(world.plots.filter((p) => p.kind === 'site')).toEqual([]);
    expect(world.plots.filter((p) => p.id === 'elf-1')).toHaveLength(1);
  });

  it('keeps the island small when a plot.json or a site claims a far plot', () => {
    const small = buildWorld(ATTRACTIONS, booths(4));
    const world = buildWorld(ATTRACTIONS, [...booths(4), 'amy'], undefined, {
      files: { amy: { plot: 9999 } },
      pending: [{ login: 'bob', issue: 9, plot: 9998, stage: 'building' }],
    });
    expect(world.extent).toBe(small.extent);
  });

  it('finds the nearest place to stand when a site went up where the player was', () => {
    const world = buildWorld(ATTRACTIONS, booths(4), undefined, {
      pending: [{ login: 'amy', issue: 7, plot: 4, stage: 'building' }],
    });
    const site = plotWhere(world, (p) => p.kind === 'site');
    const inside = { x: site.x + site.w / 2, y: site.y + site.h / 2 };
    expect(canStand(world, inside)).toBe(false);
    const stand = nearestStand(world, inside);
    expect(canStand(world, stand)).toBe(true);
    expect(Math.hypot(stand.x - inside.x, stand.y - inside.y)).toBeLessThan(site.w + site.h);
    expect(nearestStand(world, world.start)).toBe(world.start);
  });

  it('keeps growing for a big event: open plots, no overlaps, every plot reachable', () => {
    for (const count of [100, 500]) {
      const world = buildWorld(ATTRACTIONS, booths(count));
      expect(world.plots.filter((p) => p.kind === 'open')).toHaveLength(OPEN_PLOTS);
      const overlapping = world.plots.some((a, i) =>
        world.plots.some(
          (b, j) =>
            i < j && a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h,
        ),
      );
      expect(overlapping).toBe(false);
      const e = world.extent;
      expect(
        world.plots.every((p) => p.x >= -e && p.y >= -e && p.x + p.w <= e && p.y + p.h <= e),
      ).toBe(true);
      const reach = reachable(world, world.start);
      expect(world.plots.filter((p) => !reach.has(key(p.door.x, p.door.y)))).toEqual([]);
    }
  });
});
