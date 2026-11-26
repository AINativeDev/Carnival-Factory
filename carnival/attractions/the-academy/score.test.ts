import { describe, expect, it } from 'vitest';
import { QUESTIONS, ROUND, roundOf } from './questions';
import { gradeOf, MAX_MULTIPLIER, multiplierOf, pointsFor, scoreText } from './score';

describe('points', () => {
  it('give 100 for a right answer, up to 100 more for speed, times the streak', () => {
    expect(pointsFor(0, 1)).toBe(100);
    expect(pointsFor(1, 1)).toBe(200);
    expect(pointsFor(0.55, 1)).toBe(160);
    expect(pointsFor(1, 3)).toBe(600);
    expect(pointsFor(2, 1)).toBe(200);
    expect(pointsFor(-1, 1)).toBe(100);
  });

  it('multiply by the streak, never by less than one or more than the most', () => {
    expect(multiplierOf(0)).toBe(1);
    expect(multiplierOf(2)).toBe(2);
    expect(multiplierOf(99)).toBe(MAX_MULTIPLIER);
  });

  it('are written with their thousands grouped', () => {
    expect(scoreText(0)).toBe('0');
    expect(scoreText(980)).toBe('980');
    expect(scoreText(12_340.4)).toBe('12,340');
    expect(scoreText(1_234_567)).toBe('1,234,567');
    expect(scoreText(-5)).toBe('0');
  });
});

describe('the grade', () => {
  it('goes by the questions answered right first time', () => {
    expect(gradeOf(5, 5).letter).toBe('A+');
    expect(gradeOf(4, 5).letter).toBe('A');
    expect(gradeOf(3, 5).letter).toBe('B');
    expect(gradeOf(2, 5).letter).toBe('C');
    expect(gradeOf(0, 5)).toEqual({ letter: 'D', words: 'Every expert started here!' });
    expect(gradeOf(0, 0).letter).toBe('D');
  });
});

describe('the questions', () => {
  it('each have three different short answers, one of them right, and a hint and a why', () => {
    for (const question of QUESTIONS) {
      expect(new Set(question.answers).size).toBe(3);
      expect(question.answers.at(question.right)).toBeDefined();
      for (const answer of question.answers) expect(answer.length).toBeLessThanOrEqual(28);
      expect(question.ask.length).toBeLessThanOrEqual(50);
      expect(question.hint).not.toBe('');
      expect(question.why).not.toBe('');
    }
  });

  it('put the right answer in every place, so guessing one place never wins', () => {
    expect(new Set(QUESTIONS.map((question) => question.right)).size).toBe(3);
  });

  it('ask the next ones each round, wrapping round the bank', () => {
    expect(roundOf(0)).toEqual(QUESTIONS.slice(0, ROUND));
    expect(roundOf(1)[0]).toBe(QUESTIONS[ROUND % QUESTIONS.length]);
    expect(roundOf(1)).toHaveLength(ROUND);
    expect(roundOf(-1)).toHaveLength(ROUND);
  });
});
