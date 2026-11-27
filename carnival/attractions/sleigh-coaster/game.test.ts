import { describe, expect, it } from 'vitest';
import { elfPushes, hangPresents, presents, reached, REACH, SLEIGH_MIDDLE } from './course';
import {
  advance,
  cardAt,
  clockLeft,
  type Coaster,
  DEMO_RUN,
  GUARD,
  IDLE,
  newCoaster,
  PRESENT_POINTS,
  RUN,
  scoreOf,
  TUMBLE,
} from './game';
import { AT_STATION, crestReading, STEP } from './physics';

const FRAME = 16;
const tap = { x: 50, y: 50, down: true, presses: 1 };
const hold = { x: 50, y: 50, down: true, presses: 0 };
const lifted = { x: 50, y: 50, down: false, presses: 0 };

/** Plays frames from the coaster's time up to `until`, the pointer as `pointer` says for each. */
function play(from: Coaster, until: number, pointer: (c: Coaster) => typeof hold | undefined) {
  let coaster = from;
  for (let t = coaster.at + FRAME; t <= until; t += FRAME)
    coaster = advance(coaster, t, pointer(coaster));
  return coaster;
}

/** Holds flat out from the start of a run until its card comes up. */
function flatOut(): Coaster {
  let coaster = advance(newCoaster(0), 1_000, tap);
  while (coaster.phase !== 'over') coaster = advance(coaster, coaster.at + FRAME, hold);
  return coaster;
}

/** A run started at 1000 with a tap. */
const started = () => advance(newCoaster(0), 1_000, tap);

describe('the elf’s demo', () => {
  it('drives the sleigh with nobody playing, scoring nothing for the visit', () => {
    const coaster = play(newCoaster(0), 8_000, () => undefined);
    expect(coaster.phase).toBe('demo');
    expect(coaster.sleigh.x).toBeGreaterThan(100);
    expect(coaster.best).toBe(0);
  });

  it('starts again from the station after a while', () => {
    const coaster = play(newCoaster(0), DEMO_RUN + 500, () => undefined);
    expect(coaster.start).toBeGreaterThanOrEqual(DEMO_RUN);
    expect(coaster.sleigh.x).toBeLessThan(30);
  });

  it('never flies off, and catches every present it flies past', () => {
    let coaster = newCoaster(0);
    for (let t = FRAME; t < DEMO_RUN - 100; t += FRAME) {
      coaster = advance(coaster, t, undefined);
      expect(coaster.sleigh.off).toBe(false);
    }
    const passed = presents().filter((p) => p.x < coaster.sleigh.x - REACH);
    expect(passed.length).toBeGreaterThan(3);
    expect(coaster.caught).toHaveLength(passed.length);
  });
});

describe('a run', () => {
  it('starts at the station with a tap, and goes nowhere until it’s pushed', () => {
    const coaster = started();
    expect(coaster.phase).toBe('ride');
    expect(coaster.sleigh).toEqual(AT_STATION);
    expect(play(coaster, 2_000, () => lifted).sleigh.x).toBe(0);
    expect(play(coaster, 2_000, () => hold).sleigh.x).toBeGreaterThan(5);
    expect(play(coaster, 2_000, () => hold).pushing).toBe(true);
  });

  it('flies off the rails held flat out, tumbles, then shows its card', () => {
    let coaster = flatOut();
    expect(coaster.sleigh.off).toBe(true);
    expect(coaster.phase).toBe('over');
    const ended = coaster.ended ?? 0;
    expect(cardAt(coaster)).toBe(ended + TUMBLE);
    expect(coaster.best).toBe(scoreOf(coaster));
    expect(clockLeft(coaster, 1e9)).toBe(RUN - (ended - coaster.start));
    // A tap as the card comes up is ignored; one a moment later rides again.
    coaster = advance(coaster, ended + TUMBLE + GUARD / 2, tap);
    expect(coaster.phase).toBe('over');
    const best = coaster.best;
    coaster = advance(coaster, ended + TUMBLE + GUARD, tap);
    expect(coaster.phase).toBe('ride');
    expect(coaster.best).toBe(best);
  });

  it('tumbles before the card, frozen where it flew off', () => {
    const flying = flatOut();
    const ended = flying.ended ?? 0;
    const back = { ...flying, phase: 'tumble' as const, at: ended, best: 0 };
    const tumbling = advance(back, ended + TUMBLE / 2, undefined);
    expect(tumbling.phase).toBe('tumble');
    expect(tumbling.sleigh).toEqual(flying.sleigh);
    expect(advance(tumbling, ended + TUMBLE + 10, undefined).phase).toBe('over');
  });

  it('ends when the clock runs out, driven like the elf, with presents in its score', () => {
    let coaster = started();
    for (let t = 1_000 + STEP * 1_000; t <= 1_000 + RUN + 100; t += STEP * 1_000) {
      const down = elfPushes(coaster.sleigh);
      coaster = advance(coaster, t, { ...hold, down });
    }
    expect(coaster.phase).toBe('over');
    expect(coaster.sleigh.off).toBe(false);
    expect(cardAt(coaster)).toBe(coaster.ended);
    expect(coaster.caught.length).toBeGreaterThan(5);
    const metres = Math.floor(coaster.sleigh.x);
    expect(scoreOf(coaster)).toBe(metres + coaster.caught.length * PRESENT_POINTS);
    expect(coaster.best).toBe(scoreOf(coaster));
    expect(clockLeft(coaster, 1e9)).toBe(0);
  });

  it('hands back to the elf when its card is left a while', () => {
    const over = flatOut();
    const card = cardAt(over) ?? 0;
    const later = advance(over, card + IDLE + 1, undefined);
    expect(later.phase).toBe('demo');
    expect(later.best).toBe(over.best);
  });

  it('counts the clock down while riding', () => {
    const coaster = started();
    expect(clockLeft(coaster, 1_000)).toBe(RUN);
    expect(clockLeft(coaster, 11_000)).toBe(RUN - 10_000);
    expect(cardAt(coaster)).toBeNull();
  });

  it('plays only a moment after a long pause, and starts afresh if time runs backwards', () => {
    const coaster = advance(started(), 1_000_000, hold);
    expect(coaster.sleigh.x).toBeLessThan(5);
    const back = advance({ ...coaster, best: 77 }, 10, undefined);
    expect(back.phase).toBe('demo');
    expect(back.best).toBe(77);
  });
});

describe('the presents', () => {
  it('hang where the elf flies highest, the same every ride', () => {
    const all = presents();
    expect(all.length).toBeGreaterThan(15);
    expect(presents()).toBe(all);
    expect(hangPresents()).toEqual(all);
  });

  it('are reached only by a sleigh passing close by', () => {
    const present = presents().at(0);
    if (!present) throw new Error('no presents');
    const sleigh = {
      ...AT_STATION,
      x: present.x,
      air: { y: present.y - SLEIGH_MIDDLE, vx: 1, vy: 0 },
    };
    expect(reached(sleigh, presents())).toEqual([0]);
    expect(reached({ ...sleigh, x: present.x + REACH + 1 }, presents())).toEqual([]);
    expect(reached({ ...sleigh, air: null }, presents())).toEqual([]);
  });

  it('are what the elf aims for: it pushes while short of the airtime, and coasts past it', () => {
    const slow = { ...AT_STATION, x: 5, speed: 10 };
    expect(crestReading(slow).over).toBeLessThan(0);
    expect(elfPushes(slow)).toBe(true);
    expect(elfPushes({ ...slow, speed: 60 })).toBe(false);
    expect(elfPushes({ ...slow, x: 1e9, speed: 10 })).toBe(true);
  });
});
