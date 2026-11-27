/**
 * The game's rules: three rounds of snowballs at the tin snowmen. Each tap
 * throws one where it was tapped, the wind bends it, and one that lands on a
 * standing snowman knocks it down and scores: more for a higher shelf, more
 * for a gold snowman, and more for hits in a row. Each round the snowmen
 * slide faster and the wind blows harder. Between rounds and at the end a
 * card shows the score, and the best game of the visit is kept. With nobody
 * playing, the demo throws now and then.
 *
 * The attraction keeps one `Game` between frames, the only state it has, and
 * `advance` moves it on from `time`. Everything is in the attraction's 0 to
 * 100 units.
 */
import type { SquarePointer } from '../../../src/northpole/square';
import { demoOnBeat } from './demo';
import { type Throw, windAt } from './flight';
import { land, type Pop } from './landing';
import { SHELVES } from './targets';

/** Snowballs in one round. */
export const ROUND = 8;
/** Rounds in one game. */
export const ROUNDS = 3;
/** How long a card waits before a tap moves on, so a last quick tap doesn't skip it. */
export const GUARD = 600;
/** How long a game waits for its player before the demo takes over again, in ms. */
export const IDLE = 30_000;
/** How far in from the square's edges a snowball may be aimed, so all of it stays in view. */
const EDGE = 2;

/** All the attraction remembers, for one visit. */
export interface Game {
  /** The `time` of the last frame. */
  last: number;
  /** The snowballs still in the air. */
  throws: Throw[];
  /** When each shelf's snowman was knocked down, or null while it stands. */
  down: (number | null)[];
  score: number;
  best: number;
  /** The best of the visit before this game, to tell a new best. */
  bestBefore: number;
  /** Snowballs left in this round. */
  left: number;
  /** The `time` a person last threw. */
  playedAt: number;
  /** The round, from 1 to ROUNDS, when it started, and what it has scored. */
  round: number;
  roundStart: number;
  roundScore: number;
  /** Hits in a row. */
  combo: number;
  /** When the round's last snowball landed, or null while it's still on. */
  ended: number | null;
  /** Whether a person is playing this game, rather than the demo. */
  started: boolean;
  /** The last few landings, for their "+3" or splash. */
  pops: Pop[];
}

/** The game at the start of a visit: a full round, the demo throwing, no best yet. */
export function newGame(time: number): Game {
  return {
    ...{ last: time, throws: [], down: SHELVES.map(() => null), score: 0, best: 0 },
    ...{ bestBefore: 0, left: ROUND, playedAt: -Infinity, round: 1, roundStart: time },
    ...{ roundScore: 0, combo: 0, ended: null, started: false, pops: [] },
  };
}

/** The next round after a round's card, or a whole new game after the last one's. */
function nextRound(game: Game, time: number): Game {
  const fresh = { roundStart: time, roundScore: 0, left: ROUND, ended: null, combo: 0 };
  const standing = { down: SHELVES.map(() => null), throws: [], pops: [], playedAt: time };
  if (game.round < ROUNDS) return { ...game, ...fresh, ...standing, round: game.round + 1 };
  return { ...game, ...fresh, ...standing, round: 1, score: 0, bestBefore: game.best };
}

/** A person's first snowball of a game: the demo's snowballs are swept away. */
function begin(game: Game, time: number): Game {
  if (game.started) return game;
  const standing = { down: SHELVES.map(() => null), throws: [], pops: [] };
  return { ...game, ...standing, started: true, roundStart: time, bestBefore: game.best };
}

/** Whether the player has left the game alone long enough for the demo to take over again. */
const abandoned = (game: Game, time: number) =>
  game.started && game.throws.length === 0 && time - game.playedAt > IDLE;

/**
 * The game one frame on, at `time`, with the pointer as it is now in a `size`
 * square. Each press throws a snowball at the pointer while the round has
 * snowballs left; once its last has landed, a press on the card starts the
 * next round, or the next game after the third.
 */
export function advance(
  game: Game,
  time: number,
  pointer: SquarePointer | undefined,
  size: number,
): Game {
  if (time < game.last) return { ...newGame(time), best: game.best };
  let next: Game = { ...game, last: time };
  if (!next.started) next = demoOnBeat(next, game.last, time);
  next = land(next, time);
  if (abandoned(next, time)) return { ...newGame(time), best: next.best };
  const presses = pointer ? pointer.presses : 0;
  for (let k = 0; k < presses && pointer; k++) {
    if (next.ended !== null) {
      if (time - next.ended >= GUARD) next = nextRound(next, time);
      break;
    }
    if (next.left === 0) break;
    next = begin(next, time);
    const ball = {
      x: Math.min(100 - EDGE, Math.max(EDGE, (pointer.x / size) * 100)),
      y: Math.min(100 - EDGE, Math.max(EDGE, (pointer.y / size) * 100)),
      ...{ at: time, wind: windAt(next.round, time), played: true },
    };
    next = { ...next, throws: [...next.throws, ball], left: next.left - 1, playedAt: time };
  }
  return next;
}
