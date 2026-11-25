/**
 * Checking a participant's level before anything is drawn: that it's plain
 * data within the size limits, with its name and theme, its every part where it
 * may be (`level-check-places.ts`), and that every square and exit can be
 * walked to from where visitors arrive. A level that fails shows "Closed for
 * repairs" on its platform. It's apart from `level.ts`, which lays a checked
 * level out, because a level is untrusted data and its rules live here.
 */
import { LEVEL_THEMES, levelWorld, type NorthPoleLevel } from './level';
import {
  areaBox,
  checkGround,
  checkProps,
  checkStands,
  isInteger,
  within,
  type Check,
  type Stand,
} from './level-check-places';
import { reachable } from './pathfinding';
import { isBoothOwner } from './square';
import { walkable } from './walking';
import { key } from './world';

const LEVEL_SIZE = { min: 9, max: 41 };
const MAX_NAME = 40;
const MAX_DESCRIPTION = 160;

/** Its folder, id, name, description and theme. */
function checkLabel(level: NorthPoleLevel, folder: string, problems: string[]): void {
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
}

/** Walks a level whose every part is where it may be, as a visitor would. */
function walkProblems(level: NorthPoleLevel, stands: readonly Stand[]): string[] {
  const world = levelWorld(level);
  const half = Math.floor(level.size / 2);
  const start = world.start;
  if (!walkable(world, start.x, start.y)) return ['visitors arrive on a tile they cannot stand on'];
  const reach = reachable(world, start);
  return stands
    .filter(({ door }) => !reach.has(key(door.x - half, door.y - half)))
    .map((stand) => `${stand.what} can't be walked to from the arrival point`);
}

/**
 * What's wrong with a level, in words its owner can act on. Empty means the
 * engine may draw it. `folder` is the folder it's in, and `squareFolders` the
 * ids of the squares in its `squares/` folder.
 */
export function validateLevel(
  value: unknown,
  folder: string,
  squareFolders: readonly string[] = [],
): string[] {
  if (!value || typeof value !== 'object') return ['level.ts must export its NorthPoleLevel'];
  const level = value as NorthPoleLevel;
  const problems: string[] = [];
  checkLabel(level, folder, problems);
  const { size } = level;
  if (!isInteger(size) || size < LEVEL_SIZE.min || size > LEVEL_SIZE.max || size % 2 === 0) {
    problems.push(`its size must be an odd number from ${LEVEL_SIZE.min} to ${LEVEL_SIZE.max}`);
    return problems;
  }
  const check: Check = { size, problems, taken: new Map(), water: new Set() };
  checkGround(check, level);
  checkProps(check, level);
  const stands = checkStands(check, level, squareFolders);
  const arrival = areaBox(level.arrival);
  if (!arrival || !within(check, arrival))
    problems.push('its arrival point is not inside the level');
  if (problems.length) return problems;
  return walkProblems(level, stands);
}
