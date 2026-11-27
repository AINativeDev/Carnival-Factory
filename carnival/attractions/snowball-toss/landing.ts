/**
 * Where the snowballs come down: which standing snowman one lands on, the
 * points a person's hit scores with its shelf, its gold and the combo, and the
 * round ending once its last snowball is down. Each snowball lands against the
 * snowmen as they were at its own landing, in the order they were thrown, so
 * a late frame never lets one hit a snowman that was still down, nor leaves
 * one down too long.
 */
import { FLIGHT, landingOf, type Throw } from './flight';
import type { Game } from './game';
import { DOWN, GOLD_POINTS, goldShelf, paceOf, SHELVES, snowmanX } from './targets';

/** One snowball landing, for its "+3" or its splash: where, when, what it scored and how. */
export interface Pop {
  x: number;
  y: number;
  at: number;
  /** What it scored, 0 for a miss. */
  points: number;
  /** The combo's multiplier it scored at. */
  times: number;
  gold: boolean;
}

/** How many landings are remembered for their pops. */
const POPS = 4;

/** The combo's multiplier: two hits in a row score double, three or more triple. */
export const multiplier = (combo: number) => Math.min(3, Math.max(1, combo));

/** The shelf whose standing snowman a snowball landing at `x`, `y` at `time` hits, or -1. */
export function hitAt(game: Game, x: number, y: number, time: number): number {
  const pace = paceOf(game.round);
  return SHELVES.findIndex(
    (shelf, n) =>
      game.down.at(n) === null &&
      Math.abs(x - snowmanX(n, time, pace)) < 5 &&
      y > shelf.y - 13 &&
      y < shelf.y + 2,
  );
}

/** The snowmen as they are at `time`: one knocked down `DOWN` ago or more has stood up again. */
const standUp = (down: (number | null)[], time: number) =>
  down.map((at) => (at !== null && time - at >= DOWN ? null : at));

/** The game with the snowballs that came down by `time` landed: hits knock snowmen down and score. */
export function land(game: Game, time: number): Game {
  let { down, score, best, combo, roundScore, ended } = game;
  const pops = [...game.pops];
  const throws: Throw[] = [];
  let lastLanding: number | null = null;
  for (const ball of game.throws) {
    const lands = ball.at + FLIGHT;
    if (lands > time) {
      throws.push(ball);
      continue;
    }
    down = standUp(down, lands);
    const spot = landingOf(ball);
    const n = hitAt({ ...game, down }, spot.x, spot.y, lands);
    if (n >= 0) down = down.map((at, k) => (k === n ? lands : at));
    if (!ball.played) continue;
    combo = n >= 0 ? combo + 1 : 0;
    const gold = n >= 0 && goldShelf(game.roundStart, game.round, lands) === n;
    const times = multiplier(combo);
    const points = n < 0 ? 0 : (gold ? GOLD_POINTS : (SHELVES.at(n)?.points ?? 0)) * times;
    score += points;
    roundScore += points;
    best = Math.max(best, score);
    pops.push({ ...spot, at: lands, points, times, gold });
    lastLanding = lands;
  }
  // The round is over once its last snowball is down.
  if (game.left === 0 && lastLanding !== null && !throws.some((b) => b.played))
    ended ??= lastLanding;
  const result = { down: standUp(down, time), throws, score, best, combo, roundScore, ended };
  return { ...game, ...result, pops: pops.slice(-POPS) };
}
