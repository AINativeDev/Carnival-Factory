/**
 * The journey's rules. Nothing moves on by itself: every beat waits for a
 * tap or a key. A tap on the gold button, or anywhere on the scene, does the
 * step's next thing, and so do →, Enter and Space; picking a booth or a look
 * takes a tap on its card (or Surprise me); the checks take a tap on each
 * bug (or Squash!); Back, or ←, goes back a beat or a step. A tap on a nudge
 * asks the page instead (nudges.ts) and moves nothing. After a minute with
 * nobody playing, the first screen comes back for the next visitor.
 */
import type { SquareKey, SquarePointer } from '../../../src/northpole/square';
import { bugAt, nextBug } from './bugs';
import { actionFor, BACK, choiceAt, END_SCENE, hasBack, inside, LIVE_NEXT, SCENE } from './layout';
import { nudgeAt, type SquareAsk } from './nudges';
import { IDLE_RESET, newVisit, type Visit } from './state';
import { STEPS, type StepKind } from './steps';

/** How long the "you're on the map" card waits before its buttons take a tap, so a quick double tap can't hit one, in ms. */
export const LIVE_GUARD = 700;

/** The kind of step up. */
export const kindOf = (visit: Visit): StepKind => STEPS.at(visit.step)?.kind ?? 'start';

/** Beat `beat` of step `step`, from `time`, remembering the step it came from. */
const go = (visit: Visit, step: number, beat: number, time: number): Visit => ({
  ...visit,
  step,
  beat,
  at: time,
  from: visit.step,
  playedAt: time,
});

/** The next beat, the next step after the last beat, or the first screen again after the last step. */
function onward(visit: Visit, time: number): Visit {
  const beats = STEPS.at(visit.step)?.beats.length ?? 1;
  if (visit.beat + 1 < beats) return go(visit, visit.step, visit.beat + 1, time);
  if (visit.step + 1 < STEPS.length) return go(visit, visit.step + 1, 0, time);
  return { ...newVisit(time), playedAt: time };
}

/** Back a beat, or to the step before; the checks' bugs come back with it. Nothing where there is no back. */
function back(visit: Visit, time: number): Visit {
  if (!hasBack(kindOf(visit))) return { ...visit, playedAt: time };
  if (visit.beat > 0 && kindOf(visit) !== 'checks')
    return go(visit, visit.step, visit.beat - 1, time);
  return go({ ...visit, squashed: [] }, Math.max(visit.step - 1, 0), 0, time);
}

/** A pick of choice `n` (a booth or a look), then on. */
function pick(visit: Visit, n: number, time: number): Visit {
  const picked = kindOf(visit) === 'booth' ? { ...visit, booth: n } : { ...visit, look: n };
  return onward(picked, time);
}

/** A squash of bug `n`, then the next beat: Splat! */
function squash(visit: Visit, n: number, time: number): Visit {
  return onward({ ...visit, squashed: [...visit.squashed, n] }, time);
}

/** Whether the "you're on the map" card is still too new to take a tap. */
const guarded = (visit: Visit, time: number) =>
  kindOf(visit) === 'live' && time - visit.at < LIVE_GUARD;

/**
 * What the gold button does, as a tap on it or →, Enter or Space: Surprise
 * me picks from the clock (so it stays the same for the drawing and the
 * tests), Squash! takes the next bug, and anything else goes on.
 */
function act(visit: Visit, time: number): Visit {
  if (guarded(visit, time)) return { ...visit, playedAt: time };
  const kind = kindOf(visit);
  if (kind === 'booth' || kind === 'look') return pick(visit, Math.floor(time / 97) % 3, time);
  if (kind === 'checks' && visit.squashed.length < 3)
    return squash(visit, nextBug(visit.squashed), time);
  return onward(visit, time);
}

/** What a tap at `x`, `y` does, at `time`. */
function tap(visit: Visit, x: number, y: number, time: number): Visit {
  const played = { ...visit, playedAt: time };
  const kind = kindOf(visit);
  if (guarded(visit, time)) return played;
  if (hasBack(kind) && inside(BACK, x, y)) return back(visit, time);
  if (inside(kind === 'live' ? LIVE_NEXT : actionFor(kind), x, y)) return act(visit, time);
  if (kind === 'booth' || kind === 'look') {
    const n = choiceAt(x, y);
    return n >= 0 ? pick(visit, n, time) : played;
  }
  if (kind === 'checks' && visit.squashed.length < 3) {
    const n = bugAt(x, y, time, visit.squashed);
    return n >= 0 ? squash(visit, n, time) : played;
  }
  return inside(kind === 'live' ? END_SCENE : SCENE, x, y) ? onward(visit, time) : played;
}

/** The visit after the keys heard, in order: ← back, →, Enter or Space the gold button. */
function press(visit: Visit, keys: readonly SquareKey[], time: number): Visit {
  let next = visit;
  for (const key of keys) {
    if (key === 'left') next = back(next, time);
    else if (key !== 'up' && key !== 'down') next = act(next, time);
  }
  return next;
}

/** The visit after a frame, and what its taps asked of the page, if anything. */
interface Played {
  visit: Visit;
  ask: SquareAsk | undefined;
}

/** What a tap at `x`, `y` asks of the page at `time`: a nudge, once the big ones are ready to take one. */
function nudgeOf(visit: Visit, x: number, y: number, time: number): SquareAsk | undefined {
  if (guarded(visit, time)) return undefined;
  return nudgeAt(kindOf(visit) === 'live', x, y);
}

/**
 * The visit at `time`, with this frame's keys and its taps at `pointer`'s
 * place over a `size` square played: a tap on a nudge asks the page and
 * moves nothing, any other tap or key plays the journey.
 */
export function advance(
  visit: Visit,
  time: number,
  pointer: SquarePointer | undefined,
  size: number,
  keys: readonly SquareKey[] = [],
): Played {
  const idle = visit.step > 0 && time - visit.playedAt > IDLE_RESET;
  const keyed = press(idle ? newVisit(time) : visit, keys, time);
  if (!pointer || pointer.presses <= 0 || size <= 0) return { visit: keyed, ask: undefined };
  const x = (pointer.x / size) * 100;
  const y = (pointer.y / size) * 100;
  const ask = nudgeOf(keyed, x, y, time);
  if (ask) return { visit: { ...keyed, playedAt: time }, ask };
  return { visit: tap(keyed, x, y, time), ask: undefined };
}
