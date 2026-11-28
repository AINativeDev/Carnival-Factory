/**
 * The Factory's game, Feed the Loop: a parcel rides the build loop from
 * station to station, request, build, review and merge, and each station asks
 * for a skill as the parcel heads for it. Tap that skill's card before the
 * parcel gets there and it passes and scores, the quicker the more; tap the
 * wrong one, or none, and the belt jams and costs one of three lives. Every
 * parcel through merge ships a booth, and every third one speeds the loop up.
 * The third jam ends the round, and the show (show.ts) puts up its end card.
 * With nobody playing, a demo feeds the loop itself and never jams. Everything
 * is in the drawing's 0 to 100 units, and `advance` moves the one `Game` on.
 */
import type { SquarePointer } from '../../../src/northpole/square';
import { cardAt, needFor, type Pop, stepPops } from './rules';

/** Lives in a round: how many jams end it. */
export const LIVES = 3;
/** How long a jam halts the belt, in ms. */
export const JAM = 1_100;
/** The demo answers each station this far through its leg. */
export const DEMO_ANSWERS = 0.55;
/** Points for shipping a booth through merge, times the level. */
export const SHIP_POINTS = 25;

/** All the attraction remembers, for one visit. */
export interface Game {
  /** The `time` of the last frame. */
  last: number;
  /** Whether a demo plays, a person plays, or a person's round has ended. */
  mode: 'demo' | 'play' | 'over';
  /** The station the parcel heads for: 0 request, 1 build, 2 review, 3 merge. */
  leg: number;
  /** How far into this leg the parcel has ridden, in ms. */
  ridden: number;
  /** The skill the station ahead asks for, and what the tap on it came to. */
  need: number;
  answer: 'none' | 'right' | 'wrong';
  /** How many legs have started, so each asks for its own skill. */
  count: number;
  /** The belt stands still until this `time`. */
  jamUntil: number;
  score: number;
  best: number;
  lives: number;
  /** Booths shipped this round, and when the latest left merge. */
  shipped: number;
  gifts: number[];
  /** When the round ended. */
  overAt: number;
  /** Floating words and sparkles from the latest taps and stations. */
  pops: Pop[];
}

/** A fresh round in `mode` at `time`: the parcel heading for request, three lives. */
export function newGame(time: number, mode: Game['mode'] = 'demo', best = 0): Game {
  return {
    last: time,
    mode,
    leg: 0,
    ridden: 0,
    need: needFor(0),
    answer: 'none',
    count: 0,
    jamUntil: -Infinity,
    score: 0,
    best,
    lives: LIVES,
    shipped: 0,
    gifts: [],
    overAt: -Infinity,
    pops: [],
  };
}

/** The level of a round that has shipped `shipped` booths: one more every three. */
export const levelOf = (shipped: number) => 1 + Math.floor(shipped / 3);

/** How long a leg takes at `level`, in ms: brisk from the start, quicker each level, never frantic. */
export function legTime(level: number): number {
  return Math.max(900, Math.round(2_700 * 0.84 ** (level - 1)));
}

/** How long a leg of `game` takes: the demo keeps to the first level's pace. */
export const legOf = (game: Game) =>
  game.mode === 'play' ? legTime(levelOf(game.shipped)) : 2_700;

/** How far through its leg the parcel is, from 0 to 1. */
export const progressOf = (game: Game) => Math.min(1, game.ridden / legOf(game));

/** The belt jammed at `time`: it halts, and in a round costs a life, ending it on the last. */
function jam(game: Game, time: number): Game {
  const lives = game.mode === 'play' ? game.lives - 1 : game.lives;
  const best = Math.max(game.best, game.score);
  const over = lives <= 0;
  return {
    ...game,
    lives,
    best,
    jamUntil: time + JAM,
    mode: over ? 'over' : game.mode,
    overAt: over ? time : game.overAt,
    pops: stepPops(game.pops, { kind: 'jam', at: time, leg: game.leg, points: 0 }),
  };
}

/** The station's skill answered with `skill` at `time`: points for the right one, quicker for more, or a jam. */
export function answer(game: Game, skill: number, time: number): Game {
  if (game.answer !== 'none') return game;
  if (skill !== game.need) return jam({ ...game, answer: 'wrong' }, time);
  const level = levelOf(game.shipped);
  const points = game.mode === 'play' ? (10 + Math.round(10 * (1 - progressOf(game)))) * level : 0;
  const pops = stepPops(game.pops, { kind: 'right', at: time, leg: game.leg, points });
  return { ...game, answer: 'right', score: game.score + points, pops };
}

/** The parcel at its station at `time`: through if answered, else a jam; through merge, answered, it ships. */
function arrive(game: Game, time: number): Game {
  let next = game.answer === 'none' ? jam(game, time) : game;
  // A booth ships only when merge got its skill: a jam at merge scraps it.
  if (game.leg === 3 && game.answer === 'right') {
    const points = next.mode === 'play' ? SHIP_POINTS * levelOf(game.shipped) : 0;
    next = {
      ...next,
      shipped: next.shipped + 1,
      score: next.score + points,
      gifts: [...next.gifts, time].slice(-4),
      pops: stepPops(next.pops, { kind: 'ship', at: time, leg: 3, points }),
    };
  }
  const count = next.count + 1;
  return {
    ...next,
    leg: (game.leg + 1) % 4,
    ridden: 0,
    count,
    need: needFor(count),
    answer: 'none',
  };
}

/** The belt run on from the last frame to `time`: the parcel rides unless jammed, the demo answers, and stations are reached. */
function ride(game: Game, time: number): Game {
  // An ended round keeps its numbers for the end card: the belt stands still.
  if (game.mode === 'over') return { ...game, last: time };
  // A hidden page sends no frames, so a long gap rides on as a short one.
  const moving = Math.min(100, Math.max(0, time - Math.max(game.last, game.jamUntil)));
  let next: Game = { ...game, last: time, ridden: game.ridden + moving };
  if (next.mode !== 'play' && next.answer === 'none' && progressOf(next) >= DEMO_ANSWERS) {
    next = answer(next, next.need, time);
  }
  return next.ridden >= legOf(next) ? arrive(next, time) : next;
}

/** One tap at `x`, `y`: a card answers the station, any tap on the demo starts a round, and an ended round takes none. */
function tap(game: Game, x: number, y: number, time: number): Game {
  const marked = { ...game, pops: stepPops(game.pops, { kind: 'tap', at: time, x, y, points: 0 }) };
  if (game.mode === 'demo') return { ...newGame(time, 'play', game.best), pops: marked.pops };
  if (game.mode === 'over') return marked;
  const card = cardAt(x, y);
  return card < 0 ? marked : answer(marked, card, time);
}

/**
 * The game one frame on, at `time`, with the pointer as it is now in a `size`
 * square: the belt run on, then each press a tap.
 */
export function advance(
  game: Game,
  time: number,
  pointer: SquarePointer | undefined,
  size: number,
): Game {
  if (time < game.last) return newGame(time);
  let next = ride(game, time);
  const presses = pointer ? pointer.presses : 0;
  for (let k = 0; k < presses && pointer; k++) {
    next = tap(next, (pointer.x / size) * 100, (pointer.y / size) * 100, time);
  }
  return next;
}
