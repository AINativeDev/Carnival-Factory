/**
 * Keep the room buzzing: the game's rules. Questions pop up round the hall;
 * tap the ones about building with AI to pass their asker the mic before they
 * give up, and leave the off-topic ones be. A good question scores, faster
 * scores more, and fills the hype meter; a missed one or an off-topic one
 * drains it, and it ebbs on its own. Every five good questions the next
 * speaker comes on; answer the whole keynote for a standing ovation, or let
 * the hype run out and the room goes quiet. Then a tap plays again. With
 * nobody playing, a demo passes the mic on its own and scores nothing. The
 * attraction keeps one `Game` between frames, and `advance` moves it on from
 * `time`. Everything is in the attraction's 0 to 100 units.
 */
import type { SquarePointer } from '../../../src/northpole/square';
import { ticketsAt } from './buttons';
import { KEYNOTE, PER_TALK, talkAfter } from './program';
import { ask, bubbleOf, gapAfter, type Question, questionAt, roomFor, waitLeft } from './questions';
import {
  BACK_TO_DEMO,
  DEMO_ANSWERS,
  DEMO_GAP,
  type Game,
  GOOD_HYPE,
  HYPE_MAX,
  hypeAt,
  MISS_HYPE,
  newGame,
  type Pop,
  RESTART_AFTER,
  STRAY_HYPE,
} from './state';

/** A new round, started by a tap at `time`. */
function start(game: Game, time: number): Game {
  const badge = game.badge ?? { kind: 'attendee' as const, at: time };
  const fresh = newGame(time, game.best);
  return { ...fresh, mode: 'play', seed: time % 997, talkAt: time, badge, asking: game.asking };
}

/** The round over at `time`: won to a standing ovation, or lost to a quiet room. */
function end(game: Game, time: number, won: boolean): Game {
  const best = Math.max(game.best, game.score);
  const badge = won ? { kind: 'superfan' as const, at: time } : game.badge;
  return { ...game, mode: won ? 'won' : 'lost', endedAt: time, best, up: [], badge };
}

/** The game with its hype changed by `by` at `time`, ending the round if it ran out. */
function shift(game: Game, by: number, time: number): Game {
  const hype = Math.max(0, Math.min(HYPE_MAX, hypeAt(game, time) + by));
  const next = { ...game, hype, hypeAt: time };
  return next.mode === 'play' && hype <= 0 ? end(next, time, false) : next;
}

const popAt = (q: Question, text: string, good: boolean, at: number): Pop => {
  const box = bubbleOf(q);
  return { x: box.x + box.w / 2, y: box.y, text, good, at };
};

/** The game once good question `q` got the mic at `time`. */
function answer(game: Game, q: Question, time: number): Game {
  const playing = game.mode === 'play';
  const points = 10 + Math.round(10 * waitLeft(q, time)) + 2 * talkAfter(game.answered);
  let answered = game.answered + 1;
  const talkAt = answered % PER_TALK === 0 ? time : game.talkAt;
  if (!playing && answered >= KEYNOTE) answered = 0;
  let next: Game = {
    ...game,
    up: game.up.filter((other) => other.id !== q.id),
    answered,
    talkAt,
    score: playing ? game.score + points : 0,
    cheers: [...game.cheers.slice(-5), { seat: q.seat, at: time }],
    pops: [
      ...game.pops.slice(-5),
      popAt(q, playing ? `+${String(points)}` : 'Great question!', true, time),
    ],
  };
  if (playing) next = shift(next, GOOD_HYPE, time);
  return playing && answered >= KEYNOTE && next.mode === 'play' ? end(next, time, true) : next;
}

/** The game with the questions that gave up by `time` gone: a good one missed drains the hype. */
function expire(game: Game, time: number): Game {
  let next = game;
  for (const q of game.up) {
    const gone = q.born + q.life;
    if (gone > time || next.mode === 'won' || next.mode === 'lost') continue;
    next = { ...next, up: next.up.filter((other) => other.id !== q.id) };
    if (next.mode === 'play' && q.good) {
      next = { ...next, pops: [...next.pops.slice(-5), popAt(q, 'Missed!', false, gone)] };
      next = shift(next, -MISS_HYPE, gone);
    }
  }
  return next;
}

/** The game with the demo's answers given by `time`. */
function demoAnswers(game: Game, time: number): Game {
  if (game.mode !== 'demo') return game;
  let next = game;
  for (const q of game.up) {
    if (q.good && q.born + DEMO_ANSWERS <= time) next = answer(next, q, q.born + DEMO_ANSWERS);
  }
  return next;
}

/** The game with every question asked, answered by the demo or given up, up to `time`. */
function run(game: Game, time: number): Game {
  let next = game;
  while (next.nextAt <= time && (next.mode === 'play' || next.mode === 'demo')) {
    const at = next.nextAt;
    next = demoAnswers(expire(next, at), at);
    const demo = next.mode === 'demo';
    const room = demo ? 3 : roomFor(next.answered);
    const busy = next.cheers.filter((c) => at - c.at < 1_500).map((c) => c.seat);
    const q =
      next.up.length < room
        ? ask(next.asked, next.seed, at, demo ? 0 : next.answered, next.up, busy)
        : undefined;
    next = {
      ...next,
      up: q ? [...next.up, q] : next.up,
      asked: next.asked + 1,
      nextAt: at + (demo ? DEMO_GAP : gapAfter(next.answered)),
    };
  }
  next = demoAnswers(expire(next, time), time);
  return next.mode === 'play' && hypeAt(next, time) <= 0 ? end(next, time, false) : next;
}

/** The game after a tap at `x`, `y` at `time`. */
export function tap(game: Game, x: number, y: number, time: number): Game {
  if (ticketsAt(game.mode, x, y)) return { ...game, asking: true };
  if (game.mode === 'demo') return start(game, time);
  if (game.mode !== 'play') return time - game.endedAt >= RESTART_AFTER ? start(game, time) : game;
  const q = questionAt(game.up, x, y);
  if (!q) return game;
  if (q.good) return answer(game, q, time);
  const next = {
    ...game,
    up: game.up.filter((other) => other.id !== q.id),
    pops: [...game.pops.slice(-5), popAt(q, 'Off topic!', false, time)],
  };
  return shift(next, -STRAY_HYPE, time);
}

/** The game one frame on, at `time`, with the pointer as it is now over a `size` square. */
export function advance(
  game: Game,
  time: number,
  pointer: SquarePointer | undefined,
  size: number,
): Game {
  if (time < game.last) return newGame(time, game.best);
  const ended = game.mode === 'won' || game.mode === 'lost';
  if (ended && time - game.endedAt > BACK_TO_DEMO) return newGame(time, game.best);
  let next = run({ ...game, last: time }, time);
  const presses = pointer ? pointer.presses : 0;
  for (let k = 0; k < presses && pointer; k++) {
    next = tap(next, (pointer.x / size) * 100, (pointer.y / size) * 100, time);
  }
  return next;
}
