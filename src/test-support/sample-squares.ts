/**
 * Squares for the world's tests to build a North Pole from: a handful of
 * attractions and as many booths as a test needs, and finding a square's spot
 * in what was built. Shared, so every split of the world's tests builds the
 * same carnival (docs/adr/0019-small-files.md).
 */
import { assert } from 'vitest';
import type { Spot, World } from '../northpole/world';

export const ATTRACTIONS = [
  'big-top',
  'cocoa-stand',
  'ferris-wheel',
  'frozen-pond',
  'sleigh-coaster',
];

/** `count` booths, `elf-0` onwards. */
export const booths = (count: number) => Array.from({ length: count }, (_, n) => `elf-${n}`);

/** The first spot that `matches`, failing the test when there's none. */
export function spotWhere(world: World, matches: (spot: Spot) => boolean): Spot {
  const spot = world.spots.find(matches);
  assert(spot, 'no spot matches');
  return spot;
}

/** Where a square's spot is: its tiles and its door. */
export function placeOf(world: World, id: string) {
  const { x, y, w, h, door } = spotWhere(world, (spot) => spot.id === id);
  return { x, y, w, h, door };
}
