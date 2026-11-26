/**
 * What the game remembers of one visit, the only state the attraction keeps
 * between frames: the round's mode, score and best, its hype, the questions in
 * the air, and the few cheers, words and badge it's showing. The rules that
 * move it on are in `game.ts`.
 */
import type { Cheer } from './crowd';
import type { Question } from './questions';

/** The demo with nobody playing, a round being played, or its end: won or lost. */
export type Mode = 'demo' | 'play' | 'won' | 'lost';
/** The badge handed to the visitor: on starting, or gold for a standing ovation. */
export type BadgeKind = 'attendee' | 'superfan';

/** A word that floats up from a tap: the points, or what went wrong. */
export interface Pop {
  x: number;
  y: number;
  text: string;
  good: boolean;
  at: number;
}

/** Everything the game remembers of one visit. */
export interface Game {
  mode: Mode;
  /** The `time` of the last frame. */
  last: number;
  /** Seeds which questions come, so each round differs. */
  seed: number;
  endedAt: number;
  score: number;
  best: number;
  /** The hype as it stood at `hypeAt`; it ebbs from there. */
  hype: number;
  hypeAt: number;
  /** Good questions answered this round. */
  answered: number;
  /** When the speaker now on came on, so the hall claps them in. */
  talkAt: number;
  up: Question[];
  asked: number;
  nextAt: number;
  cheers: Cheer[];
  pops: Pop[];
  badge: { kind: BadgeKind; at: number } | null;
  /** Whether a tap just landed on a tickets button, until the page is asked to open them. */
  asking: boolean;
}

/** The hype a round starts with. */
export const START_HYPE = 60;
/** The most hype the meter holds. */
export const HYPE_MAX = 100;
/** How much hype ebbs away each millisecond. */
const EBB = 0.003;
/** The hype a good question passed the mic adds. */
export const GOOD_HYPE = 12;
/** The hype an off-topic question passed the mic takes away. */
export const STRAY_HYPE = 15;
/** The hype a good question left waiting takes away. */
export const MISS_HYPE = 16;
/** How long the demo waits before it passes the mic to a good question. */
export const DEMO_ANSWERS = 1_400;
/** How long the demo leaves between questions. */
export const DEMO_GAP = 1_600;
/** How long after a round ends before a tap plays again, so a late tap doesn't skip the card. */
export const RESTART_AFTER = 1_200;
/** How long the badge hangs in view before it's put away. */
export const BADGE_FOR = 4_500;
/** How long the end card stays with nobody tapping before the demo comes back. */
export const BACK_TO_DEMO = 15_000;

/** The demo, as it starts a visit or comes back to one, keeping the best score. */
export function newGame(time: number, best = 0): Game {
  return {
    mode: 'demo',
    last: time,
    seed: 1,
    endedAt: -Infinity,
    score: 0,
    best,
    hype: START_HYPE,
    hypeAt: time,
    answered: 0,
    talkAt: -Infinity,
    up: [],
    asked: 0,
    nextAt: time + 400,
    cheers: [],
    pops: [],
    badge: null,
    asking: false,
  };
}

/** The hype at `time`, ebbing since it was last set. */
export function hypeAt(game: Game, time: number): number {
  if (game.mode !== 'play') return game.hype;
  return Math.max(0, Math.min(HYPE_MAX, game.hype - (time - game.hypeAt) * EBB));
}
