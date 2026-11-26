import { describe, expect, it } from 'vitest';
import { AGAIN, CARDS, SIGN } from './layout';
import { ROUND, roundOf } from './questions';
import { advance, CARDS_UP, opensAcademy } from './quiz';
import { pointsFor } from './score';
import {
  CHEER,
  IDLE_RESET,
  LIMIT,
  LIVES,
  livesOf,
  newQuiz,
  OUT,
  questionOf,
  type Quiz,
  REVEAL,
  SKIP_AFTER,
  timeLeft,
} from './state';

const SIZE = 500;

/** A tap at `x`, `y` in the square's 0 to 100 units. */
const tapAt = (x: number, y: number) => ({
  x: (x / 100) * SIZE,
  y: (y / 100) * SIZE,
  down: true,
  presses: 1,
});
const middleOf = (box: { x: number; y: number; w: number; h: number }) =>
  tapAt(box.x + box.w / 2, box.y + box.h / 2);
const card = (n: number) => middleOf(CARDS[n] ?? { x: 0, y: 0, w: 0, h: 0 });

/** Taps card `n` of `quiz` at `time`. */
const pick = (quiz: Quiz, n: number, time: number) => advance(quiz, time, card(n), SIZE);
/** The right card for the question up. */
const rightOf = (quiz: Quiz) => questionOf(quiz)?.right ?? 0;
const wrongOf = (quiz: Quiz, skip: readonly number[] = []) =>
  [0, 1, 2].find((n) => n !== rightOf(quiz) && !skip.includes(n)) ?? 0;

/** A game just started at time 0. */
const started = () => pick(newQuiz(0), 1, 0);

describe('starting a game', () => {
  it('waits in the demo until a tap, which starts the first question without answering it', () => {
    const idle = advance(newQuiz(0), 60_000, undefined, SIZE);
    expect(idle.phase).toBe('attract');
    expect(questionOf(idle)).toBeUndefined();
    const game = pick(idle, 1, 60_000);
    expect(game).toMatchObject({ phase: 'asking', step: 0, since: 60_000, wrong: [], score: 0 });
    expect(questionOf(game)).toEqual(roundOf(0)[0]);
    expect(livesOf(game)).toBe(LIVES);
  });

  it('ignores a pointer that only hovers, or an empty square', () => {
    const quiz = newQuiz(0);
    expect(advance(quiz, 10, { ...card(0), presses: 0 }, SIZE)).toBe(quiz);
    expect(advance(quiz, 10, card(0), 0)).toBe(quiz);
  });
});

describe('answering', () => {
  it('scores a fast right answer more, times the streak, and cheers it', () => {
    const game = started();
    const right = pick(game, rightOf(game), 1_000);
    expect(right.phase).toBe('right');
    expect(right.gained).toBe(pointsFor(1 - 1_000 / LIMIT, 1));
    expect(right.firsts).toEqual([true]);
    const next = advance(right, 1_000 + CHEER, undefined, SIZE);
    expect(next).toMatchObject({ phase: 'asking', step: 1, since: 1_000 + CHEER });
    const again = pick(next, rightOf(next), 1_000 + CHEER);
    expect(again.streak).toBe(2);
    expect(again.gained).toBe(pointsFor(1, 2));
    expect(again.score).toBe(right.gained + again.gained);
  });

  it('costs an apple and the streak for a wrong card, which greys out and can’t be picked twice', () => {
    const game = { ...started(), streak: 3 };
    const wrong = pick(game, wrongOf(game), 500);
    expect(wrong).toMatchObject({ phase: 'asking', streak: 0, lost: [500] });
    expect(wrong.pick).toEqual({ card: wrongOf(game), at: 500, right: false });
    expect(pick(wrong, wrongOf(game), 600).lost).toEqual([500]);
    expect(pick(wrong, rightOf(wrong), 700).firsts).toEqual([false]);
  });

  it('ignores a tap between the cards', () => {
    const game = started();
    expect(advance(game, 10, tapAt(50, 20), SIZE)).toMatchObject({ phase: 'asking', lost: [] });
  });

  it('moves on early with a tap during the cheer, once the tap can’t be the same one', () => {
    const right = pick(started(), rightOf(started()), 100);
    expect(advance(right, 100 + SKIP_AFTER / 2, tapAt(50, 20), SIZE).step).toBe(0);
    expect(advance(right, 101 + SKIP_AFTER, tapAt(50, 20), SIZE).step).toBe(1);
  });
});

describe('the timer', () => {
  it('runs down from the question and stops when it is answered', () => {
    const game = started();
    expect(timeLeft(game, 0)).toBe(1);
    expect(timeLeft(game, LIMIT / 2)).toBeCloseTo(0.5);
    const right = pick(game, rightOf(game), LIMIT / 4);
    expect(timeLeft(right, LIMIT)).toBeCloseTo(0.75);
  });

  it('costs an apple when it runs out, shows the answer, then moves on', () => {
    const out = advance(started(), LIMIT + 50, undefined, SIZE);
    expect(out).toMatchObject({ phase: 'timeout', at: LIMIT, lost: [LIMIT], firsts: [false] });
    expect(timeLeft(out, LIMIT + 50)).toBe(0);
    expect(advance(out, LIMIT + REVEAL, undefined, SIZE).step).toBe(1);
    expect(advance(out, LIMIT + SKIP_AFTER + 1, tapAt(50, 20), SIZE).step).toBe(1);
  });
});

describe('the end of a game', () => {
  it('shows the report card after the last question, with the best score kept', () => {
    let quiz = started();
    let time = 0;
    for (let n = 0; n < ROUND; n++) {
      time += 1_000;
      quiz = pick(quiz, rightOf(quiz), time);
      time += CHEER;
      quiz = advance(quiz, time, undefined, SIZE);
    }
    expect(quiz).toMatchObject({ phase: 'report', best: quiz.score, newBest: true });
    expect(quiz.firsts).toEqual(Array.from({ length: ROUND }, () => true));
    expect(advance(quiz, time + 10, middleOf(AGAIN), SIZE).phase).toBe('report');
    const again = advance(quiz, time + CARDS_UP + 1, middleOf(AGAIN), SIZE);
    expect(again).toMatchObject({ phase: 'asking', round: 1, score: 0, best: quiz.score });
    expect(advance(quiz, time + CARDS_UP + 1, tapAt(50, 20), SIZE).phase).toBe('report');
  });

  it('ends early when the last apple falls', () => {
    const game = started();
    const twice = pick(pick(game, wrongOf(game), 100), wrongOf(game, [wrongOf(game)]), 200);
    expect(livesOf(twice)).toBe(LIVES - 2);
    const quiz = { ...twice, wrong: [], lost: [...twice.lost], since: 89_000, playedAt: 89_000 };
    const wrong = pick(quiz, wrongOf(quiz), 90_000);
    expect(wrong.phase).toBe('out');
    expect(advance(wrong, 90_010, card(rightOf(quiz)), SIZE).phase).toBe('out');
    const report = advance(wrong, 90_000 + OUT, undefined, SIZE);
    expect(report).toMatchObject({ phase: 'report', newBest: false });
  });

  it('goes back to the demo when nobody has tapped for a while', () => {
    const game = started();
    const idle = advance({ ...game, phase: 'report' }, IDLE_RESET + 1, undefined, SIZE);
    expect(idle).toMatchObject({ phase: 'attract', round: 1 });
  });
});

describe('the way out to the real Academy', () => {
  it('opens from the sign during a game or the demo, without playing the tap', () => {
    const quiz = newQuiz(0);
    expect(opensAcademy(quiz, middleOf(SIGN), SIZE, 0)).toBe(true);
    expect(advance(quiz, 5, middleOf(SIGN), SIZE).phase).toBe('attract');
    expect(opensAcademy(quiz, card(0), SIZE, 0)).toBe(false);
    expect(opensAcademy(quiz, undefined, SIZE, 0)).toBe(false);
  });

  it('opens from the report card’s gold card, once it is up', () => {
    const report: Quiz = { ...started(), phase: 'report', at: 0 };
    const gold = tapAt(70, 80);
    expect(opensAcademy(report, gold, SIZE, 100)).toBe(false);
    expect(opensAcademy(report, gold, SIZE, CARDS_UP + 1)).toBe(true);
    expect(opensAcademy(report, middleOf(SIGN), SIZE, CARDS_UP + 1)).toBe(false);
  });
});
