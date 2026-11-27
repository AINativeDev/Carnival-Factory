import { describe, expect, it } from 'vitest';
import {
  advance,
  applause,
  CARD,
  catchable,
  EVERY,
  IDLE,
  MOST,
  multiplier,
  newAct,
  newRing,
  settle,
  tap,
  type Act,
} from './act';
import {
  baubleAt,
  CATCHABLE,
  DROPPED,
  flight,
  HANDS,
  pace,
  tossFrom,
  wobble,
  type Toss,
} from './throws';

/** The moment `toss` is `s` of the way through its flight. */
const when = (toss: Toss, s: number) => toss.at + toss.dur * s;

/** Catches the bauble nearest its drop, tapping right on it as it nears the hands. */
function catchNext(act: Act): number {
  const toss = act.balls.reduce((a, b) => (when(b, 0.9) < when(a, 0.9) ? b : a));
  const time = when(toss, 0.9);
  const p = baubleAt(toss, time);
  tap(act, p.x, p.y, time);
  return time;
}

describe('a bauble in the air', () => {
  const toss = tossFrom(HANDS.x - HANDS.spread, HANDS.y, 1_000, 0, 0);

  it('is held before it is thrown, flies over to the far hand, and lies on the sawdust once it falls', () => {
    expect(baubleAt(toss, 0)).toEqual({ x: toss.fromX, y: toss.fromY });
    expect(toss.toX).toBeGreaterThan(HANDS.x);
    expect(baubleAt(toss, when(toss, 0.5)).y).toBeLessThan(HANDS.y - 20);
    expect(baubleAt(toss, when(toss, 1)).y).toBeCloseTo(HANDS.y);
    expect(baubleAt(toss, when(toss, 3)).y).toBe(HANDS.floor);
    expect(flight(toss, when(toss, 0.25))).toBeCloseTo(0.25);
  });

  it('throws from the right hand back over to the left', () => {
    expect(tossFrom(HANDS.x + 5, HANDS.y, 0, 0, 1).toX).toBeLessThan(HANDS.x);
  });

  it('flies quicker as the catches mount, down to a floor', () => {
    expect(pace(20)).toBeLessThan(pace(0));
    expect(pace(500)).toBe(pace(1_000));
  });

  it('varies each throw steadily', () => {
    expect(wobble(3)).toBe(wobble(3));
    expect(wobble(3)).not.toBe(wobble(4));
    expect(wobble(3)).toBeGreaterThanOrEqual(0);
    expect(wobble(3)).toBeLessThan(1);
  });
});

describe('catching', () => {
  it('starts a visitor with two baubles, and the elf with three', () => {
    expect(newAct(0, true).balls).toHaveLength(2);
    expect(newRing(0).act.balls).toHaveLength(3);
  });

  it('catches only a falling bauble, and only within reach of the tap', () => {
    const act = newAct(0, true);
    const toss = act.balls.at(0);
    if (!toss) throw new Error('no bauble');
    const rising = baubleAt(toss, when(toss, 0.3));
    expect(catchable(act, rising.x, rising.y, when(toss, 0.3))).toBe(-1);
    const falling = baubleAt(toss, when(toss, 0.8));
    expect(catchable(act, falling.x, falling.y, when(toss, 0.8))).toBe(0);
    expect(catchable(act, falling.x + 30, falling.y, when(toss, 0.8))).toBe(-1);
    expect(catchable(act, falling.x, falling.y, when(toss, DROPPED))).toBe(-1);
    expect(CATCHABLE).toBeLessThan(1);
  });

  it('tosses a caught bauble back up and scores it', () => {
    const act = newAct(0, true);
    const time = catchNext(act);
    expect(act.catches).toBe(1);
    expect(act.score).toBe(1);
    expect(act.pop).toMatchObject({ at: time, points: 1 });
    expect(act.balls.every((toss) => flight(toss, time) < 1)).toBe(true);
  });

  it('breaks the streak on a tap that catches nothing', () => {
    const act = newAct(0, true);
    catchNext(act);
    tap(act, 2, 2, 5_000);
    expect(act.streak).toBe(0);
    expect(act.pop?.points).toBe(0);
    expect(act.catches).toBe(1);
  });

  it('scores more on a streak, adds a bauble every few catches, and never more than the most', () => {
    expect(multiplier(0)).toBe(1);
    expect(multiplier(EVERY)).toBe(2);
    expect(multiplier(500)).toBe(5);
    const act = newAct(0, true);
    for (let n = 0; n < EVERY; n++) catchNext(act);
    expect(act.balls).toHaveLength(3);
    expect(act.score).toBe(EVERY);
    catchNext(act);
    expect(act.score).toBe(EVERY + 2);
    for (let n = 0; n < EVERY * 6; n++) catchNext(act);
    expect(act.balls).toHaveLength(MOST);
  });
});

describe('the act', () => {
  it('ends when a bauble falls past the hands, but never in the elf’s own show', () => {
    const act = newAct(0, true);
    settle(act, 1_000);
    expect(act.dropped).toBeNull();
    settle(act, 60_000);
    expect(act.dropped).toBe(60_000);
    settle(act, 70_000);
    expect(act.dropped).toBe(60_000);
    const show = newAct(0, false);
    settle(show, 60_000);
    expect(show.dropped).toBeNull();
  });

  it('claps a new best or a long act, and gasps at a short one', () => {
    const short = newAct(0, true);
    expect(applause({ act: short, best: 5, record: false })).toBe(false);
    expect(applause({ act: short, best: 0, record: true })).toBe(true);
    short.catches = 12;
    expect(applause({ act: short, best: 50, record: false })).toBe(true);
  });
});

describe('advance', () => {
  const press = (x: number, y: number) => ({ x, y, down: true, presses: 1 });

  it('juggles on its own until a tap starts a visitor’s act', () => {
    let ring = newRing(0);
    for (let time = 0; time < 30_000; time += 16) ring = advance(ring, time, undefined, 100);
    expect(ring.act.dropped).toBeNull();
    // After a long time away it picks the baubles up again rather than ending.
    ring = advance(ring, 90_000, undefined, 100);
    expect(ring.act.visitor).toBe(false);
    ring = advance(ring, 90_016, press(50, 50), 100);
    expect(ring.act.visitor).toBe(true);
    expect(ring.act.catches).toBe(0);
  });

  it('catches with a tap in the square’s own pixels', () => {
    let ring = newRing(0);
    ring = advance(ring, 0, press(10, 10), 200);
    const toss = ring.act.balls.at(0);
    if (!toss) throw new Error('no bauble');
    const time = when(toss, 0.8);
    const p = baubleAt(toss, time);
    ring = advance(ring, time, press(p.x * 2, p.y * 2), 200);
    expect(ring.act.catches).toBe(1);
  });

  it('keeps the best, waits on the card before a tap goes again, and returns to the show when left', () => {
    let ring = advance(newRing(0), 0, press(50, 50), 100);
    ring.act.score = 7;
    ring = advance(ring, 20_000, undefined, 100);
    const dropped = ring.act.dropped ?? NaN;
    expect(ring.best).toBe(7);
    expect(ring.record).toBe(true);
    ring = advance(ring, dropped + CARD / 2, press(50, 50), 100);
    expect(ring.act.dropped).toBe(dropped);
    ring = advance(ring, dropped + CARD, press(50, 50), 100);
    expect(ring.act.visitor).toBe(true);
    expect(ring.act.dropped).toBeNull();
    expect(ring.record).toBe(false);
    ring = advance(ring, dropped + CARD + 20_000, undefined, 100);
    ring = advance(ring, dropped + CARD + 20_000 + IDLE + 1, undefined, 100);
    expect(ring.act.visitor).toBe(false);
    expect(ring.best).toBe(7);
  });
});
