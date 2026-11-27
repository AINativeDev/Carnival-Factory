import { describe, expect, it } from 'vitest';
import {
  BACK,
  HOUSE,
  SHEET,
  STONE,
  fromButton,
  offSheet,
  onScreen,
  ringPoints,
  rivalsFor,
  shotStone,
  stoneAt,
  windFor,
} from './sheet';

describe('the sheet', () => {
  it('runs left to right on screen, across drawn half as tall', () => {
    expect(onScreen(0, 0)).toEqual({ x: SHEET.x, y: SHEET.y });
    expect(onScreen(10, 4)).toEqual({ x: SHEET.x + 10, y: SHEET.y + 2 });
  });

  it('puts a stone out of play over a side or past the back line', () => {
    expect(offSheet(stoneAt(HOUSE.s, 0, false))).toBe(false);
    expect(offSheet(stoneAt(HOUSE.s, SHEET.wide + 0.1, false))).toBe(true);
    expect(offSheet(stoneAt(BACK + STONE + 0.1, 0, false))).toBe(true);
  });
});

describe('scoring an end', () => {
  it('scores 3, 2 or 1 by the ring a stone touches, and nothing outside the house', () => {
    expect(ringPoints(0)).toBe(3);
    expect(ringPoints(HOUSE.rings[0] + STONE)).toBe(3);
    expect(ringPoints(HOUSE.rings[1] + STONE - 0.1)).toBe(2);
    expect(ringPoints(HOUSE.rings[2] + STONE - 0.1)).toBe(1);
    expect(ringPoints(HOUSE.rings[2] + STONE + 0.1)).toBe(0);
  });

  it('gives the end to the stone nearest the button, and nothing when it is a rival', () => {
    const yours = stoneAt(HOUSE.s + 1, 0, false);
    const rival = stoneAt(HOUSE.s + 5, 0, true);
    expect(fromButton(yours)).toBeCloseTo(1);
    expect(shotStone([rival, yours])).toEqual({ stone: yours, points: 3 });
    expect(shotStone([stoneAt(HOUSE.s, 0.5, true), yours]).points).toBe(0);
    expect(shotStone([])).toEqual({ stone: undefined, points: 0 });
  });

  it('never counts a stone that went out of play', () => {
    const gone = { ...stoneAt(HOUSE.s, 0, false), out: 100 };
    const rival = stoneAt(HOUSE.s + 7, 0, true);
    expect(shotStone([gone, rival]).stone).toBe(rival);
  });
});

describe('each end', () => {
  it('blows harder each end, the same for the same game', () => {
    for (const seed of [1, 42, 977]) {
      const winds = [1, 2, 3].map((end) => Math.abs(windFor(end, seed)));
      expect(winds[1]).toBeGreaterThan(winds[0] ?? 0);
      expect(winds[2]).toBeGreaterThan(winds[0] ?? 0);
      expect(windFor(2, seed)).toBe(windFor(2, seed));
    }
  });

  it('sets out one more rival stone each end, on the sheet', () => {
    for (const end of [1, 2, 3]) {
      const rivals = rivalsFor(end, 5);
      expect(rivals).toHaveLength(end);
      for (const stone of rivals) {
        expect(stone.rival).toBe(true);
        expect(offSheet(stone)).toBe(false);
      }
    }
  });
});
