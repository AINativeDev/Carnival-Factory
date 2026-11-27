/**
 * The curling sheet on Frozen Pond, as plain functions: where it lies on the
 * ice, how far a stone is from the house's middle and what that scores, and
 * each end's wind and rival stones. A stone's place on the ice is `s` along
 * the sheet from the hack and `w` across it, in the same units both ways; on
 * screen the sheet runs left to right along the pond's long axis, seen from
 * the world's angle, so across is drawn half as tall.
 */

/** The pond: an oval of ice along the slab's long diagonal, in the square's 0 to 100 units. */
export const POND = { x: 50, y: 66, across: 40, down: 9 };
/** Where the sheet's hack is on screen, and how far the sheet reaches either side of its middle line. */
export const SHEET = { x: 16, y: 66, wide: 10 };
/** Where a stone is set down to be thrown, along the sheet. */
export const HACK = 3;
/** The house: its middle along the sheet, and its rings' radii from the button out. */
export const HOUSE = { s: 58, rings: [3, 6, 9] as const };
/** The back line: a stone past it is out of play. */
export const BACK = 67;
/** A stone's radius. */
export const STONE = 1.5;
/** How many stones the visitor throws each end. */
export const STONES = 5;
/** How many ends make a game. */
export const ENDS = 3;

/** A point on screen, in the square's 0 to 100 units. */
export interface Point {
  x: number;
  y: number;
}

/** A stone on the sheet: where, how fast, whose, and when it went out of play, if it has. */
export interface Stone {
  s: number;
  w: number;
  vs: number;
  vw: number;
  rival: boolean;
  out: number;
}

/** Where a spot on the sheet is on screen. */
export function onScreen(s: number, w: number): Point {
  return { x: SHEET.x + s, y: SHEET.y + w / 2 };
}

/** How far a stone's middle is from the button. */
export function fromButton(stone: Stone): number {
  return Math.hypot(stone.s - HOUSE.s, stone.w);
}

/** Whether a stone has left the sheet, over a side or past the back line. */
export function offSheet(stone: Stone): boolean {
  return Math.abs(stone.w) > SHEET.wide || stone.s > BACK + STONE;
}

/** What a stone this far from the button scores: 3 touching the inner ring, 2 the middle, 1 the outer. */
export function ringPoints(distance: number): number {
  const ring = HOUSE.rings.findIndex((radius) => distance - STONE <= radius);
  return ring < 0 ? 0 : 3 - ring;
}

/**
 * The end's result: the stone in play nearest the button, and what it scores.
 * Only the visitor's own stone scores: a rival's nearest takes the end for nothing.
 */
export function shotStone(stones: readonly Stone[]): { stone: Stone | undefined; points: number } {
  let nearest: Stone | undefined;
  for (const stone of stones) {
    if (stone.out !== Infinity) continue;
    if (!nearest || fromButton(stone) < fromButton(nearest)) nearest = stone;
  }
  if (!nearest || nearest.rival) return { stone: nearest, points: 0 };
  return { stone: nearest, points: ringPoints(fromButton(nearest)) };
}

/** A steady pseudo-random number from 0 to 1 for `n`: the same every time, so an end is fair to replay. */
export function hash(n: number): number {
  const s = Math.sin(n * 12.9898 + 78.233) * 43_758.5453;
  return s - Math.floor(s);
}

/**
 * The wind across the sheet on end `end` of the game seeded `seed`, as a push
 * across in units a second squared: stronger each end, from either side.
 */
export function windFor(end: number, seed: number): number {
  const side = hash(seed + end * 31) < 0.5 ? -1 : 1;
  return side * (0.2 + end * 0.75 + hash(seed + end * 17) * 0.6);
}

/** A stone standing still at (s, w). */
export function stoneAt(s: number, w: number, rival: boolean): Stone {
  return { s, w, vs: 0, vw: 0, rival, out: Infinity };
}

/**
 * The rivals' stones waiting at the start of end `end`: one more each end,
 * the first in the middle ring, the second guarding in front of the house,
 * the third nearer the button, so each end is harder to win than the last.
 */
export function rivalsFor(end: number, seed: number): Stone[] {
  const spots = [
    [HOUSE.s + 3.5, 3.5],
    [HOUSE.s - 13, -1],
    [HOUSE.s + 2.2, -2],
  ] as const;
  return spots.slice(0, end).map(([s, w], n) => {
    const jiggle = (k: number) => (hash(seed + end * 7 + n * 3 + k) - 0.5) * 1.5;
    return stoneAt(s + jiggle(0), w + jiggle(1), true);
  });
}
