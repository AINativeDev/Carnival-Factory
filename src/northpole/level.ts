/**
 * A participant's level: a whole patch of the North Pole of their own, in
 * `carnival/levels/<login>/level.ts`. A level is plain data, a `NorthPoleLevel`, that
 * the engine checks before anything is drawn (`validateLevel` in `level-check.ts`)
 * and then lays out here as a `World`, so the map walks it just like the North
 * Pole. Its own squares, in `carnival/levels/<login>/squares/<id>/square.ts`, run
 * sandboxed like booths. Plain functions, so the tests check every real level the
 * same way the page does.
 *
 * A level's tiles run from (0, 0) at its north corner to (size - 1, size - 1),
 * with `x` down to the right on screen and `y` down to the left, as on the map.
 */
import { LEVEL_PROPS, type LevelPropKind } from './level-props';
import { theme } from './theme';
import { type Box, type Ground, key, type Plot, type Thing, type Tile, type World } from './world';

/** The ground a level may lay. Snow is everywhere else. */
export const LEVEL_GROUNDS = ['snow', 'ice', 'path', 'water', 'bridge'] as const;
export type LevelGround = (typeof LEVEL_GROUNDS)[number];

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
type LevelTheme = keyof typeof LEVEL_THEMES;

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
  /** How many tiles it is each way: an odd number from 9 to 41 (`LEVEL_SIZE` in `level-check.ts`). */
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

/** A square's or an exit's plot inside a level, in the level's own tiles. */
export const standBox = (at: Tile): Box => ({ x: at.x, y: at.y, w: 2, h: 2 });
export const standDoor = (at: Tile): Tile => ({ x: at.x + 2, y: at.y });

/** Every tile of a box. */
export const tilesOf = (box: Box): Tile[] => {
  const tiles: Tile[] = [];
  for (let x = box.x; x < box.x + box.w; x++)
    for (let y = box.y; y < box.y + box.h; y++) tiles.push({ x, y });
  return tiles;
};

/** The box a checked area covers: a single tile unless it has a width and height. */
const boxOf = (area: LevelArea): Box => ({ x: area.x, y: area.y, w: area.w ?? 1, h: area.h ?? 1 });

/** The level's props on a world centred on (0, 0): its things, and the pond if it has one. */
function layProps(
  level: NorthPoleLevel,
  at: (tile: Tile) => Tile,
  lay: (box: Box, tile: Ground) => void,
  blocked: Set<string>,
): { things: Thing[]; pond: Box } {
  const things: Thing[] = [];
  let pond: Box = { x: 0, y: 0, w: 0, h: 0 };
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
  return { things, pond };
}

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
  const plots: Plot[] = [];

  const lay = (box: Box, tile: Ground) => {
    for (const t of tilesOf(box)) {
      const { x, y } = at(t);
      ground.set(key(x, y), tile);
      if (tile === 'water' || tile === 'ice') blocked.add(key(x, y));
      else blocked.delete(key(x, y));
    }
  };
  for (const { tile, area } of level.ground ?? []) lay(boxOf(area), tile);
  for (const area of level.blocked ?? [])
    for (const t of tilesOf(boxOf(area))) blocked.add(key(at(t).x, at(t).y));
  const { things, pond } = layProps(level, at, lay, blocked);

  const stand = (kind: 'attraction' | 'exit', id: string, number: number, place: Tile) => {
    const box = { ...at(place), w: 2, h: 2 };
    plots.push({ kind, id, number, ...box, door: at(standDoor(place)) });
    for (const t of tilesOf(box)) blocked.add(key(t.x, t.y));
  };
  for (const [n, square] of (level.squares ?? []).entries())
    stand('attraction', square.id, n, square);
  for (const [n, exit] of level.exits.entries()) stand('exit', 'north-pole', n, exit);

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
