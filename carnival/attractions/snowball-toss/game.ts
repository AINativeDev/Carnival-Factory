/**
 * The game's rules: each tap throws a snowball in an arc to where it landed,
 * three tin snowmen slide along the shelves, a snowball that lands on a
 * standing one knocks it down and scores, and the best round of the visit is
 * kept. Everything is in the attraction's 0 to 100 units. The attraction keeps
 * one `Game` between frames, the only state it has, and `advance` moves it on
 * from `time`.
 */
import type { SquarePointer } from '../../../src/northpole/square';

/** Snowballs in one round. */
export const ROUND = 10;
/** How long a snowball is in the air, in ms. */
export const FLIGHT = 600;
/** How long a knocked snowman lies down before it stands up again, in ms. */
export const DOWN = 1_800;
/** Where every snowball leaves the hand: the middle of the counter at the front. */
export const HAND = { x: 50, y: 94 };
/** Snowballs in the air at once, at most: more taps wait for one to land. */
const IN_THE_AIR = 4;
/** With nobody playing, the demo throws one every this many ms. */
const DEMO_EVERY = 2_400;
/** After a person's last throw, the demo waits this long before it throws again. */
const DEMO_WAITS = 6_000;

/** The three shelves, bottom to top: where a snowman's feet are, how far it slides, how fast, and what it scores. */
export const SHELVES = [
  { y: 63, swing: 18, period: 3_400, points: 1 },
  { y: 49, swing: 14, period: 2_400, points: 2 },
  { y: 35, swing: 10, period: 1_500, points: 3 },
] as const;

/** One snowball thrown at `at` towards `x`, `y`, and whether a person threw it. */
export interface Throw {
  x: number;
  y: number;
  at: number;
  played: boolean;
}

/** All the attraction remembers, for one visit. */
export interface Game {
  /** The `time` of the last frame. */
  last: number;
  /** The snowballs still in the air or just landed. */
  throws: Throw[];
  /** When each shelf's snowman was knocked down, or null while it stands. */
  down: (number | null)[];
  score: number;
  best: number;
  /** Snowballs left in this round. */
  left: number;
  /** The `time` a person last threw. */
  playedAt: number;
}

/** The game at the start of a visit: a full round, no best yet. */
export function newGame(time: number): Game {
  return {
    last: time,
    throws: [],
    down: SHELVES.map(() => null),
    score: 0,
    best: 0,
    left: ROUND,
    playedAt: -Infinity,
  };
}

/** Where shelf `n`'s snowman stands across at `time`: sliding to and fro, each shelf at its own pace. */
export function snowmanX(n: number, time: number): number {
  const shelf = SHELVES.at(n);
  if (!shelf) return 50;
  return 50 + Math.sin((time / shelf.period) * Math.PI * 2 + n * 2) * shelf.swing;
}

/** Where `ball` is at `time`, arcing up from the hand, or undefined once it has landed. */
export function flightOf(ball: Throw, time: number): { x: number; y: number } | undefined {
  const t = (time - ball.at) / FLIGHT;
  if (t < 0 || t >= 1) return undefined;
  return {
    x: HAND.x + (ball.x - HAND.x) * t,
    y: HAND.y + (ball.y - HAND.y) * t - Math.sin(t * Math.PI) * 18,
  };
}

/** How far shelf `n`'s snowman has tipped at `time`, from 0 (standing) to 1 (flat), and back up. */
export function topple(game: Game, n: number, time: number): number {
  const at = game.down.at(n) ?? null;
  if (at === null) return 0;
  const t = time - at;
  if (t < 200) return t / 200;
  if (t < DOWN - 400) return 1;
  return Math.max(0, (DOWN - t) / 400);
}

/** The shelf whose standing snowman a snowball landing at `x`, `y` at `time` hits, or -1. */
export function hitAt(game: Game, x: number, y: number, time: number): number {
  return SHELVES.findIndex(
    (shelf, n) =>
      game.down[n] === null &&
      Math.abs(x - snowmanX(n, time)) < 5 &&
      y > shelf.y - 13 &&
      y < shelf.y + 2,
  );
}

/** The game with the snowballs that came down by `time` landed: hits knock snowmen down and score. */
function land(game: Game, time: number): Game {
  const down = game.down.map((at) => (at !== null && time - at >= DOWN ? null : at));
  let { score, best } = game;
  const throws: Throw[] = [];
  for (const ball of game.throws) {
    const lands = ball.at + FLIGHT;
    if (lands > time) {
      throws.push(ball);
      continue;
    }
    const n = hitAt({ ...game, down }, ball.x, ball.y, lands);
    if (n >= 0) {
      down[n] = lands;
      if (ball.played) score += SHELVES[n]?.points ?? 0;
    }
    best = Math.max(best, score);
  }
  return { ...game, down, throws, score, best };
}

/** The demo's throw: at whichever snowman is standing, aimed where it will be when the snowball lands. */
function demoThrow(game: Game, time: number): Throw | undefined {
  const n = game.down.findIndex((at) => at === null);
  const shelf = SHELVES.at(n);
  if (!shelf) return undefined;
  return { x: snowmanX(n, time + FLIGHT), y: shelf.y - 6, at: time, played: false };
}

/**
 * The game one frame on, at `time`, with the pointer as it is now in a `size`
 * square. Each press throws a snowball at the pointer, while the round has
 * snowballs left; a press after the round's last has landed starts a new round.
 * With nobody playing, the demo throws now and then, and scores nothing.
 */
export function advance(
  game: Game,
  time: number,
  pointer: SquarePointer | undefined,
  size: number,
): Game {
  if (time < game.last) return newGame(time);
  let next = land({ ...game, last: time }, time);
  const presses = pointer ? pointer.presses : 0;
  for (let k = 0; k < presses && pointer; k++) {
    if (next.left === 0 && next.throws.every((ball) => !ball.played)) {
      next = { ...next, score: 0, left: ROUND };
    }
    if (next.left === 0 || next.throws.length >= IN_THE_AIR) break;
    const ball = {
      x: (pointer.x / size) * 100,
      y: (pointer.y / size) * 100,
      at: time,
      played: true,
    };
    next = { ...next, throws: [...next.throws, ball], left: next.left - 1, playedAt: time };
  }
  const lastDemo = Math.max(
    next.playedAt + DEMO_WAITS - DEMO_EVERY,
    ...game.throws.map((b) => b.at),
  );
  if (
    time - next.playedAt > DEMO_WAITS &&
    next.throws.length === 0 &&
    time - lastDemo >= DEMO_EVERY
  ) {
    const ball = demoThrow(next, time);
    if (ball) next = { ...next, throws: [ball] };
  }
  return next;
}
