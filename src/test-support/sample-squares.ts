/**
 * Squares for the world's tests to build a North Pole from: a handful of
 * attractions and as many booths as a test needs, and finding a square's plot
 * in what was built. Shared, so every split of the world's tests builds the
 * same carnival (docs/adr/0019-small-files.md).
 */
import { assert } from 'vitest';
import type { Plot, World } from '../northpole/world';

export const ATTRACTIONS = [
  'big-top',
  'cocoa-stand',
  'ferris-wheel',
  'frozen-pond',
  'sleigh-coaster',
];

/** `count` booths, `elf-0` onwards. */
export const booths = (count: number) => Array.from({ length: count }, (_, n) => `elf-${n}`);

/** The first plot that `matches`, failing the test when there's none. */
export function plotWhere(world: World, matches: (plot: Plot) => boolean): Plot {
  const plot = world.plots.find(matches);
  assert(plot, 'no plot matches');
  return plot;
}

/** Where a square's plot is: its tiles and its door. */
export function placeOf(world: World, id: string) {
  const { x, y, w, h, door } = plotWhere(world, (plot) => plot.id === id);
  return { x, y, w, h, door };
}
