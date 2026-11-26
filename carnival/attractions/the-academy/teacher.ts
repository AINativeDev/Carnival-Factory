/**
 * What the owl teacher does and says at each moment of the game: points at
 * the card lit up (or the question), cheers a right answer, ponders a wrong
 * one or the timer running out, and graduates on the report card.
 */
import type { Shown } from './demo';
import { BOARD, CARDS } from './layout';
import type { Pose } from './owl';
import { multiplierOf } from './score';
import { timeLeft } from './state';

/** The owl's pose, how long it has held it, where its stick points, and its words, if any. */
export interface Teacher {
  pose: Pose;
  since: number;
  target: { x: number; y: number };
  says: string;
}

/** The middle of the question on the board, where the owl points when no card is lit. */
const QUESTION = { x: BOARD.x + 14, y: BOARD.y + 21 };

/** The teacher at `time`, for what is shown. */
export function teacherOf({ quiz, lit, demo }: Shown, time: number): Teacher {
  const since = time - quiz.at;
  const target = QUESTION;
  switch (quiz.phase) {
    case 'report':
      return { pose: 'graduate', since, target, says: 'Well done!' };
    case 'right': {
      const pickedAt = quiz.pick?.at ?? quiz.at;
      const says = multiplierOf(quiz.streak) >= 3 ? 'On fire!' : 'Hoo-ray!';
      return { pose: 'cheer', since: time - pickedAt, target, says };
    }
    case 'timeout':
      return { pose: 'ponder', since, target, says: 'Time’s up!' };
    case 'out':
      return { pose: 'ponder', since, target, says: 'Oh no!' };
    case 'attract':
    case 'asking':
      break;
  }
  const missedFor = quiz.pick ? time - quiz.pick.at : Infinity;
  if (missedFor < 1_600) return { pose: 'ponder', since: missedFor, target, says: 'Not quite!' };
  const card = lit >= 0 ? CARDS.at(lit) : undefined;
  const pointAt = card ? { x: card.x + card.w / 2, y: card.y } : target;
  const hurry = !demo && timeLeft(quiz, time) < 0.3;
  const says = demo ? 'Pop quiz!' : hurry ? 'Hurry!' : '';
  return { pose: 'point', since, target: pointAt, says };
}
