/**
 * What the pop quiz remembers between frames, its timings, and what can be
 * read off it: the question up, the apples left and the timer. The rules
 * that move it on are in quiz.ts.
 */
import { type Question, roundOf } from './questions';

/** Apples on the desk at the start of a game. */
export const LIVES = 3;
/** How long the chalk timer gives each question, in ms. */
export const LIMIT = 12_000;
/** How long a right answer is cheered before the next question, in ms. */
export const CHEER = 2_600;
/** How long the answer stays up after the timer runs out, in ms. */
export const REVEAL = 2_600;
/** How long the last apple's fall shows before the report card, in ms. */
export const OUT = 1_800;
/** A tap moves on early from a cheer or a reveal once this long has passed, in ms. */
export const SKIP_AFTER = 600;
/** With nobody tapping this long, the game goes back to its demo for the next visitor, in ms. */
export const IDLE_RESET = 45_000;

/** The card picked last on this question, when, and whether it was right. */
interface Pick {
  card: number;
  at: number;
  right: boolean;
}

/**
 * What is happening: the demo plays itself while nobody does; then a
 * question is up, a right answer is cheered, the timer ran out, the last
 * apple fell, or the report card is up.
 */
type Phase = 'attract' | 'asking' | 'right' | 'timeout' | 'out' | 'report';

/** All the attraction remembers, for one visit. */
export interface Quiz {
  phase: Phase;
  /** Which game of the visit this is: each asks the next questions from the bank. */
  round: number;
  /** The question on the board, from 0. */
  step: number;
  /** When the question on the board came up, which the timer runs from. */
  since: number;
  /** When the phase began. */
  at: number;
  /** The cards picked wrong on this question, greyed out. */
  wrong: number[];
  pick: Pick | undefined;
  score: number;
  /** Right answers in a row. */
  streak: number;
  /** The points the last right answer scored. */
  gained: number;
  /** When each apple lost so far fell. */
  lost: number[];
  /** For each question done, whether it was answered right first time. */
  firsts: boolean[];
  /** The best score of the visit, and whether the last game beat the one before. */
  best: number;
  newBest: boolean;
  /** When a person last tapped, or -Infinity while nobody has. */
  playedAt: number;
}

/** The quiz as a visit finds it: the demo playing, waiting for a tap. */
export function newQuiz(time: number): Quiz {
  return {
    phase: 'attract',
    round: 0,
    step: 0,
    since: time,
    at: time,
    wrong: [],
    pick: undefined,
    score: 0,
    streak: 0,
    gained: 0,
    lost: [],
    firsts: [],
    best: 0,
    newBest: false,
    playedAt: -Infinity,
  };
}

/** The question on the board, or undefined between games. */
export function questionOf(quiz: Quiz): Question | undefined {
  return quiz.phase === 'attract' || quiz.phase === 'report'
    ? undefined
    : roundOf(quiz.round).at(quiz.step);
}

/** Apples still on the desk. */
export function livesOf(quiz: Quiz): number {
  return Math.max(LIVES - quiz.lost.length, 0);
}

/** How much of the question's timer is left, 1 to 0, stopped once it is answered. */
export function timeLeft(quiz: Quiz, time: number): number {
  const until = quiz.phase === 'asking' ? time : quiz.pick?.right ? quiz.pick.at : time;
  const left = 1 - (until - quiz.since) / LIMIT;
  return quiz.phase === 'timeout' ? 0 : Math.min(Math.max(left, 0), 1);
}
