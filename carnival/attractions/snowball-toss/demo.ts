/**
 * The demo, which plays Snowball Toss with nobody playing so the map's view of
 * it still moves: now and then a snowball flies at whichever snowman is
 * standing, aimed against the wind where it will be when the snowball lands.
 * It scores nothing.
 */
import { DRIFT, FLIGHT, type Throw, windAt } from './flight';
import type { Game } from './game';
import { land } from './landing';
import { DOWN, paceOf, SHELVES, snowmanX } from './targets';

/** The demo throws on each multiple of this, in ms: one throw has landed and its snowman stood up by the next. */
const DEMO_EVERY = FLIGHT + DOWN;

/** The demo's throw at `time`: at whichever snowman is standing, allowing for the wind. */
function demoThrow(game: Game, time: number): Throw | undefined {
  const n = game.down.findIndex((at) => at === null);
  const shelf = SHELVES.at(n);
  if (!shelf) return undefined;
  const wind = windAt(game.round, time);
  const x = snowmanX(n, time + FLIGHT, paceOf(game.round)) - wind * DRIFT;
  return { x, y: shelf.y - 6, at: time, wind, played: false };
}

/**
 * The game with the demo's throw for the last beat between `from` and `to`, if
 * one passed, thrown on the beat itself rather than at a late frame, so the
 * demo is the same however often it's drawn. Only the last beat counts: a demo
 * throw has landed and its snowman stood up again by the next beat, since
 * `DEMO_EVERY` is `FLIGHT` and `DOWN` together.
 */
export function demoOnBeat(game: Game, from: number, to: number): Game {
  const beat = Math.floor(to / DEMO_EVERY) * DEMO_EVERY;
  if (beat <= from) return game;
  const next = land(game, beat);
  if (next.throws.length > 0) return next;
  const ball = demoThrow(next, beat);
  return ball ? { ...next, throws: [ball] } : next;
}
