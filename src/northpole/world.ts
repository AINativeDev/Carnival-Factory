/**
 * The North Pole as a small isometric world: a tile map with a town square in the middle, an
 * avenue leading out from each of its sides, and lanes off the avenues lined with booth plots.
 * Plain functions, so the map draws it and the tests check it the same way.
 *
 * Tiles have whole-number coordinates with the town square's centre at (0, 0). `x` runs down to
 * the right on screen and `y` down to the left. The world is built from a fixed seed and the list
 * of squares only, never from `Math.random()`, so the same squares always make the same world. A
 * square's plot comes from its number in `plots.json`, a booth's own `plot.json`, or the next
 * free number (see `plots.ts`), and a plot's number always means the same place, so adding a
 * booth never moves an attraction or an existing booth.
 */
import { boothPlotNumbers, placePending, type PendingBooth, type PlotFile } from './plots';
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

/** Plot numbers pinned by the maintainers, so squares stay put. */
export interface PinnedPlots {
  attractions: Record<string, number>;
  booths: Record<string, number>;
}

/** A tile's width and height on screen, in CSS pixels, before zooming. */
export const TILE_W = 64;
export const TILE_H = 32;
/** The open plots waiting for a booth, on top of the booths and the sites: there's always at least one. */
export const OPEN_PLOTS = 3;
/** The world's fixed seed: the same squares always make the same world. */
const SEED = 1225;

/** Half the town square's width, in tiles. */
const PLAZA = 3;
/** Where the first lane leaves its avenue, and how far apart the lanes are. */
const FIRST_LANE = 18;
const LANE_STEP = 8;
/** Plots along one lane, half on each side. */
const PLOTS_PER_LANE = 6;
/** How far a lane runs from its avenue, in tiles: four for each row of plots. */
const LANE_LENGTH = (PLOTS_PER_LANE / 2) * 4;
/** Attractions in one ring round the town square. */
const ATTRACTIONS_PER_RING = 8;
/** How much forest grows round the edge of the town, inside the island's fence: a thin band, so the carnival fills the island. */
const FOREST = 3;

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
function turn(tile: Tile, quarter: number): Tile {
  let { x, y } = tile;
  for (let n = 0; n < ((quarter % 4) + 4) % 4; n++) [x, y] = [-y, x];
  return { x: x + 0, y: y + 0 };
}

/** Turns a box of tiles a quarter turn clockwise `quarter` times. */
function turnBox(box: Box, quarter: number): Box {
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

/**
 * Which plot number each square gets. A square pinned in `pinned` keeps its
 * number. The others take the lowest free numbers, in the order given.
 */
export function plotNumbers(
  ids: readonly string[],
  pinned: Record<string, number> = {},
): Map<string, number> {
  const numbers = new Map<string, number>();
  const taken = new Set<number>();
  for (const id of ids) {
    const number = pinned[id];
    if (Number.isInteger(number) && number >= 0 && !taken.has(number)) {
      numbers.set(id, number);
      taken.add(number);
    }
  }
  let next = 0;
  for (const id of ids) {
    if (numbers.has(id)) continue;
    while (taken.has(next)) next++;
    numbers.set(id, next);
    taken.add(next);
  }
  return numbers;
}

/**
 * The four avenues and their lanes are the same shape turned a quarter at a
 * time. Each function below works out a place in the first quarter, whose
 * avenue runs east from the town square and whose lanes run south off it, and
 * turns it into the quarter it belongs to.
 */

/** Attraction plot `number`: 3 by 3, in rings round the town square. */
export function attractionPlot(number: number): Pick<Plot, 'x' | 'y' | 'w' | 'h' | 'door'> {
  const quarter = number % 4;
  const place = Math.floor(number / 4);
  const column = place % 2;
  const row = Math.floor(place / 2);
  const box = { x: 5 + 5 * column, y: 5 + 5 * row, w: 3, h: 3 };
  return { ...turnBox(box, quarter), door: turn({ x: box.x + 1, y: box.y - 1 }, quarter) };
}

/** Which lane a booth plot is on: lanes fill one quarter after another. */
const laneOf = (number: number) => Math.floor(number / PLOTS_PER_LANE);
/** How far out along its avenue lane `lane` leaves it. */
const laneX = (lane: number) => FIRST_LANE + LANE_STEP * Math.floor(lane / 4);

/** Booth plot `number`: 2 by 2, either side of a lane. */
export function boothPlot(number: number): Pick<Plot, 'x' | 'y' | 'w' | 'h' | 'door'> {
  const lane = laneOf(number);
  const quarter = lane % 4;
  const place = number % PLOTS_PER_LANE;
  const right = place % 2;
  const row = Math.floor(place / 2);
  const x = laneX(lane);
  const box = { x: right ? x + 2 : x - 3, y: 3 + 4 * row, w: 2, h: 2 };
  return { ...turnBox(box, quarter), door: turn({ x: right ? x + 1 : x - 1, y: box.y }, quarter) };
}

/** What else decides where booths stand: their own `plot.json`s, and the booths being built. */
export interface WorldExtras {
  /** Each booth's own `plot.json`, by login. */
  files?: Record<string, PlotFile>;
  /** The accepted booth requests not merged yet, from `pending.json`. */
  pending?: readonly PendingBooth[];
  /** The logins with a level, each with a platform at the sleigh station. */
  levels?: readonly string[];
}

/** How far apart the sleigh station's platforms are along the main path, in tiles. */
const PLATFORM_STEP = 3;

/**
 * The sleigh station's platform `number`: 2 by 2, along the south side of the
 * main path from the east avenue's end to the entrance, with its door on the path.
 */
function platformPlot(
  number: number,
  avenueEnd: number,
): Pick<Plot, 'x' | 'y' | 'w' | 'h' | 'door'> {
  const x = avenueEnd + 2 + PLATFORM_STEP * number;
  return { x, y: 2, w: 2, h: 2, door: { x, y: 1 } };
}

/** Builds the world for these squares, in the order their folders sort. */
export function buildWorld(
  attractionIds: readonly string[],
  boothIds: readonly string[],
  pinned: PinnedPlots = { attractions: {}, booths: {} },
  extras: WorldExtras = {},
): World {
  const ground = new Map<string, Ground>();
  const blocked = new Set<string>();
  const things: Thing[] = [];
  const plots: Plot[] = [];
  /** Tiles nothing may grow on: paths, plots and the room round them. */
  const kept = new Set<string>();

  const keep = (box: Box, margin = 0) => {
    for (let x = box.x - margin; x < box.x + box.w + margin; x++)
      for (let y = box.y - margin; y < box.y + box.h + margin; y++) kept.add(key(x, y));
  };
  const lay = (box: Box, kind: Ground) => {
    for (let x = box.x; x < box.x + box.w; x++)
      for (let y = box.y; y < box.y + box.h; y++) {
        // A bridge or water stays put where a path crosses it.
        const now = ground.get(key(x, y));
        if (kind === 'path' && (now === 'bridge' || now === 'water')) continue;
        ground.set(key(x, y), kind);
        if (kind === 'water' || kind === 'ice') blocked.add(key(x, y));
        else blocked.delete(key(x, y));
      }
    keep(box);
  };
  const place = (kind: ThingKind, box: Box, blocks = true, seed = hash(box.x, box.y, 7)) => {
    things.push({ kind, ...box, seed, blocks });
    if (blocks)
      for (let x = box.x; x < box.x + box.w; x++)
        for (let y = box.y; y < box.y + box.h; y++) blocked.add(key(x, y));
    keep(box);
  };

  // The squares, each on its own numbered plot.
  const attractionNumbers = plotNumbers(attractionIds, pinned.attractions);
  for (const [id, number] of attractionNumbers) {
    plots.push({ kind: 'attraction', id, number, ...attractionPlot(number) });
  }
  const boothNumbers = boothPlotNumbers(boothIds, pinned.booths, extras.files);
  const taken = new Set(boothNumbers.values());
  for (const [id, number] of boothNumbers) {
    plots.push({ kind: 'booth', id, number, ...boothPlot(number) });
  }
  // The booths being built, each on the plot held for it.
  for (const [id, number] of placePending(extras.pending ?? [], boothNumbers).sites) {
    plots.push({ kind: 'site', id, number, ...boothPlot(number) });
    taken.add(number);
  }
  for (let number = 0, open = 0; open < OPEN_PLOTS; number++) {
    if (taken.has(number)) continue;
    plots.push({ kind: 'open', number, ...boothPlot(number) });
    taken.add(number);
    open++;
  }

  // Every quarter has as many lanes as its busiest neighbour, at least one.
  const lastLane = Math.max(...[...taken].map(laneOf));
  const lanesOut = Math.floor(lastLane / 4) + 1;
  const avenueEnd = laneX(4 * (lanesOut - 1)) + 5;
  // The sights sit past the furthest attraction plot in use, which a pin can
  // put past where the attractions alone would reach.
  const lastAttraction = Math.max(-1, ...attractionNumbers.values());
  const attractionRows = Math.max(1, Math.floor(lastAttraction / ATTRACTIONS_PER_RING) + 1);
  const sights = 5 + 5 * attractionRows;

  // The town square, its tree and Santa's sleigh.
  lay({ x: -PLAZA, y: -PLAZA, w: 2 * PLAZA + 1, h: 2 * PLAZA + 1 }, 'plaza');
  keep({ x: -PLAZA, y: -PLAZA, w: 2 * PLAZA + 1, h: 2 * PLAZA + 1 }, 1);
  place('town-tree', { x: 0, y: 0, w: 1, h: 1 }, true, 0);
  place('sleigh', { x: -2, y: -3, w: 2, h: 1 }, true, 0);
  for (const [x, y] of [
    [-3, -3],
    [3, -3],
    [-3, 3],
    [3, 3],
  ]) {
    place('lamp', { x, y, w: 1, h: 1 });
  }

  // The sleigh station, one platform for each level, along the main path.
  const levels = extras.levels ?? [];
  levels.forEach((login, number) =>
    plots.push({ kind: 'platform', id: login, number, ...platformPlot(number, avenueEnd) }),
  );
  const station = levels.length ? avenueEnd + 2 + PLATFORM_STEP * levels.length : 0;

  // The island's edge: the forest round the town, and the fence round that.
  // The sights end 10 tiles past their first row, and the stream runs on into the forest.
  const extent = Math.max(avenueEnd, station, sights + 11) + FOREST;

  // The main path runs on from the east avenue to the entrance arch at the
  // front of the island, under bunting strung between poles.
  lay({ x: avenueEnd + 1, y: -1, w: extent - avenueEnd, h: 3 }, 'path');
  keep({ x: avenueEnd + 1, y: -2, w: extent - avenueEnd, h: 5 });
  place('arch', { x: extent - 1, y: -2, w: 1, h: 5 }, false, 0);
  for (let x = PLAZA + 2; x < extent - 3; x += 8)
    place('bunting', { x, y: -2, w: 1, h: 5 }, false, hash(x, 8));
  // The big banner by the town square, where the main path comes in.
  place('banner', { x: PLAZA + 1, y: -PLAZA - 1, w: 3, h: 1 }, false, 0);

  for (let quarter = 0; quarter < 4; quarter++) {
    const at = (box: Box) => turnBox(box, quarter);
    // A bench and a cocoa cart along each avenue.
    place('bench', at({ x: PLAZA + 5, y: -2, w: 1, h: 1 }));
    place('cart', at({ x: PLAZA + 7, y: 2, w: 1, h: 1 }));
    // The avenue, with lamps along its north side.
    lay(at({ x: PLAZA + 1, y: -1, w: avenueEnd - PLAZA, h: 3 }), 'path');
    keep(at({ x: PLAZA + 1, y: -2, w: avenueEnd - PLAZA, h: 5 }));
    for (let x = PLAZA + 3; x <= avenueEnd; x += 4) place('lamp', at({ x, y: -2, w: 1, h: 1 }));

    // Its lanes, with a fence between neighbouring lanes' plots.
    for (let out = 0; out < lanesOut; out++) {
      const x = laneX(4 * out);
      lay(at({ x: x - 1, y: 2, w: 3, h: LANE_LENGTH }), 'path');
      keep(at({ x: x - 3, y: 2, w: 7, h: LANE_LENGTH + 1 }));
      for (let y = 3; y < 2 + LANE_LENGTH; y++)
        if (hash(quarter, out, y) < 0.7) place('fence', at({ x: x + 4, y, w: 1, h: 1 }));
    }
  }

  for (const plot of plots) {
    keep(plot, plot.kind === 'attraction' || plot.kind === 'platform' ? 1 : 0);
    keep({ ...plot.door, w: 1, h: 1 });
    if (plot.kind === 'attraction') lay({ ...plot.door, w: 1, h: 1 }, 'path');
    if (plot.kind !== 'open')
      for (let x = plot.x; x < plot.x + plot.w; x++)
        for (let y = plot.y; y < plot.y + plot.h; y++) blocked.add(key(x, y));
  }

  // Past the attractions, between each avenue and the next quarter's lanes,
  // the North Pole's own sights: one quarter each.
  // The frozen pond, and the stream running from it under a wooden bridge.
  const pond = turnBox({ x: 5, y: sights, w: 5, h: 4 }, 0);
  lay(pond, 'ice');
  keep(pond, 1);
  lay({ x: 7, y: sights + 4, w: 1, h: 10 }, 'water');
  lay({ x: 7, y: sights + 8, w: 1, h: 1 }, 'bridge');
  lay({ x: 3, y: sights + 8, w: 11, h: 1 }, 'path');
  keep({ x: 6, y: sights + 4, w: 3, h: 10 });

  // The reindeer's stable, and their paddock fenced in beside it.
  const stable = turnBox({ x: 5, y: sights, w: 4, h: 3 }, 1);
  place('stable', stable);
  const paddockBox = { x: 4, y: sights + 4, w: 8, h: 5 };
  const paddock = turnBox({ ...paddockBox, x: 5, y: sights + 5, w: 6, h: 3 }, 1);
  for (let x = paddockBox.x; x < paddockBox.x + paddockBox.w; x++)
    for (let y = paddockBox.y; y < paddockBox.y + paddockBox.h; y++) {
      const edge =
        x === paddockBox.x ||
        y === paddockBox.y ||
        x === paddockBox.x + paddockBox.w - 1 ||
        y === paddockBox.y + paddockBox.h - 1;
      if (edge) place('fence', turnBox({ x, y, w: 1, h: 1 }, 1));
    }
  keep(paddock);
  for (const quarter of [1, 2, 3]) {
    const at = (box: Box) => turnBox(box, quarter);
    keep(at({ x: 4, y: sights - 1, w: 9, h: 1 }));
  }

  // The log cabins, two quarters' worth.
  for (const [quarter, x, y] of [
    [2, 5, 0],
    [2, 9, 1],
    [2, 6, 5],
    [3, 5, 0],
    [3, 9, 4],
  ]) {
    place('cabin', turnBox({ x, y: sights + y, w: 3, h: 3 }, quarter));
    keep(turnBox({ x, y: sights + y + 3, w: 3, h: 1 }, quarter));
  }

  // The ferris wheel, rising over the back of the town, and the striped tents.
  place('wheel', turnBox({ x: 5, y: sights + 5, w: 3, h: 3 }, 3));
  for (const quarter of [1, 3]) place('tent', turnBox({ x: 10, y: sights, w: 2, h: 2 }, quarter));
  place('tent', turnBox({ x: 10, y: sights + 6, w: 2, h: 2 }, 2));

  // The pine forest: scattered through the town, and thick round its edge.
  const town = extent - FOREST;
  for (let x = -extent; x <= extent; x++)
    for (let y = -extent; y <= extent; y++) {
      if (kept.has(key(x, y))) continue;
      const edge = Math.max(Math.abs(x), Math.abs(y)) > town;
      const roll = hash(x, y, 1);
      if (roll < (edge ? 0.5 : 0.1)) place('tree', { x, y, w: 1, h: 1 }, true, hash(x, y, 2));
      else if (roll > 0.95) place('drift', { x, y, w: 1, h: 1 }, false, hash(x, y, 3));
    }

  // Elves and visitors stroll up and down the avenues and lanes.
  const strolls: Stroll[] = [];
  for (let quarter = 0; quarter < 4; quarter++) {
    for (const side of [-1, 1]) {
      strolls.push({
        from: turn({ x: PLAZA + 1, y: side }, quarter),
        to: turn({ x: avenueEnd, y: side }, quarter),
        seed: hash(quarter, side, 4),
      });
    }
    for (let out = 0; out < lanesOut; out++) {
      const x = laneX(4 * out);
      strolls.push({
        from: turn({ x, y: 2 }, quarter),
        to: turn({ x, y: 1 + LANE_LENGTH }, quarter),
        seed: hash(quarter, out, 5),
      });
    }
  }

  const start = { x: extent - 2, y: 0 };
  return { ground, blocked, things, plots, pond, paddock, strolls, extent, start };
}

/** Whether you can stand on the tile at (x, y). */
export function walkable(world: World, x: number, y: number): boolean {
  return (
    Math.abs(x) <= world.extent && Math.abs(y) <= world.extent && !world.blocked.has(key(x, y))
  );
}

/** The tile a position is on. */
export const tileOf = (position: Tile): Tile => ({
  x: Math.round(position.x),
  y: Math.round(position.y),
});

/** How far a walker reaches from their middle, in tiles. */
const BODY = 0.2;

/** Whether a walker can stand at `position`, their body clear of anything blocked. */
export function canStand(world: World, position: Tile): boolean {
  for (const dx of [-BODY, BODY])
    for (const dy of [-BODY, BODY])
      if (!walkable(world, Math.round(position.x + dx), Math.round(position.y + dy))) return false;
  return true;
}

/**
 * Where a walker at `position` can stand: there, if they can, else the middle
 * of the nearest tile they can stand on, such as when the world was rebuilt
 * with something new where they stood.
 */
export function nearestStand(world: World, position: Tile): Tile {
  if (canStand(world, position)) return position;
  const { x, y } = tileOf(position);
  for (let ring = 1; ring <= 2 * world.extent + 1; ring++) {
    let best: Tile | undefined;
    for (let dx = -ring; dx <= ring; dx++)
      for (let dy = -ring; dy <= ring; dy++) {
        if (Math.max(Math.abs(dx), Math.abs(dy)) !== ring) continue;
        const tile = { x: x + dx, y: y + dy };
        if (!canStand(world, tile)) continue;
        if (!best || Math.hypot(dx, dy) < Math.hypot(best.x - x, best.y - y)) best = tile;
      }
    if (best) return best;
  }
  return { ...world.start };
}

/**
 * Moves a walker by (dx, dy) tiles, stopping at anything blocked. When the way
 * is blocked they slide along it, as far as either half of the move allows.
 */
export function moveBy(world: World, position: Tile, dx: number, dy: number): Tile {
  for (const next of [
    { x: position.x + dx, y: position.y + dy },
    { x: position.x + dx, y: position.y },
    { x: position.x, y: position.y + dy },
  ]) {
    if ((next.x !== position.x || next.y !== position.y) && canStand(world, next)) return next;
  }
  return position;
}

/**
 * The direction, in tiles, that arrow keys point on screen: `right` and `down`
 * are each -1, 0 or 1. Up the screen is north-west in tiles. The direction has
 * length 1, or 0 when the keys cancel out.
 */
export function screenDirection(right: number, down: number): Tile {
  const x = right + down;
  const y = down - right;
  const length = Math.hypot(x, y);
  return length ? { x: x / length, y: y / length } : { x: 0, y: 0 };
}

const STEPS = [
  [1, 0],
  [-1, 0],
  [0, 1],
  [0, -1],
  [1, 1],
  [1, -1],
  [-1, 1],
  [-1, -1],
];

/** Whether a walker can step from tile (x, y) by (dx, dy), cutting no corner. */
const canStep = (world: World, x: number, y: number, dx: number, dy: number) =>
  walkable(world, x + dx, y + dy) &&
  (!dx || !dy || (walkable(world, x + dx, y) && walkable(world, x, y + dy)));

/** Every tile a walker can reach from tile `from`. */
export function reachable(world: World, from: Tile): Set<string> {
  const seen = new Set([key(from.x, from.y)]);
  const queue = [from];
  for (let n = 0; n < queue.length; n++) {
    const { x, y } = queue[n];
    for (const [dx, dy] of STEPS) {
      const there = key(x + dx, y + dy);
      if (seen.has(there) || !canStep(world, x, y, dx, dy)) continue;
      seen.add(there);
      queue.push({ x: x + dx, y: y + dy });
    }
  }
  return seen;
}

/**
 * The shortest walk from tile `from` to the first of `goals` a walker can
 * reach, or undefined when they can reach none. However many goals there are,
 * it searches the world at most three times.
 */
export function findPathToFirst(
  world: World,
  from: Tile,
  goals: readonly Tile[],
): Tile[] | undefined {
  const open = goals.filter((goal) => walkable(world, goal.x, goal.y));
  if (!open.length) return undefined;
  const way = findPath(world, from, open[0]);
  if (way || open.length === 1) return way;
  const reach = reachable(world, from);
  const goal = open.find((goal) => reach.has(key(goal.x, goal.y)));
  return goal && findPath(world, from, goal);
}

/**
 * The shortest walk from tile `from` to tile `to`, as the tiles after `from`,
 * or undefined when `to` can't be reached. Walkers step diagonally only where
 * neither tile beside the corner is blocked.
 */
export function findPath(world: World, from: Tile, to: Tile): Tile[] | undefined {
  if (!walkable(world, to.x, to.y)) return undefined;
  if (from.x === to.x && from.y === to.y) return [];
  const cost = new Map<string, number>([[key(from.x, from.y), 0]]);
  const came = new Map<string, string>();
  const guess = (t: Tile) => {
    const [a, b] = [Math.abs(t.x - to.x), Math.abs(t.y - to.y)];
    return Math.max(a, b) + (Math.SQRT2 - 1) * Math.min(a, b);
  };
  const heap: [number, number, number][] = [[guess(from), from.x, from.y]];
  const push = (item: [number, number, number]) => {
    heap.push(item);
    for (let i = heap.length - 1; i > 0;) {
      const parent = (i - 1) >> 1;
      if (heap[parent][0] <= heap[i][0]) break;
      [heap[parent], heap[i]] = [heap[i], heap[parent]];
      i = parent;
    }
  };
  const pop = () => {
    const top = heap[0];
    const last = heap.pop()!;
    if (heap.length) {
      heap[0] = last;
      for (let i = 0; ;) {
        const [l, r] = [2 * i + 1, 2 * i + 2];
        let least = i;
        if (l < heap.length && heap[l][0] < heap[least][0]) least = l;
        if (r < heap.length && heap[r][0] < heap[least][0]) least = r;
        if (least === i) break;
        [heap[least], heap[i]] = [heap[i], heap[least]];
        i = least;
      }
    }
    return top;
  };

  while (heap.length) {
    const [, x, y] = pop();
    const here = key(x, y);
    if (x === to.x && y === to.y) {
      const path: Tile[] = [];
      for (let at = here; at !== key(from.x, from.y); at = came.get(at)!) {
        const [px, py] = at.split(',').map(Number);
        path.unshift({ x: px, y: py });
      }
      return path;
    }
    for (const [dx, dy] of STEPS) {
      const [nx, ny] = [x + dx, y + dy];
      if (!canStep(world, x, y, dx, dy)) continue;
      const next = cost.get(here)! + (dx && dy ? Math.SQRT2 : 1);
      const there = key(nx, ny);
      if (next >= (cost.get(there) ?? Infinity)) continue;
      cost.set(there, next);
      came.set(there, here);
      push([next + guess({ x: nx, y: ny }), nx, ny]);
    }
  }
  return undefined;
}

/**
 * Takes a walker `distance` tiles along `path`, dropping the tiles they reach.
 * Returns where they are and what is left of the path.
 */
export function walkAlong(
  position: Tile,
  path: readonly Tile[],
  distance: number,
): { position: Tile; path: Tile[] } {
  let at = position;
  let left = distance;
  const rest = [...path];
  while (rest.length && left > 0) {
    const [next] = rest;
    const gap = Math.hypot(next.x - at.x, next.y - at.y);
    if (gap <= left) {
      at = { ...next };
      left -= gap;
      rest.shift();
    } else {
      at = { x: at.x + ((next.x - at.x) * left) / gap, y: at.y + ((next.y - at.y) * left) / gap };
      left = 0;
    }
  }
  return { position: at, path: rest };
}

/** The plot whose door a walker at `position` is standing at, if any. */
export function plotAtDoor(world: World, position: Tile): Plot | undefined {
  let best: Plot | undefined;
  let nearest = 0.75;
  for (const plot of world.plots) {
    const gap = Math.hypot(plot.door.x - position.x, plot.door.y - position.y);
    if (gap < nearest) [best, nearest] = [plot, gap];
  }
  return best;
}

/** A visitor's place on their stroll at `time`: walking there and back at an easy pace. */
export function strollAt(stroll: Stroll, time: number): Tile & { facing: number } {
  const length = Math.hypot(stroll.to.x - stroll.from.x, stroll.to.y - stroll.from.y) || 1;
  const pace = 0.0012 * (0.7 + 0.6 * stroll.seed);
  const travelled = (time * pace + stroll.seed * 2 * length) % (2 * length);
  const back = travelled > length;
  const along = (back ? 2 * length - travelled : travelled) / length;
  return {
    x: stroll.from.x + (stroll.to.x - stroll.from.x) * along,
    y: stroll.from.y + (stroll.to.y - stroll.from.y) * along,
    facing: back ? -1 : 1,
  };
}
