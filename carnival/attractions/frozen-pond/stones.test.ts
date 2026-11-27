import { describe, expect, it } from 'vitest';
import { HACK, SHEET, stoneAt, type Stone } from './sheet';
import { AIM, PULL, STEP_MS, launch, moving, slideAll, slideLength, throwFrom } from './stones';

/** Slides `stones` until they all stop, with `wind` and the first one swept when `swept`. */
function slideOut(stones: Stone[], wind = 0, swept = false) {
  let clock = 0;
  for (let n = 0; n < 2_000 && stones.some(moving); n++) {
    slideAll(stones, 2, clock, { wind, swept: 0, sweeping: () => swept });
    clock += 2 * STEP_MS;
  }
  return stones;
}

describe('a drag', () => {
  const hack = { x: 20, y: 66 };

  it('throws harder the further back it pulls, and aims the other way to a pull up or down', () => {
    const soft = throwFrom(hack, { x: 20 - PULL / 2, y: 66 });
    expect(soft?.power).toBeCloseTo(0.5);
    expect(soft?.angle).toBeCloseTo(0);
    expect(throwFrom(hack, { x: 20 - PULL * 2, y: 66 })?.power).toBe(1);
    expect(throwFrom(hack, { x: 10, y: 68 })?.angle).toBeLessThan(0);
    expect(throwFrom(hack, { x: 10, y: 64 })?.angle).toBeGreaterThan(0);
    expect(throwFrom(hack, { x: 10, y: 0 })?.angle).toBe(AIM);
  });

  it('throws nothing for a drag forward or one too small to mean anything', () => {
    expect(throwFrom(hack, { x: 30, y: 66 })).toBeUndefined();
    expect(throwFrom(hack, hack)).toBeUndefined();
    expect(throwFrom(hack, { x: 19, y: 66 })).toBeUndefined();
  });
});

describe('a slide', () => {
  it('stops as far down the sheet as the throw says, on still air', () => {
    const stone = slideOut([launch({ power: 0.7, angle: 0 })]).at(0);
    expect(stone?.s).toBeCloseTo(HACK + slideLength(0.7), 0);
    expect(stone?.w).toBeCloseTo(0);
  });

  it('drifts with the wind, and slides further and straighter when swept', () => {
    const blown = slideOut([launch({ power: 0.7, angle: 0 })], 1).at(0);
    const swept = slideOut([launch({ power: 0.7, angle: 0 })], 1, true).at(0);
    expect(blown?.w).toBeGreaterThan(2);
    expect(swept?.s).toBeGreaterThan((blown?.s ?? 0) + 10);
  });

  it('knocks a still stone on, and slows the one that hit it', () => {
    const thrown = launch({ power: 0.7, angle: 0 });
    const target = stoneAt(30, 0, true);
    let knocks = 0;
    for (let clock = 0; clock < 10_000; clock += STEP_MS * 2)
      knocks += slideAll([thrown, target], 2, clock, { wind: 0, swept: 0, sweeping: () => false });
    expect(knocks).toBeGreaterThan(0);
    expect(target.s).toBeGreaterThan(40);
    expect(thrown.s).toBeLessThan(target.s);
  });

  it('puts a stone that leaves the sheet out of play, where it stays', () => {
    const wide = launch({ power: 0.9, angle: AIM });
    slideOut([wide], 3);
    expect(wide.out).toBeLessThan(Infinity);
    expect(Math.abs(wide.w)).toBeGreaterThan(SHEET.wide);
    expect(moving(wide)).toBe(false);
  });
});
