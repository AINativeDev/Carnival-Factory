import { describe, expect, it } from 'vitest';
import { popIn, scatter, smooth, wrap } from './chalk';
import { academyAt, ACADEMY, BOARD, cardAt, CARDS, inside, SIGN } from './layout';

/** Every character one unit wide. */
const measure = (line: string) => line.length;

describe('wrapping words', () => {
  it('fills each line up to the width and keeps a too-long word whole', () => {
    expect(wrap('What helps an agent build', 12, measure)).toEqual([
      'What helps',
      'an agent',
      'build',
    ]);
    expect(wrap('Supercalifragilistic is long', 6, measure)).toEqual([
      'Supercalifragilistic',
      'is',
      'long',
    ]);
    expect(wrap('  ', 10, measure)).toEqual([]);
  });
});

describe('the easing and the scatter', () => {
  it('ease from 0 to 1 and stay there', () => {
    expect(smooth(-1)).toBe(0);
    expect(smooth(0.5)).toBe(0.5);
    expect(smooth(3)).toBe(1);
    expect(popIn(0)).toBeCloseTo(0);
    expect(popIn(1)).toBe(1);
    expect(Math.max(...[0.6, 0.7, 0.8, 0.9].map(popIn))).toBeGreaterThan(1);
  });

  it('scatters the same way every time, between 0 and 1', () => {
    const all = Array.from({ length: 50 }, (_, n) => scatter(n));
    expect(all.every((s) => s >= 0 && s < 1)).toBe(true);
    expect(scatter(7)).toBe(scatter(7));
  });
});

describe('the layout', () => {
  it('finds the card under a tap, and none between them', () => {
    CARDS.forEach((card, n) => {
      expect(cardAt(card.x + card.w / 2, card.y + card.h / 2)).toBe(n);
    });
    expect(cardAt(50, 20)).toBe(-1);
  });

  it('keeps everything tappable inside the square, and the cards clear of the board', () => {
    for (const box of [...CARDS, ACADEMY, SIGN, BOARD]) {
      expect(box.x).toBeGreaterThanOrEqual(0);
      expect(box.x + box.w).toBeLessThanOrEqual(100);
      expect(box.y + box.h).toBeLessThanOrEqual(100);
    }
    for (const card of CARDS) expect(card.y).toBeGreaterThan(BOARD.y + BOARD.h);
  });

  it('opens the Academy from its gold card on the report card, and from the sign otherwise', () => {
    expect(academyAt(true, ACADEMY.x + 1, ACADEMY.y + 1)).toBe(true);
    expect(academyAt(false, ACADEMY.x + 1, ACADEMY.y + 1)).toBe(false);
    expect(academyAt(false, SIGN.x + 1, SIGN.y + 1)).toBe(true);
    expect(inside(SIGN, SIGN.x - 1, SIGN.y)).toBe(false);
  });
});
