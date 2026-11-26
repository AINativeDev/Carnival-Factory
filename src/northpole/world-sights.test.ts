import { describe, expect, it } from 'vitest';
import { findPath } from './pathfinding';
import { key } from './world';
import { buildWorld } from './world-build';
import { ATTRACTIONS, booths } from '../test-support/sample-squares';

describe('the sights and the forest', () => {
  it('keeps scenery off attractions pinned past where their count would reach', () => {
    // An attraction pinned to 0 has gone, so eight are left on spots 1 to 8,
    // and one alone is pinned far out.
    const eight = ATTRACTIONS.concat(['a', 'b', 'c']);
    const gap = Object.fromEntries(eight.map((id, n) => [id, n + 1]));
    for (const world of [
      buildWorld(eight, booths(1), { attractions: gap, booths: {} }),
      buildWorld(['far'], booths(1), { attractions: { far: 48 }, booths: {} }),
    ]) {
      const things = world.things.filter((t) => t.blocks);
      for (const spot of world.spots.filter((p) => p.kind === 'attraction')) {
        for (let x = spot.x; x < spot.x + spot.w; x++)
          for (let y = spot.y; y < spot.y + spot.h; y++) {
            expect(world.ground.get(key(x, y)) ?? 'snow', spot.id).not.toMatch(/ice|water/);
            for (const thing of things)
              expect(
                x >= thing.x && x < thing.x + thing.w && y >= thing.y && y < thing.y + thing.h,
              ).toBe(false);
          }
        expect(findPath(world, world.start, spot.door), spot.id).toBeDefined();
      }
    }
  });

  it('has the pond, a stream with a bridge, cabins, a stable, the ferris wheel, tents, the arch and a forest', () => {
    const world = buildWorld(ATTRACTIONS, booths(3));
    const grounds = new Set(world.ground.values());
    for (const kind of ['ice', 'water', 'bridge', 'path', 'plaza'] as const)
      expect(grounds).toContain(kind);
    const kinds = new Set(world.things.map((t) => t.kind));
    for (const kind of [
      'tree',
      'cabin',
      'lamp',
      'fence',
      'stable',
      'sleigh',
      'town-tree',
      'wheel',
      'tent',
      'bench',
      'cart',
      'arch',
      'banner',
      'bunting',
    ] as const)
      expect(kinds).toContain(kind);
  });
});
