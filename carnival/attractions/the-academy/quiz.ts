/**
 * The pop quiz's rules. A tap starts a game: ROUND questions, each against a
 * chalk timer, three apples for lives. A right answer scores points for
 * speed, multiplied by the streak; a wrong one costs an apple and shows a
 * hint, and the question stays up; running out of time costs an apple and
 * shows the answer. The report card ends the game, early if the apples run
 * out, with the score, the best of the visit and a card to play again.
 * The attraction keeps one `Quiz` (state.ts) between frames, the only state
 * it has, and `advance` moves it on from `time` and the taps since the last frame.
 */
import type { SquarePointer } from '../../../src/northpole/square';
import { academyAt, AGAIN, cardAt, inside } from './layout';
import { ROUND } from './questions';
import { pointsFor } from './score';
import {
  CHEER,
  IDLE_RESET,
  LIMIT,
  livesOf,
  newQuiz,
  OUT,
  questionOf,
  type Quiz,
  REVEAL,
  SKIP_AFTER,
  timeLeft,
} from './state';

/** A new game, the first question up and every apple back on the desk. */
function start(quiz: Quiz, time: number): Quiz {
  return {
    ...newQuiz(time),
    phase: 'asking',
    round: quiz.phase === 'attract' ? quiz.round : quiz.round + 1,
    best: quiz.best,
    playedAt: time,
  };
}

/** The report card, with the best score of the visit brought up to date. */
function report(quiz: Quiz, time: number): Quiz {
  const newBest = quiz.score > quiz.best;
  return { ...quiz, phase: 'report', at: time, best: Math.max(quiz.best, quiz.score), newBest };
}

/** The next question, or the report card after the last or once the apples are gone. */
function next(quiz: Quiz, time: number): Quiz {
  if (quiz.step + 1 >= ROUND || livesOf(quiz) === 0) return report(quiz, time);
  const step = quiz.step + 1;
  return { ...quiz, phase: 'asking', step, since: time, at: time, wrong: [], pick: undefined };
}

/** Picks card `card`: right scores and cheers, wrong costs an apple and shows the hint. */
function answer(quiz: Quiz, card: number, time: number): Quiz {
  const question = questionOf(quiz);
  if (!question || card < 0 || quiz.wrong.includes(card)) return quiz;
  if (card === question.right) {
    const streak = quiz.streak + 1;
    const gained = pointsFor(timeLeft(quiz, time), streak);
    const firsts = [...quiz.firsts, quiz.wrong.length === 0];
    const pick = { card, at: time, right: true };
    return {
      ...quiz,
      phase: 'right',
      at: time,
      streak,
      gained,
      score: quiz.score + gained,
      firsts,
      pick,
    };
  }
  const missed = { ...quiz, streak: 0, wrong: [...quiz.wrong, card], lost: [...quiz.lost, time] };
  const pick = { card, at: time, right: false };
  if (livesOf(missed) > 0) return { ...missed, pick };
  return { ...missed, phase: 'out', at: time, pick, firsts: [...quiz.firsts, false] };
}

/** The timer ran out: an apple falls, the streak ends, and the answer shows. */
function timeout(quiz: Quiz, time: number): Quiz {
  const firsts = [...quiz.firsts, false];
  return { ...quiz, phase: 'timeout', at: time, streak: 0, lost: [...quiz.lost, time], firsts };
}

/** What a tap at `x`, `y` does, whatever is up. */
function tap(quiz: Quiz, x: number, y: number, time: number): Quiz {
  const played = { ...quiz, playedAt: time };
  const waited = time - quiz.at > SKIP_AFTER;
  switch (quiz.phase) {
    case 'attract':
      return start(quiz, time);
    case 'asking':
      return answer(played, cardAt(x, y), time);
    case 'right':
    case 'timeout':
      return waited ? next(played, time) : played;
    case 'report':
      return time - quiz.at > CARDS_UP && inside(AGAIN, x, y) ? start(quiz, time) : played;
    case 'out':
      return played;
  }
}

/** The quiz moved on by the clock alone: timers run out and cheers end. */
function tick(quiz: Quiz, time: number): Quiz {
  if (quiz.phase !== 'attract' && time - quiz.playedAt > IDLE_RESET) {
    return { ...newQuiz(time), round: quiz.round + 1, best: quiz.best };
  }
  const since = time - quiz.at;
  if (quiz.phase === 'asking' && time - quiz.since >= LIMIT)
    return timeout(quiz, quiz.since + LIMIT);
  if (quiz.phase === 'right' && since >= CHEER) return next(quiz, time);
  if (quiz.phase === 'timeout' && since >= REVEAL) return next(quiz, time);
  if (quiz.phase === 'out' && since >= OUT) return report(quiz, time);
  return quiz;
}

/** How long into the report card its cards are up and can be tapped, in ms. */
export const CARDS_UP = 2_100;

/**
 * Whether this frame's taps at `pointer`'s place over a `size` square hit a
 * way out to the real Academy: the sign, or the report card's gold card once it is up.
 */
export function opensAcademy(
  quiz: Quiz,
  pointer: SquarePointer | undefined,
  size: number,
  time: number,
): boolean {
  if (!pointer || pointer.presses <= 0 || size <= 0) return false;
  const report = quiz.phase === 'report';
  if (report && time - quiz.at < CARDS_UP) return false;
  return academyAt(report, (pointer.x / size) * 100, (pointer.y / size) * 100);
}

/**
 * The quiz at `time`, with this frame's taps at `pointer`'s place over a
 * `size` square played, unless they went to the real Academy instead.
 */
export function advance(
  quiz: Quiz,
  time: number,
  pointer: SquarePointer | undefined,
  size: number,
): Quiz {
  const state = tick(quiz, time);
  if (!pointer || pointer.presses <= 0 || size <= 0) return state;
  if (opensAcademy(state, pointer, size, time)) return { ...state, playedAt: time };
  return tap(state, (pointer.x / size) * 100, (pointer.y / size) * 100, time);
}
