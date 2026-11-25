import { describe, expect, it } from 'vitest';
import {
  buildOf,
  IN_THE_SACK,
  letterAt,
  lettersAt,
  LOOP,
  PLACES,
  placeOf,
  SLOT,
  type Letter,
} from './letters';

/** The letter in `slot` at `time`, failing the test when there is none. */
function letter(slot: number, time: number): Letter {
  const found = letterAt(slot, time);
  if (!found) throw new Error(`No letter in slot ${String(slot)} at ${String(time)}`);
  return found;
}

describe('letterAt', () => {
  it('drops a letter through the slot and onto the pile', () => {
    const start = letter(0, 0);
    expect(start.stage).toBe('drop');
    expect(placeOf(start)).toEqual(PLACES.slot);
    const landed = placeOf(letter(0, 799.999));
    expect(landed.x).toBeCloseTo(PLACES.pile.x);
    expect(landed.y).toBeCloseTo(PLACES.pile.y);
  });

  it('takes a toy letter through sorting, the belt and the check into the sack', () => {
    const stages = [0, 1_000, 2_000, 4_000, 7_000, 7_800].map((t) => letter(0, t).stage);
    expect(stages).toEqual(['drop', 'carry', 'sort', 'belt', 'check', 'hop']);
    const last = placeOf(letter(0, IN_THE_SACK - 0.001));
    expect(last.x).toBeCloseTo(PLACES.sack.x);
    expect(last.y).toBeCloseTo(PLACES.sack.y);
    expect(letterAt(0, IN_THE_SACK)).toBeNull();
  });

  it('builds a train, a teddy and a rocket, taking turns, and keeps one letter for later', () => {
    expect([0, 1, 2, 3].map((slot) => letter(slot, slot * SLOT).toy)).toEqual([
      'train',
      'teddy',
      null,
      'rocket',
    ]);
    const later = [3_000, 4_000, 7_000].map((t) => letter(2, 2 * SLOT + t));
    expect(later.map((l) => l.stage)).toEqual(['float', 'tray', 'tray']);
    expect(placeOf(letter(2, 2 * SLOT + 7_000))).toEqual(PLACES.tray);
  });

  it('repeats every loop, before the page loaded too', () => {
    for (const time of [0, 1_234, 5_000, 11_999]) {
      expect(lettersAt(time + LOOP)).toEqual(lettersAt(time));
      expect(lettersAt(time + 7 * LOOP)).toEqual(lettersAt(time));
    }
    expect(letterAt(1, -500)).toEqual(letterAt(1, LOOP - 500));
  });

  it('never has two letters at the sorting elf or the check at once', () => {
    for (let time = 0; time < LOOP; time += 50) {
      const letters = lettersAt(time);
      expect(letters.filter((l) => l.stage === 'sort').length).toBeLessThanOrEqual(1);
      expect(letters.filter((l) => l.stage === 'check').length).toBeLessThanOrEqual(1);
    }
  });
});

describe('buildOf', () => {
  it('hammers the letter into a toy, then paints it, along the belt', () => {
    const builds = [2_700, 4_400, 5_800, 6_500].map((t) => buildOf(letter(0, t)));
    expect(builds).toEqual([0, 1, 2, 2]);
  });

  it('never builds the letter that is kept for later', () => {
    for (let t = 0; t < LOOP; t += 100) expect(buildOf(letter(2, 2 * SLOT + t))).toBe(0);
  });
});
