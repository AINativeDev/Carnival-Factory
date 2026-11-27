/**
 * Curling on Frozen Pond: drag back from the stone and let go to throw it down
 * the sheet, tap the ice while it slides to sweep it further, and get a stone
 * of your own nearest the button. Five stones an end, three ends a game, the
 * wind shifting each end and one more rival stone waiting in the house. With
 * nobody playing, the skip (skip.ts) plays the ends on a loop.
 *
 * The attraction keeps one `Curling` between frames, its only state, and
 * `advance` moves it on from `time`.
 */
import type { SquarePointer } from '../../../src/northpole/square';
import * as sheet from './sheet';
import type { Point, Stone } from './sheet';
import { skipAims, skipSweeps } from './skip';
import { STEP_MS, launch, moving, slideAll, throwFrom, type Throw } from './stones';

/** Whether the skip is showing the game, a visitor is playing, or the game is over. */
export type Mode = 'demo' | 'play' | 'over';
/** Where an end is: aiming the next stone, stones sliding, or the end being scored. */
type Phase = 'aim' | 'slide' | 'tally';

/** The game's one piece of state for the visit. */
export interface Curling {
  mode: Mode;
  seed: number;
  end: number;
  thrown: number;
  stones: Stone[];
  phase: Phase;
  /** The drag being made, from where it was pressed to where it is now, on screen. */
  drag: { from: Point; to: Point } | null;
  wind: number;
  /** The stone just thrown, the one sweeping helps. */
  current: number;
  sweptUntil: number;
  sweeps: number[];
  /** How far the stones' slide has been worked out, in milliseconds. */
  clock: number;
  restAt: number;
  knockAt: number;
  nudgedAt: number;
  /** The end just scored: when, by which stone, and for how much. */
  tally: { at: number; s: number; w: number; points: number; rival: boolean } | null;
  ends: number[];
  score: number;
  best: number;
  endedAt: number;
  then: number;
}

/** How long an end's score shows before the next end. */
export const TALLY = 2_800;
/** How long one tap of sweeping keeps the ice easier ahead of the stone. */
const SWEEP = 300;
/** How long the game-over card waits before a tap plays again. */
export const REOPEN = 900;
/** How long the game-over card waits before the skip takes the pond back. */
export const IDLE = 25_000;
/** The longest frame the stones slide for: a longer gap, a hidden tab, holds them still. */
const LONGEST_FRAME = 400;

/** End `end` of a game seeded `seed`, starting at `time`: the rivals set out and the wind turned. */
function startEnd(game: Curling, end: number, time: number) {
  game.end = end;
  game.thrown = 0;
  game.stones = sheet.rivalsFor(end, game.seed);
  game.wind = sheet.windFor(end, game.seed);
  game.phase = 'aim';
  game.restAt = time;
  game.tally = null;
}

/** A fresh game from `time`, played by a visitor or shown by the skip. */
export function newCurling(time: number, mode: Mode, best = 0): Curling {
  const game: Curling = {
    ...{ mode, seed: Math.floor(time) % 10_000, end: 1, thrown: 0, stones: [], phase: 'aim' },
    ...{ drag: null, wind: 0, current: -1, sweptUntil: -Infinity, sweeps: [], clock: time },
    ...{ restAt: time, knockAt: -Infinity, nudgedAt: -Infinity, tally: null, ends: [] },
    ...{ score: 0, best, endedAt: -Infinity, then: time },
  };
  startEnd(game, 1, time);
  return game;
}

/** Throws the next stone at `time`: it slides from the hack. */
export function throwStone(game: Curling, thrown: Throw, time: number) {
  game.stones.push(launch(thrown));
  game.current = game.stones.length - 1;
  game.thrown += 1;
  game.phase = 'slide';
  game.clock = time;
  game.drag = null;
}

/** A sweep at `time`: the stone slides easier and straighter for a moment. */
export function sweep(game: Curling, time: number) {
  game.sweptUntil = time + SWEEP;
  game.sweeps = [...game.sweeps.slice(-3), time];
}

/** The visitor's drag: pressed, moved and let go, a throw if it pulled back far enough. */
function aim(game: Curling, time: number, at: Point | undefined, down: boolean, presses: number) {
  if (!game.drag && presses > 0 && at) game.drag = { from: at, to: at };
  if (!game.drag) return;
  if (at && down) {
    game.drag.to = at;
    return;
  }
  const thrown = throwFrom(game.drag.from, at ?? game.drag.to);
  game.drag = null;
  if (thrown) throwStone(game, thrown, time);
  else game.nudgedAt = time;
}

/** The stones slid on to `time`, and the end moved on once they've all stopped. */
function slideOn(game: Curling, time: number) {
  const steps = Math.floor((time - game.clock) / STEP_MS);
  const sweeping = (at: number) => at < game.sweptUntil;
  const how = { wind: game.wind, swept: game.current, sweeping };
  if (slideAll(game.stones, steps, game.clock, how) > 0) game.knockAt = time;
  game.clock += steps * STEP_MS;
  game.stones = game.stones.filter((stone) => time - stone.out < 700);
  if (game.stones.some(moving)) return;
  game.restAt = time;
  game.phase = game.thrown < sheet.STONES ? 'aim' : 'tally';
  if (game.phase === 'aim') return;
  const { stone, points } = sheet.shotStone(game.stones);
  const rival = stone?.rival ?? false;
  game.tally = { at: time, s: stone?.s ?? sheet.HOUSE.s, w: stone?.w ?? 0, points, rival };
  if (game.mode === 'play') game.ends = [...game.ends, points];
  if (game.mode === 'play') game.score += points;
}

/** After an end's score has shown: the next end, or the game's end. */
function afterTally(game: Curling, time: number): Curling {
  if (game.end < sheet.ENDS) startEnd(game, game.end + 1, time);
  else if (game.mode === 'demo') return newCurling(time, 'demo', game.best);
  else {
    game.mode = 'over';
    game.endedAt = time;
    game.best = Math.max(game.best, game.score);
  }
  return game;
}

/** Moves the game on to `time`, with the pointer over a square `size` across. */
export function advance(
  game: Curling,
  time: number,
  pointer: SquarePointer | undefined,
  size: number,
): Curling {
  const at = pointer && { x: (pointer.x * 100) / size, y: (pointer.y * 100) / size };
  const presses = pointer?.presses ?? 0;
  if (time - game.then > LONGEST_FRAME) game.clock = time;
  game.then = time;
  const restart = game.mode === 'over' && time - game.endedAt >= REOPEN;
  if (presses > 0 && (game.mode === 'demo' || restart)) {
    const fresh = newCurling(time, 'play', game.best);
    if (at && pointer.down) fresh.drag = { from: at, to: at };
    return fresh;
  }
  if (game.mode === 'over')
    return time - game.endedAt >= IDLE ? newCurling(time, 'demo', game.best) : game;
  if (game.phase === 'tally')
    return time - (game.tally?.at ?? time) >= TALLY ? afterTally(game, time) : game;
  if (game.phase === 'aim' && game.mode === 'play')
    aim(game, time, at, pointer?.down ?? false, presses);
  else if (game.phase === 'aim') {
    const thrown = skipAims(game, time);
    if (thrown) throwStone(game, thrown, time);
  }
  if (game.phase !== 'slide') return game;
  if (game.mode === 'play' && presses > 0) sweep(game, time);
  if (game.mode === 'demo' && skipSweeps(game, time)) sweep(game, time);
  slideOn(game, time);
  return game;
}
