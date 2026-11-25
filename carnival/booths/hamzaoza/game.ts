/**
 * The game's rules: scoring snowflakes, crashing into rocks and drifts, the best
 * run of the visit, and starting again. The booth keeps one `Game` between
 * frames, the only state it has, and `advance` moves it on from `time`.
 */
import type { SquarePointer } from '../../../src/northpole/square';
import { clamp, EDGE, pathAt, thingsBetween } from './course';
import { distanceFor, laneAt, laneOf, STEER, TAP_STEP, toward } from './sledding';

/** Points for each snowflake scooped up. */
export const POINTS = 10;

/** How close in lanes the penguin must pass to hit a rock or drift. */
export const HIT = 0.38;
/** How close in lanes the penguin must pass a snowflake to scoop it up: a little kinder than `HIT`. */
export const CATCH = 0.42;

/** A run nobody steers starts again after this many seconds, so the map's demo keeps changing. */
const DEMO = 40;
/** After a crash with nobody there, the penguin lies still this many ms before a new run. */
export const REST = 1_500;
/** A crashed player's tap starts a new run once the tumble has had this long, in ms. */
export const TUMBLE = 400;
/** A tap's steering holds this long, in ms, after the finger lifts, before the penguin steers itself. */
export const TAP_HOLD = 3_000;
/** The longest step one frame takes, in seconds: a longer gap pauses the run instead. */
export const MAX_STEP = 0.25;

/** One run down the mountain. */
export interface Run {
  seed: number;
  /** The `time` it started. */
  start: number;
  distance: number;
  lane: number;
  /** The lane the penguin is steering for. */
  target: number;
  score: number;
  /** The `time` it hit something, or null while it is still going. */
  crashedAt: number | null;
  /** Whether a person steered it, so it counts towards the best. */
  played: boolean;
}

/** All the booth remembers, for one visit. */
export interface Game {
  run: Run;
  best: number;
  runs: number;
  /** The `time` of the last frame. */
  last: number;
  /** Steering by taps on either half, rather than by following the pointer. */
  tapping: boolean;
  lastX: number | null;
  /** The `time` the pointer was last over the drawing. */
  seen: number;
}

/** A fresh run on the course `seed`, starting at `time` from `lane`, counted only if `played`. */
export function newRun(seed: number, start: number, lane = 0, played = false): Run {
  return { seed, start, distance: 0, lane, target: lane, score: 0, crashedAt: null, played };
}

/** The game at the start of a visit: the first course, no best yet, the penguin steering itself. */
export function newGame(time: number): Game {
  return {
    run: newRun(1, time),
    best: 0,
    runs: 1,
    last: time,
    tapping: false,
    lastX: null,
    seen: time,
  };
}

function restart(game: Game, time: number, played: boolean): Game {
  const runs = game.runs + 1;
  return { ...game, runs, last: time, run: newRun(runs, time, game.run.lane, played) };
}

/**
 * The game one frame on, at `time`, with the pointer as it is now. With no
 * pointer the penguin weaves along the clear line on its own, and starts again
 * after a crash or a long run. A person steers by the pointer's place across the
 * drawing, or by taps on either half, and a tap after a crash starts a new run.
 */
export function advance(
  game: Game,
  time: number,
  pointer: SquarePointer | undefined,
  size: number,
): Game {
  if (time < game.last) return newGame(time);
  const gap = (time - game.last) / 1000;
  const dt = Math.min(MAX_STEP, gap);
  // A longer gap, such as a hidden tab, pauses the run rather than skipping ahead.
  const run =
    gap > MAX_STEP ? { ...game.run, start: game.run.start + (gap - MAX_STEP) * 1000 } : game.run;
  let { tapping, lastX } = game;
  const seen = pointer ? time : game.seen;

  if (run.crashedAt !== null) {
    const since = time - run.crashedAt;
    if (pointer && pointer.presses > 0 && since > TUMBLE) return restart(game, time, true);
    if (!pointer && since > REST) return restart(game, time, false);
    return { ...game, run, last: time, lastX: pointer ? pointer.x : null, seen };
  }

  let target = run.target;
  let played = run.played;
  if (!pointer) {
    // A tap's steering holds after the finger lifts, so taps can add up.
    lastX = null;
    if (!tapping || time - game.seen > TAP_HOLD) {
      tapping = false;
      target = pathAt(run.seed, run.distance);
    }
  } else if (pointer.presses > 0) {
    tapping = true;
    lastX = pointer.x;
    target = clamp(
      target + (pointer.x < size / 2 ? -1 : 1) * TAP_STEP * pointer.presses,
      -EDGE,
      EDGE,
    );
    played = true;
  } else if (tapping && lastX === null) {
    // A finger back on the drawing keeps tapping until it moves.
    lastX = pointer.x;
  } else if (!tapping || lastX === null || Math.abs(pointer.x - lastX) > size * 0.02) {
    tapping = false;
    lastX = pointer.x;
    target = laneOf(pointer.x, size);
    played = true;
  }

  const seconds = (time - run.start) / 1000;
  if (!played && seconds > DEMO) return restart(game, time, false);

  const lane = toward(run.lane, target, STEER * dt);
  const distance = distanceFor(seconds);
  let score = run.score;
  let crashedAt: number | null = null;
  for (const t of thingsBetween(run.seed, run.distance, distance)) {
    const across = Math.abs(
      t.lane - laneAt(run.lane, target, STEER * dt, run.distance, distance, t.distance),
    );
    if (t.kind === 'flake') {
      if (across < CATCH) score += POINTS;
    } else if (across < HIT) {
      crashedAt = time;
      break;
    }
  }

  const next: Run = { ...run, distance, lane, target, score, crashedAt, played };
  return {
    ...game,
    run: next,
    best: played ? Math.max(game.best, score) : game.best,
    last: time,
    tapping,
    lastX,
    seen,
  };
}
