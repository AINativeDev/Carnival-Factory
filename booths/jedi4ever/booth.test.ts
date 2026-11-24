import { describe, expect, it } from 'vitest';
import {
  blinking,
  globeFlake,
  onGlobe,
  swirlOf,
  SWIRL,
  buildOf,
  HOP,
  hopHeight,
  IN_THE_SACK,
  jingleAt,
  JINGLE,
  lampAt,
  letterAt,
  lettersAt,
  LOOP,
  PENGUIN_FEET,
  PENGUINS,
  penguinAt,
  PLACES,
  placeOf,
  sacksFilled,
  shuffleOf,
  SLOT,
  snowflake,
  twinkle,
} from './booth';

describe('letterAt', () => {
  it('drops a letter through the slot and onto the pile', () => {
    const start = letterAt(0, 0)!;
    expect(start.stage).toBe('drop');
    expect(placeOf(start)).toEqual(PLACES.slot);
    const landed = placeOf(letterAt(0, 799.999)!);
    expect(landed.x).toBeCloseTo(PLACES.pile.x);
    expect(landed.y).toBeCloseTo(PLACES.pile.y);
  });

  it('takes a toy letter through sorting, the belt and the check into the sack', () => {
    const stages = [0, 1_000, 2_000, 4_000, 7_000, 7_800].map((t) => letterAt(0, t)!.stage);
    expect(stages).toEqual(['drop', 'carry', 'sort', 'belt', 'check', 'hop']);
    const last = placeOf(letterAt(0, IN_THE_SACK - 0.001)!);
    expect(last.x).toBeCloseTo(PLACES.sack.x);
    expect(last.y).toBeCloseTo(PLACES.sack.y);
    expect(letterAt(0, IN_THE_SACK)).toBeNull();
  });

  it('builds a train, a teddy and a rocket, taking turns, and keeps one letter for later', () => {
    expect([0, 1, 2, 3].map((slot) => letterAt(slot, slot * SLOT)!.toy)).toEqual([
      'train',
      'teddy',
      null,
      'rocket',
    ]);
    const later = [3_000, 4_000, 7_000].map((t) => letterAt(2, 2 * SLOT + t)!);
    expect(later.map((l) => l.stage)).toEqual(['float', 'tray', 'tray']);
    expect(placeOf(later[2])).toEqual(PLACES.tray);
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
    const builds = [2_700, 4_400, 5_800, 6_500].map((t) => buildOf(letterAt(0, t)!));
    expect(builds).toEqual([0, 1, 2, 2]);
  });

  it('never builds the letter that is kept for later', () => {
    for (let t = 0; t < LOOP; t += 100) expect(buildOf(letterAt(2, 2 * SLOT + t)!)).toBe(0);
  });
});

describe('lampAt', () => {
  it('turns green once a toy passes its check, and back to amber after', () => {
    expect(lampAt(6_000)).toBe(0);
    expect(lampAt(7_300)).toBe(1);
    expect(lampAt(8_400)).toBe(0);
    expect(lampAt(7_300 + LOOP)).toBe(1);
  });

  it('stays amber while the letter for later would be checked', () => {
    expect(lampAt(2 * SLOT + 7_300)).toBe(0);
  });
});

describe('jingleAt and sacksFilled', () => {
  const landing = 3 * SLOT + IN_THE_SACK;

  it('jingles just after the round’s last toy lands, gently', () => {
    expect(jingleAt(landing - 1)).toBe(0);
    expect(jingleAt(landing + JINGLE / 2)).toBeCloseTo(1);
    expect(jingleAt(landing + JINGLE)).toBe(0);
    expect(jingleAt(landing + LOOP + JINGLE / 2)).toBeCloseTo(1);
  });

  it('ticks the counter up once per jingle, the first one included', () => {
    const first = landing - LOOP;
    expect(jingleAt(first + JINGLE / 2)).toBeCloseTo(1);
    expect(sacksFilled(0)).toBe(0);
    expect(sacksFilled(first - 1)).toBe(0);
    expect(sacksFilled(first)).toBe(1);
    expect(sacksFilled(landing - 1)).toBe(1);
    expect(sacksFilled(landing)).toBe(2);
    expect(sacksFilled(landing + 2 * LOOP)).toBe(4);
  });

  it('never jingles without the counter moving', () => {
    for (let time = 0; time < 5 * LOOP; time += 50) {
      if (jingleAt(time) > 0) {
        expect(sacksFilled(time)).toBeGreaterThan(sacksFilled(time - JINGLE));
      }
    }
  });
});

describe('the room', () => {
  it('keeps the snow inside the window', () => {
    for (let i = 0; i < 9; i++) {
      for (const time of [0, 777, 12_345, 99_999]) {
        const { x, y } = snowflake(i, time);
        expect(x).toBeGreaterThanOrEqual(0);
        expect(x).toBeLessThan(1);
        expect(y).toBeGreaterThanOrEqual(0);
        expect(y).toBeLessThan(1);
      }
    }
  });

  it('twinkles the lights softly, never off', () => {
    for (let time = 0; time < 10_000; time += 250) {
      expect(twinkle(3, time)).toBeGreaterThanOrEqual(0.55);
      expect(twinkle(3, time)).toBeLessThanOrEqual(1);
    }
  });
});

describe('the penguins', () => {
  it('finds the penguin under the pointer, and none on the empty floor', () => {
    PENGUINS.forEach((penguin, index) => {
      const x = penguin.x + shuffleOf(index, 0);
      expect(penguinAt(x, PENGUIN_FEET - 8, 0)).toBe(index);
      expect(penguinAt(x, PENGUIN_FEET - 14, 0)).toBe(index);
    });
    expect(penguinAt(PENGUINS[0].x, 40, 0)).toBe(-1);
    expect(penguinAt(90, PENGUIN_FEET - 8, 0)).toBe(-1);
  });

  it('follows a penguin as it shuffles, never far from its spot', () => {
    for (let time = 0; time < 20_000; time += 250) {
      PENGUINS.forEach((penguin, index) => {
        const shuffle = shuffleOf(index, time);
        expect(Math.abs(shuffle)).toBeLessThanOrEqual(1.5);
        expect(penguinAt(penguin.x + shuffle, PENGUIN_FEET - 6, time)).toBe(index);
      });
    }
  });

  it('blinks now and then, and mostly keeps its eyes open', () => {
    const times = Array.from({ length: 4_000 }, (_, i) => i * 10);
    const shut = times.filter((time) => blinking(0, time)).length;
    expect(shut).toBeGreaterThan(0);
    expect(shut / times.length).toBeLessThan(0.1);
  });

  it('hops up and back down after a tap', () => {
    expect(hopHeight(-1)).toBe(0);
    expect(hopHeight(0)).toBe(0);
    expect(hopHeight(HOP / 2)).toBeCloseTo(6);
    expect(hopHeight(HOP)).toBe(0);
    expect(hopHeight(Infinity)).toBe(0);
  });

  it('follows a penguin up as it hops', () => {
    const x = PENGUINS[1].x + shuffleOf(1, 0);
    const lifts = PENGUINS.map((_, index) => (index === 1 ? hopHeight(HOP / 2) : 0));
    expect(penguinAt(x, PENGUIN_FEET - 20, 0, lifts)).toBe(1);
    expect(penguinAt(x, PENGUIN_FEET - 20, 0)).toBe(-1);
    expect(penguinAt(x, PENGUIN_FEET + 1, 0, lifts)).toBe(-1);
  });
});

describe('the snow globe', () => {
  it('swirls after a tap and settles in four seconds', () => {
    expect(swirlOf(0)).toBe(1);
    expect(swirlOf(SWIRL)).toBe(0);
    expect(swirlOf(-Infinity)).toBe(0);
    expect(globeFlake(3, 0)).not.toEqual(globeFlake(3, SWIRL));
    expect(globeFlake(3, SWIRL)).toEqual(globeFlake(3, SWIRL + 5_000));
    expect(onGlobe(60, 76)).toBe(true);
    expect(onGlobe(10, 10)).toBe(false);
  });
});
