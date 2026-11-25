/**
 * The North Pole as a small isometric world: what a world is made of (tiles,
 * ground, things and plots), and the geometry every part of the map shares.
 * Plain functions, so the map draws it and the tests check it the same way.
 * Laying the world out is in `world-build.ts`, where each plot is in
 * `world-plots.ts`, and walking it in `walking.ts` and `pathfinding.ts`.
 *
 * Tiles have whole-number coordinates with the town square's centre at (0, 0). `x` runs down to
 * the right on screen and `y` down to the left. The world is built from a fixed seed and the list
 * of squares only, never from `Math.random()`, so the same squares always make the same world.
 */
import type { ShowKind } from './show';

export interface Tile {
  x: number;
  y: number;
}

export interface Box extends Tile {
  w: number;
  h: number;
}

/** What the ground is made of. Water is the only ground you can't walk on. */
export type Ground = 'snow' | 'path' | 'plaza' | 'ice' | 'water' | 'bridge';

export type ThingKind =
  | 'tree'
  | 'drift'
  | 'cabin'
  | 'lamp'
  | 'fence'
  | 'stable'
  | 'sleigh'
  | 'town-tree'
  | 'wheel'
  | 'tent'
  | 'bench'
  | 'cart'
  | 'arch'
  | 'banner'
  | 'bunting'
  | 'billboard'
  | ShowKind;

/** Something the map draws standing on the ground, over the tiles of `box`. */
export interface Thing extends Box {
  kind: ThingKind;
  /** A number from 0 to 1 for this thing's own variety. */
  seed: number;
  /** Whether it stops people walking through it. */
  blocks: boolean;
}

/**
 * What stands on a plot: an attraction, a participant's booth, the
 * construction site of a booth being built, or nothing yet. At the sleigh
 * station, a platform whose sleigh goes to one participant's level, and inside
 * a level, the sleigh back to the North Pole.
 */
type PlotKind = 'attraction' | 'booth' | 'site' | 'open' | 'platform' | 'exit';

export interface Plot extends Box {
  kind: PlotKind;
  /** The attraction's id, or the owner of the booth or the one being built. An open plot has none. */
  id?: string;
  /** The plot's number among its kind's plots. Its number fixes where it is. */
  number: number;
  /** Where you stand to visit it. */
  door: Tile;
}

/** A visitor's stroll: back and forth between two tiles in a straight line. */
export interface Stroll {
  from: Tile;
  to: Tile;
  seed: number;
}

export interface World {
  /** The ground of every tile that isn't plain snow. */
  ground: Map<string, Ground>;
  /** Every tile you can't walk on inside the world. */
  blocked: Set<string>;
  things: Thing[];
  plots: Plot[];
  /** The frozen pond, where the skaters go round. */
  pond: Box;
  /** The reindeer's paddock beside their stable. */
  paddock: Box;
  strolls: Stroll[];
  /** The world is the tiles from -extent to extent each way. */
  extent: number;
  /** Where a visitor starts: just inside the entrance arch, at the front of the island. */
  start: Tile;
}

/** A tile's width and height on screen, in CSS pixels, before zooming. */
export const TILE_W = 64;
export const TILE_H = 32;
/** The world's fixed seed: the same squares always make the same world. */
const SEED = 1225;

/**
 * A number from 0 to 1 that depends only on its arguments and the world's
 * seed. Every bit of variety in the world comes from here.
 */
export function hash(...values: number[]): number {
  let h = SEED ^ 0x9e3779b9;
  for (const value of values) {
    h = Math.imul(h ^ Math.round(value * 1000), 0x85ebca6b);
    h ^= h >>> 13;
    h = Math.imul(h, 0xc2b2ae35);
    h ^= h >>> 16;
  }
  return (h >>> 0) / 4294967296;
}

export const key = (x: number, y: number) => `${x},${y}`;

/** Turns a tile a quarter turn clockwise round the town square, `quarter` times. */
export function turn(tile: Tile, quarter: number): Tile {
  let { x, y } = tile;
  for (let n = 0; n < ((quarter % 4) + 4) % 4; n++) [x, y] = [-y, x];
  return { x: x + 0, y: y + 0 };
}

/** Turns a box of tiles a quarter turn clockwise `quarter` times. */
export function turnBox(box: Box, quarter: number): Box {
  const a = turn(box, quarter);
  const b = turn({ x: box.x + box.w - 1, y: box.y + box.h - 1 }, quarter);
  const x = Math.min(a.x, b.x);
  const y = Math.min(a.y, b.y);
  return { x, y, w: Math.abs(a.x - b.x) + 1, h: Math.abs(a.y - b.y) + 1 };
}

/** Where a tile's centre is on screen, relative to the town square's centre. */
export function toScreen(tile: Tile): Tile {
  return { x: ((tile.x - tile.y) * TILE_W) / 2, y: ((tile.x + tile.y) * TILE_H) / 2 };
}

/** The tile position, not rounded, under a point on screen. */
export function toTile(point: Tile): Tile {
  return {
    x: point.y / TILE_H + point.x / TILE_W,
    y: point.y / TILE_H - point.x / TILE_W,
  };
}
