/**
 * Pins the worlds the map lays out, so splitting the world's code into smaller
 * files (docs/adr/0019-small-files.md) is proven to build exactly the same
 * island and the same levels: every tile, thing, plot and stroll.
 */
import { createHash } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import pinned from './plots.json';
import { levelWorld } from './level';
import { findPath } from './pathfinding';
import { type World } from './world';
import { buildWorld } from './world-build';

const ATTRACTIONS = ['big-top', 'cocoa-stand', 'ferris-wheel', 'frozen-pond', 'sleigh-coaster'];
const booths = (count: number) => Array.from({ length: count }, (_, n) => `elf-${n}`);

/** A world as one short string: its maps and sets in a fixed order. */
const fingerprintOf = (world: World) =>
  createHash('sha256')
    .update(
      JSON.stringify({
        ...world,
        ground: [...world.ground].sort(),
        blocked: [...world.blocked].sort(),
      }),
    )
    .digest('hex')
    .slice(0, 16);

const levelModules = import.meta.glob<{ default: Parameters<typeof levelWorld>[0] }>(
  '../../carnival/levels/*/level.ts',
  { eager: true },
);

describe('the worlds the map lays out', () => {
  it('builds the same North Pole as before', () => {
    const worlds = [
      buildWorld(ATTRACTIONS, booths(3)),
      buildWorld(ATTRACTIONS.concat(booths(11)), booths(70), pinned),
      buildWorld(ATTRACTIONS, booths(9), undefined, {
        files: { 'elf-2': { plot: 12, issue: 4 } },
        pending: [{ login: 'amy', issue: 7, plot: 4, stage: 'building' }],
        levels: ['jedi4ever', 'snowelf'],
      }),
    ];
    expect(worlds.map(fingerprintOf)).toMatchInlineSnapshot(`
      [
        "e2a5701dfd4cf23e",
        "533e23b6f9d6269a",
        "9446e8c9255a0336",
      ]
    `);
  });

  it('finds the same ways round it as before', () => {
    const world = buildWorld(ATTRACTIONS.concat(booths(11)), booths(70), pinned);
    const ways = world.plots.map((plot) => findPath(world, world.start, plot.door));
    const back = world.plots.map((plot) => findPath(world, plot.door, { x: 0, y: 2 }));
    const digest = createHash('sha256')
      .update(JSON.stringify([ways, back]))
      .digest('hex');
    expect(digest.slice(0, 16)).toMatchInlineSnapshot(`"8e4ece27742ec7aa"`);
  });

  it('lays out every level as before', () => {
    const fingerprints = Object.entries(levelModules)
      .sort(([a], [b]) => (a < b ? -1 : 1))
      .map(([path, level]) => `${path}: ${fingerprintOf(levelWorld(level.default))}`);
    expect(fingerprints).toMatchInlineSnapshot(`
      [
        "../../carnival/levels/jedi4ever/level.ts: cd25e40f7f726894",
        "../../carnival/levels/the-factory/level.ts: 340f20de1d0e8a6b",
      ]
    `);
  });
});
