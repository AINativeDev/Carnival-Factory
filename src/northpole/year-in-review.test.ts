import { describe, expect, it } from 'vitest';
import type { NorthPoleSquare } from './square';
import {
  ANSWER_ITEMS,
  cleanYearInReview,
  MAX_ANSWER,
  MAX_QUESTION,
  OWN_QUESTIONS,
  plainText,
  YEAR_QUESTIONS,
} from './year-in-review';

const squares = import.meta.glob<{ default: NorthPoleSquare }>(
  '../../carnival/levels/the-year-in-review/squares/*/square.ts',
  { eager: true },
);

describe('the questions', () => {
  it('asks seven looking back and six looking ahead, each with its own item', () => {
    expect(YEAR_QUESTIONS.filter(({ half }) => half === 'back')).toHaveLength(7);
    expect(YEAR_QUESTIONS.filter(({ half }) => half === 'ahead')).toHaveLength(6);
    expect(new Set(ANSWER_ITEMS).size).toBe(14);
    expect(ANSWER_ITEMS.at(-1)).toBe(OWN_QUESTIONS);
  });

  it('hangs each one in the room as an item named for it, its question word for word', () => {
    const byId = new Map(
      Object.values(squares).map(({ default: square }) => [square.id, square] as const),
    );
    for (const question of YEAR_QUESTIONS) {
      const square = byId.get(question.id);
      expect(square?.name, question.id).toBe(question.title);
      expect(square?.description, question.id).toBe(question.text);
    }
    expect(byId.has(OWN_QUESTIONS)).toBe(true);
    expect(byId.size).toBe(ANSWER_ITEMS.length);
  });
});

describe('plainText', () => {
  it('keeps words on one line, drops what hides, and caps the length', () => {
    expect(plainText('  a\n\tb  ', 10)).toBe('a b');
    expect(plainText('ze\u200Bro\u202Ewidth\u{E0041}', 20)).toBe('zerowidth');
    expect(plainText('abcdef', 4)).toBe('abc…');
    expect(plainText('😀😀😀', 2)).toBe('😀…');
    expect(plainText('\u200B \n', 10)).toBeUndefined();
    expect(plainText(42, 10)).toBeUndefined();
  });
});

const answer = (extra: object = {}) => ({
  login: 'Elf-One',
  answer: 'It said the moon is cheese.',
  at: '2026-11-20T10:00:00Z',
  ...extra,
});

describe('cleanYearInReview', () => {
  it('keeps the answers of the room’s items, newest first', () => {
    const older = answer({ at: '2026-11-01T00:00:00Z', answer: 'older' });
    expect(cleanYearInReview({ 'dumbest-ai-moment': [older, answer()] })).toEqual({
      'dumbest-ai-moment': [answer(), older],
    });
  });

  it('gives the guestbook’s answers their own question, and drops one without it', () => {
    const own = answer({ question: 'Best cocoa?' });
    expect(cleanYearInReview({ [OWN_QUESTIONS]: [own, answer()] })).toEqual({
      [OWN_QUESTIONS]: [own],
    });
    expect(cleanYearInReview({ 'hot-take': [own] })).toEqual({ 'hot-take': [answer()] });
  });

  it('keeps hostile words as plain text: markup stays letters, mentions stay words', () => {
    const hostile = answer({
      answer: '<img src=x onerror=alert(1)> @everyone \u202Egnp.exe',
      question: '?'.repeat(MAX_QUESTION + 20),
    });
    const clean = cleanYearInReview({ [OWN_QUESTIONS]: [hostile] })[OWN_QUESTIONS]?.at(0);
    expect(clean?.answer).toBe('<img src=x onerror=alert(1)> @everyone gnp.exe');
    expect(Array.from(clean?.question ?? '')).toHaveLength(MAX_QUESTION);
    const long = cleanYearInReview({ 'hot-take': [answer({ answer: 'a'.repeat(1000) })] });
    expect(Array.from(long['hot-take']?.[0]?.answer ?? '')).toHaveLength(MAX_ANSWER);
  });

  it('drops anything that isn’t an answer, an item or a list', () => {
    expect(cleanYearInReview(undefined)).toEqual({});
    expect(cleanYearInReview('nope')).toEqual({});
    expect(
      cleanYearInReview({
        'not-a-question': [answer()],
        __proto__: [answer()],
        'hot-take': 'nope',
        'finally-fixed': [
          null,
          'text',
          answer({ login: 'no spaces allowed' }),
          answer({ login: 7 }),
          answer({ answer: '   ' }),
          answer({ at: 'yesterday' }),
          answer({ at: 5 }),
          answer({ at: 'x'.repeat(50) }),
        ],
      }),
    ).toEqual({});
  });

  it('shows at most the hundred newest on an item', () => {
    const many = Array.from({ length: 120 }, (_, n) =>
      answer({ at: new Date(Date.UTC(2026, 0, 1, 0, n)).toISOString() }),
    );
    const kept = cleanYearInReview({ 'hot-take': many })['hot-take'] ?? [];
    expect(kept).toHaveLength(100);
    expect(kept[0]?.at).toBe(many[119]?.at);
  });
});
