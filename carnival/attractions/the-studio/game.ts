/**
 * The studio's game: record an episode by saying each word as it reaches the
 * ring by the mic. A tap on the beat is perfect or good, a long word is held
 * until it ends, and a word let past is missed. Misses drain the ON AIR signal,
 * and at nothing the episode is lost; say every word and it's recorded, played
 * back, scored, and the next episode is quicker. With nobody playing, the host
 * records a demo episode, perfectly, on a loop.
 *
 * The attraction keeps one `Studio` between frames, the only state it has, and
 * `advance` moves it on from `time`.
 */
import type { SquarePointer } from '../../../src/northpole/square';
import { buttonsFor, linkAt } from './buttons';
import { chart, ending, GOOD, PERFECT, type Beat } from './chart';

/** How long the recorded episode plays back, in ms. */
export const LISTEN = 5_500;
/** How long the host's demo wrap-up stays before the next demo episode. */
export const DEMO_WRAP = 4_500;
/** How long a visitor's wrap-up waits for a tap before the host takes over again. */
export const IDLE = 25_000;
/** The ON AIR signal an episode starts with, from 0 to 1. */
export const SIGNAL = 0.7;

export type Judge = 'perfect' | 'good' | 'miss';
export type Phase = 'record' | 'listen' | 'wrap';

/** How a word went: perfect, good or missed, when, and how much of a long word was held. */
export interface Hit {
  judge: Judge;
  at: number;
  held: number;
}

/** One episode being recorded, or played back. */
export interface Game {
  start: number;
  episode: number;
  beats: Beat[];
  visitor: boolean;
  hits: (Hit | null)[];
  /** The long word being held now, by its place on the chart. */
  holding: number | null;
  score: number;
  combo: number;
  signal: number;
  /** When the recording stopped, all said or signal lost. */
  ended: number | null;
  lost: boolean;
}

/** All the studio remembers, for one visit. */
export interface Studio {
  game: Game;
  best: number;
  cheer: number;
  /** The link a tap on a button asked to open, until the page is told. */
  open: number | null;
}

/** What a word earns before the combo: a perfect one twice a good one. */
const points = (judge: Judge) => (judge === 'perfect' ? 100 : judge === 'good' ? 50 : 0);
/** How much a word moves the ON AIR signal. */
const sway = (judge: Judge) => (judge === 'perfect' ? 0.07 : judge === 'good' ? 0.03 : -0.2);

/** The combo's multiplier: one more for every four words in a row, up to four times. */
export const multiplier = (combo: number) => 1 + Math.min(3, Math.floor(combo / 4));

/** A fresh episode `episode` from `time`, played by a visitor or by the host. */
export function newGame(time: number, episode: number, visitor: boolean): Game {
  const beats = chart(episode);
  return {
    ...{ start: time, episode, beats, visitor, hits: beats.map(() => null), holding: null },
    ...{ score: 0, combo: 0, signal: SIGNAL, ended: null, lost: false },
  };
}

/** The studio at the start of a visit: the host recording a demo episode. */
export function newStudio(time: number): Studio {
  return { game: newGame(time, 1, false), best: 0, cheer: -Infinity, open: null };
}

/** Which part of its episode `time` is in: recording, playing back, or the wrap-up. */
export function phaseOf(game: Game, time: number): Phase {
  if (game.ended === null) return 'record';
  return time - game.ended < LISTEN ? 'listen' : 'wrap';
}

/** Marks word `n` as `judge` at `time`, scoring it and moving the combo and the signal. */
function judge(game: Game, n: number, verdict: Judge, time: number) {
  game.hits[n] = { judge: verdict, at: time, held: 0 };
  game.combo = verdict === 'miss' ? 0 : game.combo + 1;
  game.score += points(verdict) * multiplier(game.combo);
  game.signal = Math.min(1, Math.max(0, game.signal + sway(verdict)));
  if (verdict !== 'miss' && (game.beats.at(n)?.hold ?? 0) > 0) game.holding = n;
}

/** A tap at `time`: says the next word if it's within reach of its beat. */
export function tap(game: Game, time: number) {
  const n = game.hits.indexOf(null);
  const beat = n < 0 ? undefined : game.beats.at(n);
  if (!beat) return;
  const off = Math.abs(time - game.start - beat.at);
  if (off <= GOOD) judge(game, n, off <= PERFECT ? 'perfect' : 'good', time);
}

/** Lets go of a long word at `time`: it earns as much as was held. */
function letGo(game: Game, time: number) {
  const n = game.holding;
  const hit = n === null ? undefined : game.hits.at(n);
  const beat = n === null ? undefined : game.beats.at(n);
  game.holding = null;
  if (!hit || !beat) return;
  hit.held = Math.min(1, Math.max(0, (time - game.start - beat.at) / beat.hold));
  game.score += Math.round(hit.held * 100);
}

/**
 * Moves the recording on to `time`: words let past are missed, a long word is
 * let go when `down` stops or it ends, and the recording stops once every word
 * is said, or when the signal is lost.
 */
export function settle(game: Game, time: number, down: boolean) {
  if (game.ended !== null) return;
  const into = time - game.start;
  game.beats.forEach((beat, n) => {
    if (game.hits[n] === null && into > beat.at + GOOD) judge(game, n, 'miss', time);
  });
  const held = game.holding === null ? undefined : game.beats.at(game.holding);
  if (held && (!down || into >= held.at + held.hold)) letGo(game, time);
  if (game.signal <= 0) game.lost = true;
  if (game.lost || into >= ending(game.beats)) {
    if (game.holding !== null) letGo(game, time);
    game.ended = time;
  }
}

/** The host's demo: every word said right on its beat, and every long word held to its end. */
function autoplay(game: Game, time: number) {
  game.beats.forEach((beat, n) => {
    if (game.hits[n] === null && time - game.start >= beat.at) judge(game, n, 'perfect', time);
  });
}

/**
 * Moves the studio on to `time`, with what the pointer did since the last
 * frame, over a square `size` across. A tap on a button asks for its link
 * instead of playing.
 */
export function advance(
  studio: Studio,
  time: number,
  pointer: SquarePointer | undefined,
  size: number,
): Studio {
  let { game, best, cheer, open } = studio;
  const phase = phaseOf(game, time);
  const since = game.ended === null ? 0 : time - game.ended;
  if (!game.visitor && phase === 'wrap' && since >= LISTEN + DEMO_WRAP)
    game = newGame(time, 1, false);
  if (game.visitor && phase === 'wrap' && since >= LISTEN + IDLE) game = newGame(time, 1, false);
  let presses = pointer?.presses ?? 0;
  if (pointer && presses > 0) {
    const link = linkAt(
      buttonsFor(phaseOf(game, time)),
      (pointer.x * 100) / size,
      (pointer.y * 100) / size,
    );
    if (link !== null) [open, presses] = [link, 0];
  }
  if (presses > 0) {
    if (!game.visitor) game = newGame(time, 1, true);
    else if (phase === 'listen') cheer = time;
    else if (phase === 'wrap') game = newGame(time, game.lost ? 1 : game.episode + 1, true);
    else for (let n = 0; n < presses; n++) tap(game, time);
  }
  if (!game.visitor) autoplay(game, time);
  const wasRecording = game.ended === null;
  settle(game, time, !game.visitor || (pointer?.down ?? false));
  if (wasRecording && game.ended !== null && game.visitor) best = Math.max(best, game.score);
  return { game, best, cheer, open };
}
