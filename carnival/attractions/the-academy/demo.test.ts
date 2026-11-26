import { describe, expect, it } from 'vitest';
import { DEMO, DEMO_LOOP, DEMO_PICK, POINT_EVERY, shownOf } from './demo';
import { CARDS } from './layout';
import { roundOf } from './questions';
import { newQuiz, type Quiz } from './state';
import { teacherOf } from './teacher';

const SIZE = 400;
const over = (n: number) => {
  const card = CARDS[n] ?? { x: 0, y: 0, w: 0, h: 0 };
  const x = ((card.x + card.w / 2) / 100) * SIZE;
  return { x, y: ((card.y + 5) / 100) * SIZE, down: false, presses: 0 };
};
const playing = (changes: Partial<Quiz> = {}): Quiz => ({
  ...newQuiz(0),
  phase: 'asking',
  playedAt: 0,
  ...changes,
});

describe('the demo', () => {
  it('asks its own question, pointing at each card in turn, then picks the right one, and loops', () => {
    const quiz = newQuiz(0);
    const first = shownOf(quiz, 10, undefined, SIZE);
    expect(first).toMatchObject({ question: DEMO, demo: true, lit: 0 });
    expect(first.quiz.phase).toBe('asking');
    expect(shownOf(quiz, POINT_EVERY + 10, undefined, SIZE).lit).toBe(1);
    const picked = shownOf(quiz, DEMO_PICK + 10, undefined, SIZE);
    expect(picked.quiz).toMatchObject({ phase: 'right', pick: { card: DEMO.right, right: true } });
    expect(picked.quiz.score).toBeGreaterThan(0);
    expect(shownOf(quiz, DEMO_LOOP + 10, undefined, SIZE).quiz.phase).toBe('asking');
    expect(roundOf(0)).not.toContain(DEMO);
  });

  it('shows a game as it stands, lighting the card under the pointer unless greyed out', () => {
    expect(shownOf(playing(), 10, over(2), SIZE)).toMatchObject({ lit: 2, demo: false });
    expect(shownOf(playing({ wrong: [2] }), 10, over(2), SIZE).lit).toBe(-1);
    expect(shownOf(playing(), 10, undefined, SIZE).lit).toBe(-1);
    expect(shownOf(playing({ phase: 'right' }), 10, over(2), SIZE).lit).toBe(-1);
  });
});

describe('the teacher', () => {
  const at = (quiz: Quiz, time = 100, lit = -1) =>
    teacherOf({ quiz, question: roundOf(0)[0], lit, demo: quiz.phase === 'attract' }, time);

  it('points at the lit card, or the question, and hurries near the end of the timer', () => {
    const card = CARDS[1] ?? { x: 0, y: 0, w: 0 };
    expect(at(playing(), 100, 1)).toMatchObject({
      pose: 'point',
      says: '',
      target: { x: card.x + card.w / 2, y: card.y },
    });
    expect(at(playing(), 10_000).says).toBe('Hurry!');
    expect(at({ ...newQuiz(0) }).says).toBe('Pop quiz!');
  });

  it('cheers, ponders and graduates as the game goes', () => {
    const pick = { card: 0, at: 50, right: true };
    expect(at(playing({ phase: 'right', pick, streak: 1 })).says).toBe('Hoo-ray!');
    expect(at(playing({ phase: 'right', pick, streak: 3 })).says).toBe('On fire!');
    expect(at(playing({ phase: 'right', streak: 1 })).pose).toBe('cheer');
    expect(at(playing({ pick: { ...pick, right: false } })).pose).toBe('ponder');
    expect(at(playing({ pick: { ...pick, right: false } }), 5_000).pose).toBe('point');
    expect(at(playing({ phase: 'timeout' })).says).toBe('Time’s up!');
    expect(at(playing({ phase: 'out' })).pose).toBe('ponder');
    expect(at(playing({ phase: 'report' })).pose).toBe('graduate');
  });
});
