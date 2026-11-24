/**
 * A participant's level: a whole patch of the North Pole of their own, in
 * `levels/<login>/level.ts`. A level is plain data, a `NorthPoleLevel`, that
 * the engine checks here before anything is drawn and then lays out as a
 * `World`, so the map walks it just like the North Pole. Its own squares, in
 * `levels/<login>/squares/<id>/square.ts`, run sandboxed like booths. Plain
 * functions, so the tests check every real level the same way the page does.
 *
 * A level's tiles run from (0, 0) at its north corner to (size - 1, size - 1),
 * with `x` down to the right on screen and `y` down to the left, as on the map.
 */
import { isAttractionId, isBoothOwner } from './square';
import { theme } from './theme';
import {
  key,
  reachable,
  walkable,
  type Box,
  type Ground,
  type Plot,
  type Thing,
  type ThingKind,
  type Tile,
  type World,
} from './world';

/** The ground a level may lay. Snow is everywhere else. */
export const LEVEL_GROUNDS = ['snow', 'ice', 'path', 'water', 'bridge'] as const;
export type LevelGround = (typeof LEVEL_GROUNDS)[number];

/**
 * The engine's catalogue of North Pole things a level may place, with the
 * tiles each one covers and whether it stops people walking through it. The
 * pond is the one prop that's ground: a sheet of ice that skaters go round.
 */
export const LEVEL_PROPS = {
  pine: { thing: 'tree', w: 1, h: 1, blocks: true },
  drift: { thing: 'drift', w: 1, h: 1, blocks: false },
  cabin: { thing: 'cabin', w: 3, h: 3, blocks: true },
  lamp: { thing: 'lamp', w: 1, h: 1, blocks: true },
  fence: { thing: 'fence', w: 1, h: 1, blocks: true },
  stable: { thing: 'stable', w: 4, h: 3, blocks: true },
  sleigh: { thing: 'sleigh', w: 2, h: 1, blocks: true },
  'town-tree': { thing: 'town-tree', w: 1, h: 1, blocks: true },
  tent: { thing: 'tent', w: 2, h: 2, blocks: true },
  bench: { thing: 'bench', w: 1, h: 1, blocks: true },
  cart: { thing: 'cart', w: 1, h: 1, blocks: true },
  banner: { thing: 'banner', w: 3, h: 1, blocks: false },
  bunting: { thing: 'bunting', w: 1, h: 5, blocks: false },
  pond: { thing: undefined, w: 5, h: 4, blocks: true },
} as const satisfies Record<
  string,
  { thing: ThingKind | undefined; w: number; h: number; blocks: boolean }
>;
export type LevelPropKind = keyof typeof LEVEL_PROPS;

/**
 * The looks a level may pick, each from the map's palette: the colours of its
 * sky's tint and of its signs.
 */
export const LEVEL_THEMES = {
  dusk: { tint: theme.colors.dusk, sign: theme.colors.gold },
  'aurora-night': { tint: theme.colors.aurora, sign: theme.colors.mint },
  'candy-cane': { tint: theme.colors.berry, sign: theme.colors.snow },
  'frozen-lake': { tint: theme.colors.ice, sign: theme.colors.ice },
  gingerbread: { tint: theme.colors.gingerbread, sign: theme.colors.gingerbread },
} as const;
export type LevelTheme = keyof typeof LEVEL_THEMES;

/** A tile, or a box of tiles when it has a width and height. */
export interface LevelArea {
  x: number;
  y: number;
  w?: number;
  h?: number;
}

export interface LevelProp {
  kind: LevelPropKind;
  /** The north corner of the tiles it covers. */
  x: number;
  y: number;
  /** A number from 0 to 1 for this one's own variety. */
  variant?: number;
}

/**
 * One of the level's own squares: `squares/<id>/square.ts`, on a 2 by 2 stall
 * whose north corner is (x, y). Visitors stand at its door, the tile east of
 * its top row, (x + 2, y).
 */
export interface LevelSquarePlace {
  id: string;
  x: number;
  y: number;
}

/**
 * A participant's whole level, as data the engine checks and draws. The page
 * never runs it as code: `level.ts` holds only this object.
 */
export interface NorthPoleLevel {
  /** Its owner's GitHub login in lower case: the same as its folder. */
  id: string;
  name: string;
  /** One sentence, shown at the station. */
  description: string;
  theme: LevelTheme;
  /** How many tiles it is each way: an odd number from `LEVEL_SIZE.min` to `LEVEL_SIZE.max`. */
  size: number;
  /** Ground other than snow, laid in order. */
  ground?: { tile: LevelGround; area: LevelArea }[];
  /** Tiles nobody can walk on, though nothing stands there. */
  blocked?: LevelArea[];
  props?: LevelProp[];
  /** Where visitors arrive from the sleigh station. */
  arrival: { x: number; y: number };
  /**
   * The sleighs back to the North Pole, each a 2 by 2 platform whose north
   * corner is (x, y), with its door at (x + 2, y), as a square's.
   */
  exits: { x: number; y: number }[];
  squares?: LevelSquarePlace[];
}

export const LEVEL_SIZE = { min: 9, max: 41 };
/** The most squares of its own a level may have. */
export const MAX_LEVEL_SQUARES = 8;
export const MAX_LEVEL_PROPS = 400;
export const MAX_LEVEL_AREAS = 200;
const MAX_NAME = 40;
const MAX_DESCRIPTION = 160;

const isInteger = (value: unknown): value is number => Number.isInteger(value);

/** A square's or an exit's plot inside a level, in the level's own tiles. */
const standBox = (at: { x: number; y: number }): Box => ({ x: at.x, y: at.y, w: 2, h: 2 });
const standDoor = (at: { x: number; y: number }): Tile => ({ x: at.x + 2, y: at.y });

/** The box an area covers, or undefined when its numbers aren't whole tiles. */
function areaBox(area: unknown): Box | undefined {
  if (!area || typeof area !== 'object') return undefined;
  const { x, y, w = 1, h = 1 } = area as LevelArea;
  if (![x, y, w, h].every(isInteger) || w < 1 || h < 1) return undefined;
  return { x, y, w, h };
}

const tilesOf = (box: Box): Tile[] => {
  const tiles: Tile[] = [];
  for (let x = box.x; x < box.x + box.w; x++)
    for (let y = box.y; y < box.y + box.h; y++) tiles.push({ x, y });
  return tiles;
};

/**
 * Lays a level out as a world the map can walk, centred on (0, 0). It trusts
 * its input: run `validateLevel` first, and only lay out a level with no
 * problems.
 */
export function levelWorld(level: NorthPoleLevel): World {
  const half = Math.floor(level.size / 2);
  const at = (tile: Tile): Tile => ({ x: tile.x - half, y: tile.y - half });
  const ground = new Map<string, Ground>();
  const blocked = new Set<string>();
  const things: Thing[] = [];
  const plots: Plot[] = [];
  let pond: Box = { x: 0, y: 0, w: 0, h: 0 };

  const lay = (box: Box, tile: Ground) => {
    for (const t of tilesOf(box)) {
      const { x, y } = at(t);
      ground.set(key(x, y), tile);
      if (tile === 'water' || tile === 'ice') blocked.add(key(x, y));
      else blocked.delete(key(x, y));
    }
  };
  for (const { tile, area } of level.ground ?? []) lay(areaBox(area)!, tile);
  for (const area of level.blocked ?? [])
    for (const t of tilesOf(areaBox(area)!)) blocked.add(key(at(t).x, at(t).y));

  for (const prop of level.props ?? []) {
    const look = LEVEL_PROPS[prop.kind];
    const box = { ...at(prop), w: look.w, h: look.h };
    if (look.thing === undefined) {
      lay({ ...prop, w: look.w, h: look.h }, 'ice');
      pond = box;
      continue;
    }
    things.push({ kind: look.thing, ...box, seed: prop.variant ?? 0, blocks: look.blocks });
    if (look.blocks) for (const t of tilesOf(box)) blocked.add(key(t.x, t.y));
  }

  const stand = (kind: 'attraction' | 'exit', id: string, number: number, place: Tile) => {
    const box = { ...at(place), w: 2, h: 2 };
    plots.push({ kind, id, number, ...box, door: at(standDoor(place)) });
    for (const t of tilesOf(box)) blocked.add(key(t.x, t.y));
  };
  (level.squares ?? []).forEach((square, n) => stand('attraction', square.id, n, square));
  level.exits.forEach((exit, n) => stand('exit', 'north-pole', n, exit));

  return {
    ground,
    blocked,
    things,
    plots,
    pond,
    paddock: { x: 0, y: 0, w: 0, h: 0 },
    strolls: [],
    extent: half,
    start: at(level.arrival),
  };
}

/**
 * What's wrong with a level, in words its owner can act on. Empty means the
 * engine may draw it. `folder` is the folder it's in, and `squareFolders` the
 * ids of the squares in its `squares/` folder. It checks the level is plain
 * data within the size limits, uses only known tiles and catalogue props, puts
 * nothing where it can't stand, and that every square and exit can be walked
 * to from where visitors arrive.
 */
export function validateLevel(
  value: unknown,
  folder: string,
  squareFolders: readonly string[] = [],
): string[] {
  if (!value || typeof value !== 'object') return ['level.ts must export its NorthPoleLevel'];
  const level = value as NorthPoleLevel;
  const problems: string[] = [];
  const text = (name: string, field: unknown, max: number) => {
    if (typeof field !== 'string' || !field.trim()) problems.push(`its ${name} is missing`);
    else if (field.length > max) problems.push(`its ${name} is over ${max} characters`);
  };

  if (!isBoothOwner(folder)) problems.push(`its folder "${folder}" is not a GitHub login`);
  if (level.id !== folder) problems.push(`its id must be "${folder}", its folder's name`);
  text('name', level.name, MAX_NAME);
  text('description', level.description, MAX_DESCRIPTION);
  if (typeof level.theme !== 'string' || !Object.hasOwn(LEVEL_THEMES, level.theme))
    problems.push(`its theme must be one of ${Object.keys(LEVEL_THEMES).join(', ')}`);
  const { size } = level;
  if (!isInteger(size) || size < LEVEL_SIZE.min || size > LEVEL_SIZE.max || size % 2 === 0) {
    problems.push(`its size must be an odd number from ${LEVEL_SIZE.min} to ${LEVEL_SIZE.max}`);
    return problems;
  }

  const list = (name: string, field: unknown, max: number, required = false): unknown[] => {
    if (field === undefined && !required) return [];
    if (!Array.isArray(field)) {
      problems.push(`its ${name} must be a list`);
      return [];
    }
    if (field.length > max) problems.push(`it has over ${max} ${name}`);
    return field.slice(0, max);
  };
  const within = (box: Box) =>
    box.x >= 0 && box.y >= 0 && box.x + box.w <= size && box.y + box.h <= size;
  /** What stands on each tile, so nothing is put on top of anything else. */
  const taken = new Map<string, string>();
  const water = new Set<string>();
  const occupy = (box: Box, what: string) => {
    for (const t of tilesOf(box)) {
      const there = taken.get(key(t.x, t.y));
      if (there) {
        problems.push(`${what} stands on ${there} at ${t.x}, ${t.y}`);
        return;
      }
      if (water.has(key(t.x, t.y))) {
        problems.push(`${what} stands on water or ice at ${t.x}, ${t.y}`);
        return;
      }
    }
    for (const t of tilesOf(box)) taken.set(key(t.x, t.y), what);
  };

  for (const [n, entry] of list('ground areas', level.ground, MAX_LEVEL_AREAS).entries()) {
    const { tile, area } = (entry ?? {}) as { tile?: unknown; area?: unknown };
    const box = areaBox(area);
    if (!LEVEL_GROUNDS.includes(tile as LevelGround))
      problems.push(`ground ${n} is "${String(tile)}", not one of ${LEVEL_GROUNDS.join(', ')}`);
    else if (!box || !within(box)) problems.push(`ground ${n} is not inside the level`);
    else
      for (const t of tilesOf(box)) {
        if (tile === 'water' || tile === 'ice') water.add(key(t.x, t.y));
        else water.delete(key(t.x, t.y));
      }
  }
  for (const [n, area] of list('blocked areas', level.blocked, MAX_LEVEL_AREAS).entries()) {
    const box = areaBox(area);
    if (!box || !within(box)) problems.push(`blocked area ${n} is not inside the level`);
  }
  let ponds = 0;
  for (const [n, entry] of list('props', level.props, MAX_LEVEL_PROPS).entries()) {
    const prop = (entry ?? {}) as LevelProp;
    if (typeof prop.kind !== 'string' || !Object.hasOwn(LEVEL_PROPS, prop.kind)) {
      problems.push(`prop ${n} is "${String(prop.kind)}", which isn't in the catalogue`);
      continue;
    }
    if (prop.variant !== undefined && !(prop.variant >= 0 && prop.variant <= 1))
      problems.push(`prop ${n}'s variant must be a number from 0 to 1`);
    const look = LEVEL_PROPS[prop.kind];
    const box = areaBox({ x: prop.x, y: prop.y, w: look.w, h: look.h });
    if (!box || !within(box)) {
      problems.push(`prop ${n}, a ${prop.kind}, is not inside the level`);
      continue;
    }
    if (look.thing === undefined) {
      if (++ponds > 1) problems.push('it has more than one pond');
      for (const t of tilesOf(box)) taken.set(key(t.x, t.y), `the pond`);
    } else occupy(box, `prop ${n}, a ${prop.kind},`);
  }

  const stands: { what: string; box: Box; door: Tile }[] = [];
  const ids = new Set<string>();
  for (const [n, entry] of list('squares', level.squares, MAX_LEVEL_SQUARES).entries()) {
    const square = (entry ?? {}) as LevelSquarePlace;
    const what = `square "${String(square.id)}"`;
    if (typeof square.id !== 'string' || !isAttractionId(square.id)) {
      problems.push(`square ${n}'s id must be kebab-case`);
      continue;
    }
    if (ids.has(square.id)) problems.push(`two squares are called "${square.id}"`);
    ids.add(square.id);
    if (!squareFolders.includes(square.id))
      problems.push(`${what} has no squares/${square.id}/square.ts`);
    stands.push({ what, box: standBox(square), door: standDoor(square) });
  }
  for (const id of squareFolders)
    if (!ids.has(id)) problems.push(`squares/${id}/ isn't placed in the level's squares`);
  const exits = list('exits', level.exits, MAX_LEVEL_SQUARES, true);
  if (!exits.length) problems.push('it needs at least one exit back to the North Pole');
  for (const [n, exit] of exits.entries()) {
    const place = (exit ?? {}) as Tile;
    stands.push({ what: `exit ${n}`, box: standBox(place), door: standDoor(place) });
  }

  for (const stand of stands) {
    const box = areaBox(stand.box);
    if (!box || !within(box) || !within({ ...stand.door, w: 1, h: 1 })) {
      problems.push(`${stand.what} and its door must be inside the level`);
      continue;
    }
    occupy(box, stand.what);
  }
  const arrival = areaBox(level.arrival);
  if (!arrival || !within(arrival)) problems.push('its arrival point is not inside the level');
  if (problems.length) return problems;

  // Everything is where it may be: walk it, as a visitor would.
  const world = levelWorld(level);
  const half = Math.floor(size / 2);
  const start = world.start;
  if (!walkable(world, start.x, start.y)) return ['visitors arrive on a tile they cannot stand on'];
  const reach = reachable(world, start);
  for (const stand of stands) {
    const door = { x: stand.door.x - half, y: stand.door.y - half };
    if (!reach.has(key(door.x, door.y)))
      problems.push(`${stand.what} can't be walked to from the arrival point`);
  }
  return problems;
}

/** A level's owner, from its folder: a GitHub login in lower case. */
export const isLevelOwner = isBoothOwner;
