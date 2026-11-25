/**
 * Checking where everything in a level stands: its ground and blocked areas,
 * its props and its squares and exits, each inside the level, from the
 * catalogue, and on tiles of its own, never on water or ice. It's apart from
 * `level-check.ts`, which checks the rest and walks the level, because this is
 * the tile-by-tile bookkeeping of what's where.
 */
import {
  LEVEL_GROUNDS,
  standBox,
  standDoor,
  tilesOf,
  type LevelArea,
  type LevelGround,
  type LevelProp,
  type LevelSquarePlace,
  type NorthPoleLevel,
} from './level';
import { LEVEL_PROPS } from './level-props';
import { isAttractionId } from './square';
import { key, type Box, type Tile } from './world';

/** The most squares of its own a level may have. */
const MAX_LEVEL_SQUARES = 8;
const MAX_LEVEL_PROPS = 400;
const MAX_LEVEL_AREAS = 200;

export const isInteger = (value: unknown): value is number => Number.isInteger(value);

/** The box an area covers, or undefined when its numbers aren't whole tiles. */
export function areaBox(area: unknown): Box | undefined {
  if (!area || typeof area !== 'object') return undefined;
  const { x, y, w = 1, h = 1 } = area as LevelArea;
  if (![x, y, w, h].every(isInteger) || w < 1 || h < 1) return undefined;
  return { x, y, w, h };
}

/** A level part-way through its check: its size, what's wrong so far, and what's where. */
export interface Check {
  size: number;
  problems: string[];
  /** What stands on each tile, so nothing is put on top of anything else. */
  taken: Map<string, string>;
  /** The tiles of water or ice, where nothing may stand. */
  water: Set<string>;
}

/** A place visitors walk up to, a square or an exit, with its door. */
export interface Stand {
  what: string;
  box: Box;
  door: Tile;
}

export const within = ({ size }: Check, box: Box) =>
  box.x >= 0 && box.y >= 0 && box.x + box.w <= size && box.y + box.h <= size;

/** A list in the level, at most `max` long; a missing one is empty unless it's `required`. */
function list(check: Check, name: string, field: unknown, max: number, required = false) {
  if (field === undefined && !required) return [];
  if (!Array.isArray(field)) {
    check.problems.push(`its ${name} must be a list`);
    return [];
  }
  if (field.length > max) check.problems.push(`it has over ${max} ${name}`);
  return field.slice(0, max) as unknown[];
}

/** Stands `what` on a box, unless something else or water is already there. */
function occupy(check: Check, box: Box, what: string): void {
  for (const t of tilesOf(box)) {
    const there = check.taken.get(key(t.x, t.y));
    if (there) {
      check.problems.push(`${what} stands on ${there} at ${t.x}, ${t.y}`);
      return;
    }
    if (check.water.has(key(t.x, t.y))) {
      check.problems.push(`${what} stands on water or ice at ${t.x}, ${t.y}`);
      return;
    }
  }
  for (const t of tilesOf(box)) check.taken.set(key(t.x, t.y), what);
}

/** Its ground, which marks where water and ice are, and its blocked areas. */
export function checkGround(check: Check, level: NorthPoleLevel): void {
  for (const [n, entry] of list(check, 'ground areas', level.ground, MAX_LEVEL_AREAS).entries()) {
    const { tile, area } = (entry ?? {}) as { tile?: unknown; area?: unknown };
    const box = areaBox(area);
    if (!LEVEL_GROUNDS.includes(tile as LevelGround))
      check.problems.push(
        `ground ${n} is "${String(tile)}", not one of ${LEVEL_GROUNDS.join(', ')}`,
      );
    else if (!box || !within(check, box))
      check.problems.push(`ground ${n} is not inside the level`);
    else
      for (const t of tilesOf(box)) {
        if (tile === 'water' || tile === 'ice') check.water.add(key(t.x, t.y));
        else check.water.delete(key(t.x, t.y));
      }
  }
  for (const [n, area] of list(check, 'blocked areas', level.blocked, MAX_LEVEL_AREAS).entries()) {
    const box = areaBox(area);
    if (!box || !within(check, box))
      check.problems.push(`blocked area ${n} is not inside the level`);
  }
}

/** Its props: each from the catalogue, inside the level, and on a tile of its own. */
export function checkProps(check: Check, level: NorthPoleLevel): void {
  let ponds = 0;
  for (const [n, entry] of list(check, 'props', level.props, MAX_LEVEL_PROPS).entries()) {
    const prop = (entry ?? {}) as LevelProp;
    if (typeof prop.kind !== 'string' || !Object.hasOwn(LEVEL_PROPS, prop.kind)) {
      check.problems.push(`prop ${n} is "${prop.kind}", which isn't in the catalogue`);
      continue;
    }
    if (prop.variant !== undefined && !(prop.variant >= 0 && prop.variant <= 1))
      check.problems.push(`prop ${n}'s variant must be a number from 0 to 1`);
    const look = LEVEL_PROPS[prop.kind];
    const box = areaBox({ x: prop.x, y: prop.y, w: look.w, h: look.h });
    if (!box || !within(check, box)) {
      check.problems.push(`prop ${n}, a ${prop.kind}, is not inside the level`);
      continue;
    }
    if (look.thing !== undefined) {
      occupy(check, box, `prop ${n}, a ${prop.kind},`);
      continue;
    }
    if (++ponds > 1) check.problems.push('it has more than one pond');
    // A prop listed before the pond may not stand where the pond goes.
    const under = tilesOf(box).find((t) => check.taken.has(key(t.x, t.y)));
    if (under)
      check.problems.push(
        `the pond is over ${check.taken.get(key(under.x, under.y))} at ${under.x}, ${under.y}`,
      );
    else for (const t of tilesOf(box)) check.taken.set(key(t.x, t.y), `the pond`);
  }
}

/** Its squares, each with a folder, and its exits: the places visitors walk up to. */
export function checkStands(
  check: Check,
  level: NorthPoleLevel,
  folders: readonly string[],
): Stand[] {
  const stands: Stand[] = [];
  const ids = new Set<string>();
  for (const [n, entry] of list(check, 'squares', level.squares, MAX_LEVEL_SQUARES).entries()) {
    const square = (entry ?? {}) as LevelSquarePlace;
    const what = `square "${square.id}"`;
    if (typeof square.id !== 'string' || !isAttractionId(square.id)) {
      check.problems.push(`square ${n}'s id must be kebab-case`);
      continue;
    }
    if (ids.has(square.id)) check.problems.push(`two squares are called "${square.id}"`);
    ids.add(square.id);
    if (!folders.includes(square.id))
      check.problems.push(`${what} has no squares/${square.id}/square.ts`);
    stands.push({ what, box: standBox(square), door: standDoor(square) });
  }
  for (const id of folders)
    if (!ids.has(id)) check.problems.push(`squares/${id}/ isn't placed in the level's squares`);
  const exits = list(check, 'exits', level.exits, MAX_LEVEL_SQUARES, true);
  if (!exits.length) check.problems.push('it needs at least one exit back to the North Pole');
  for (const [n, exit] of exits.entries()) {
    const place = (exit ?? {}) as Tile;
    stands.push({ what: `exit ${n}`, box: standBox(place), door: standDoor(place) });
  }
  for (const stand of stands) {
    const box = areaBox(stand.box);
    if (!box || !within(check, box) || !within(check, { ...stand.door, w: 1, h: 1 }))
      check.problems.push(`${stand.what} and its door must be inside the level`);
    else occupy(check, box, stand.what);
  }
  return stands;
}
