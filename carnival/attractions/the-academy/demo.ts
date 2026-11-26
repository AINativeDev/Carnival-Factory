/**
 * What the classroom shows: the game as it stands, or, while nobody plays,
 * the demo, which plays itself gently on a loop from `time` alone. The demo
 * asks a question of its own, so it never gives away a real answer: the
 * owl points at each card in turn, the timer runs, and then the right card
 * is picked and cheered, before it starts again.
 */
import type { SquarePointer } from '../../../src/northpole/square';
import { cardAt } from './layout';
import type { Question } from './questions';
import { pointsFor } from './score';
import { LIMIT, questionOf, type Quiz } from './state';

/** The demo's own question, which invites the visitor to play. */
export const DEMO: Question = {
  ask: 'Ready for a pop quiz on building with AI agents?',
  answers: ['Not yet', 'Yes, let’s go!', 'Maybe later'],
  right: 1,
  hint: '',
  why: 'Tap any card to play!',
};

/** One loop of the demo, in ms. */
export const DEMO_LOOP = 9_000;
/** When in each loop the demo picks the right card, in ms. */
export const DEMO_PICK = 5_200;
/** How long the owl points at each card in the demo, in ms. */
export const POINT_EVERY = 1_300;

/** What the drawing shows: a quiz, its question, the card lit up, and whether it is the demo. */
export interface Shown {
  quiz: Quiz;
  question: Question | undefined;
  /** The card the pointer is over, or the owl points at in the demo; -1 for none. */
  lit: number;
  demo: boolean;
}

/** The demo's quiz at `time`: asking until DEMO_PICK into each loop, then the right card cheered. */
function demoQuiz(quiz: Quiz, time: number): { quiz: Quiz; lit: number } {
  const into = (((time - quiz.at) % DEMO_LOOP) + DEMO_LOOP) % DEMO_LOOP;
  const since = time - into;
  if (into < DEMO_PICK) {
    const lit = Math.floor(into / POINT_EVERY) % 3;
    return { quiz: { ...quiz, phase: 'asking', since, pick: undefined, score: 0, streak: 0 }, lit };
  }
  const at = since + DEMO_PICK;
  const gained = pointsFor(1 - DEMO_PICK / LIMIT, 1);
  const pick = { card: DEMO.right, at, right: true };
  return {
    quiz: { ...quiz, phase: 'right', since, at, pick, gained, score: gained, streak: 1 },
    lit: -1,
  };
}

/** What to draw at `time`, with the pointer over a `size` square, if it is. */
export function shownOf(
  quiz: Quiz,
  time: number,
  pointer: SquarePointer | undefined,
  size: number,
): Shown {
  if (quiz.phase === 'attract') return { ...demoQuiz(quiz, time), question: DEMO, demo: true };
  const over =
    pointer && size > 0 && quiz.phase === 'asking'
      ? cardAt((pointer.x / size) * 100, (pointer.y / size) * 100)
      : -1;
  const lit = quiz.wrong.includes(over) ? -1 : over;
  return { quiz, question: questionOf(quiz), lit, demo: false };
}
