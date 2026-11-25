import { describe, expect, it } from 'vitest';
import { cardAt, STEP, WALL } from './square';

describe('cardAt', () => {
  it('moves the light along the cards, one at a time, and round again', () => {
    expect(cardAt(0)).toBe(0);
    expect(cardAt(STEP * 2.5)).toBe(2);
    expect(cardAt(STEP * WALL.across * WALL.rows)).toBe(0);
    expect(cardAt(-STEP / 2)).toBe(WALL.across * WALL.rows - 1);
  });
});
