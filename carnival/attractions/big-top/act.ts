/**
 * The Juggling Elf's act: baubles arc over the ring, and a tap on one as it
 * falls tosses it back up. Every few catches the ringside elf throws in another
 * bauble, and the arcs get quicker; a bauble that falls past the hands is
 * dropped and the act is over. Catches in a row build a streak that scores
 * more; a tap that catches nothing breaks it. With nobody playing, the elf
 * juggles three baubles on its own, never dropping one.
 *
 * The attraction keeps one `Ring` between frames, and `advance` moves it on.
 */
import type { SquarePointer } from '../../../src/northpole/square';
import { baubleAt, CATCHABLE, DROPPED, flight, HANDS, REACH, tossFrom, type Toss } from './throws';

/** The most baubles in the air at once. */
export const MOST = 5;
/** Catches between each new bauble the ringside elf throws in. */
export const EVERY = 5;
/** How long after a drop the act's card waits before a tap starts the next act, in ms. */
export const CARD = 1_400;
/** How long a finished act waits for a tap before the elf juggles on its own again, in ms. */
export const IDLE = 20_000;
/** Where the ringside elf at the ringside throws new baubles in from. */
export const RINGSIDE_ELF = { x: 20, y: 60 };

/** What the last tap did, for its sparkle or its puff: where, when, and the points it won (0 for a miss). */
interface Pop {
  at: number;
  x: number;
  y: number;
  points: number;
}

/** One act in the ring, the visitor's or the elf's own. */
export interface Act {
  visitor: boolean;
  start: number;
  balls: Toss[];
  /** Throws so far, so each new one varies. */
  tosses: number;
  catches: number;
  score: number;
  streak: number;
  /** When a bauble was dropped, ending the act. */
  dropped: number | null;
  pop: Pop | null;
  /** When the ringside elf last threw a new bauble in. */
  joined: number;
}

/** All the Big Top remembers for one visit: the act, the best score and whether this act beat it. */
export interface Ring {
  act: Act;
  best: number;
  record: boolean;
}

/** What a catch scores with `streak` catches in a row before it: one more for every five, up to five. */
export const multiplier = (streak: number) => 1 + Math.min(4, Math.floor(streak / EVERY));

/** A fresh act at `time`: two baubles for a visitor, thrown in turn, or three for the elf's own show. */
export function newAct(time: number, visitor: boolean): Act {
  const count = visitor ? 2 : 3;
  const balls = Array.from({ length: count }, (_, n) => {
    const x = n % 2 ? HANDS.x + HANDS.spread : HANDS.x - HANDS.spread;
    return tossFrom(x, HANDS.y, time + 500 + n * 750, 0, n);
  });
  return {
    ...{ visitor, start: time, balls, tosses: count, catches: 0, score: 0, streak: 0 },
    ...{ dropped: null, pop: null, joined: -Infinity },
  };
}

/** The Big Top at the start of a visit: the elf juggling on its own. */
export function newRing(time: number): Ring {
  return { act: newAct(time, false), best: 0, record: false };
}

/** The bauble a tap at (x, y) catches at `time`: the one nearest its drop within reach, or -1. */
export function catchable(act: Act, x: number, y: number, time: number): number {
  let found = -1;
  let furthest = -Infinity;
  act.balls.forEach((toss, n) => {
    const s = flight(toss, time);
    const p = baubleAt(toss, time);
    if (s < CATCHABLE || s >= DROPPED || Math.hypot(p.x - x, p.y - y) > REACH) return;
    if (s > furthest) [found, furthest] = [n, s];
  });
  return found;
}

/** Tosses bauble `n` back up from where it is at `time`. */
function rethrow(act: Act, n: number, time: number) {
  const toss = act.balls.at(n);
  if (!toss) return;
  const p = baubleAt(toss, time);
  const next = tossFrom(p.x, p.y, time, act.catches, act.tosses);
  act.tosses += 1;
  act.balls = act.balls.map((ball, m) => (m === n ? next : ball));
}

/**
 * A visitor's tap at (x, y) at `time`: catches a falling bauble and scores it
 * with the streak, adding a bauble every few catches, or misses and breaks the streak.
 */
export function tap(act: Act, x: number, y: number, time: number) {
  const n = catchable(act, x, y, time);
  if (n < 0) {
    act.streak = 0;
    act.pop = { at: time, x, y, points: 0 };
    return;
  }
  const points = multiplier(act.streak);
  rethrow(act, n, time);
  act.catches += 1;
  act.score += points;
  act.streak += 1;
  act.pop = { at: time, x, y, points };
  if (act.catches % EVERY === 0 && act.balls.length < MOST) {
    const toss = tossFrom(RINGSIDE_ELF.x, RINGSIDE_ELF.y, time + 300, act.catches, act.tosses);
    act.tosses += 1;
    act.balls = [...act.balls, toss];
    act.joined = time;
  }
}

/** The elf's own show: each bauble caught low, near the hands, and tossed straight back up. */
function autoplay(act: Act, time: number) {
  act.balls.forEach((toss, n) => {
    if (flight(toss, time) >= 0.94) rethrow(act, n, time);
  });
}

/**
 * Ends a visitor's act at `time` if a bauble has fallen past the hands. The
 * elf's own show never ends: after a frame that was away, it picks the baubles up.
 */
export function settle(act: Act, time: number) {
  if (act.dropped !== null || !act.visitor) return;
  if (act.balls.some((toss) => flight(toss, time) >= DROPPED)) act.dropped = time;
}

/** Whether the crowd claps the act that just ended, or gasps at the drop. */
export function applause(ring: Ring): boolean {
  return ring.record || ring.act.catches >= 10;
}

/**
 * Moves the Big Top on to `time`, with what the pointer did since the last
 * frame over a square `size` across: the first tap starts an act, taps catch,
 * and after a drop a tap on the card starts the next one.
 */
export function advance(
  ring: Ring,
  time: number,
  pointer: SquarePointer | undefined,
  size: number,
): Ring {
  let { act, best, record } = ring;
  const over = act.dropped === null ? 0 : time - act.dropped;
  if (act.visitor && over > IDLE) act = newAct(time, false);
  if (pointer && pointer.presses > 0) {
    if (!act.visitor || over >= CARD) [act, record] = [newAct(time, true), false];
    else if (act.dropped === null)
      tap(act, (pointer.x * 100) / size, (pointer.y * 100) / size, time);
  }
  if (!act.visitor) autoplay(act, time);
  const playing = act.dropped === null;
  settle(act, time);
  if (playing && act.dropped !== null && act.score > best) [best, record] = [act.score, true];
  return { act, best, record };
}
