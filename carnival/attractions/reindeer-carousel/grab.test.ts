import { describe, expect, it } from 'vitest';
import { armRing } from './arm';
import {
  advance,
  CENTRE,
  GUARD,
  IDLE,
  isGold,
  MISSES,
  nearness,
  newGrab,
  offered,
  paceFor,
  passOf,
  START_PACE,
  WINDOW,
  type Grab,
} from './grab';
import { paceOf, PACE, turnOf } from './ride';

/** The first time from `from` at which your reindeer is at the middle of the window. */
function nextCentre(grab: Grab, from: number): number {
  let time = from;
  let now = grab;
  for (; time < from + 30_000; time += 5) {
    now = advance(now, time);
    const { into } = passOf(turnOf(now.ride, time));
    if (Math.abs(into - WINDOW) < 0.02) return time;
  }
  return time;
}

/** Plays on to `time` a frame at a time, and taps there. */
function tapAt(grab: Grab, from: number, time: number): Grab {
  let now = grab;
  for (let t = from; t < time; t += 16) now = advance(now, t);
  return advance(now, time, 1);
}

describe('where your reindeer is', () => {
  it('is in reach of the ring through the window, then out of it', () => {
    expect(passOf(CENTRE).inReach).toBe(true);
    expect(passOf(CENTRE - WINDOW + 0.01).inReach).toBe(true);
    expect(passOf(CENTRE + WINDOW + 0.01).inReach).toBe(false);
    expect(passOf(CENTRE + Math.PI * 2).pass).toBe(passOf(CENTRE).pass + 1);
  });

  it('is nearest at the window’s middle, and far off across the ride', () => {
    expect(nearness(CENTRE)).toBeCloseTo(1);
    expect(nearness(CENTRE + Math.PI)).toBe(0);
    expect(nearness(CENTRE - WINDOW * 1.5)).toBeCloseTo(0.5);
  });

  it('is offered this pass’s ring in the window, then the next one', () => {
    expect(offered(CENTRE)).toBe(passOf(CENTRE).pass);
    expect(offered(CENTRE + 1)).toBe(passOf(CENTRE).pass + 1);
  });
});

describe('a ride', () => {
  it('starts with a tap on the demo, and speeds up with every ring', () => {
    const ride = advance(newGrab(0, 'demo', 0), 10, 1);
    expect(ride.mode).toBe('play');
    expect(paceFor(0)).toBe(START_PACE);
    expect(paceFor(5)).toBeGreaterThan(paceFor(4));
  });

  it('grabs the ring in reach: silver is 1, gold is 5, and it’s gone till the next pass', () => {
    let ride = advance(newGrab(0, 'demo', 0), 0, 1);
    const at = nextCentre(ride, 16);
    ride = tapAt(ride, 16, at);
    const { pass } = passOf(turnOf(ride.ride, at));
    expect(ride.caught).toBe(1);
    expect(ride.rings).toBe(isGold(ride.seed, pass) ? 5 : 1);
    expect(ride.moments.at(-1)?.worth).toBe(ride.rings);
    const again = advance(ride, at + 10, 1);
    expect(again.misses).toBe(1);
    expect(again.moments.at(-1)?.worth).toBe(0);
    expect(armRing(ride, turnOf(ride.ride, at)).shown).toBe(0);
  });

  it('gives about one gold ring in six passes', () => {
    const golds = Array.from({ length: 600 }, (_, pass) => isGold(42, pass)).filter(Boolean);
    expect(golds.length).toBeGreaterThan(60);
    expect(golds.length).toBeLessThan(150);
  });

  it('ends after three misses, keeps the best, and waits before the next ride', () => {
    let ride = { ...advance(newGrab(0, 'demo', 7), 0, 1), rings: 9 };
    const away = nextCentre(ride, 16) + 2_000;
    for (let n = 0; n < MISSES; n++) ride = advance(ride, away + n, 1);
    expect(ride.mode).toBe('over');
    expect(ride.best).toBe(9);
    const at = ride.overAt ?? 0;
    expect(advance(ride, at + GUARD / 2, 1).mode).toBe('over');
    const next = advance(ride, at + GUARD, 1);
    expect(next.mode).toBe('play');
    expect(next.rings).toBe(0);
    expect(next.best).toBe(9);
  });

  it('eases off once over, and goes back to the demo when left alone', () => {
    const ride = advance(newGrab(0, 'demo', 0), 0, 1);
    expect(paceOf(advance(ride, 3_000).ride)).toBeGreaterThan(1.5);
    expect(advance(ride, IDLE + 10).mode).toBe('demo');
    const over: Grab = { ...ride, mode: 'over', overAt: 100, ride: { ...ride.ride, boost: PACE } };
    expect(paceOf(advance(over, 20_000).ride)).toBeLessThan(1.1);
  });
});

describe('the demo', () => {
  it('grabs every ring itself, once a pass, at its own pace', () => {
    let demo = newGrab(0, 'demo', 0);
    for (let time = 0; time < 30_000; time += 16) demo = advance(demo, time);
    expect(demo.caught).toBe(3);
    expect(demo.mode).toBe('demo');
    expect(paceOf(demo.ride)).toBe(1);
  });
});

describe('the ring on the arm', () => {
  it('fades a ring left on the arm after the window, then slides the next one out', () => {
    const grab = newGrab(0, 'play', 0);
    const start = CENTRE - WINDOW;
    expect(armRing(grab, start + WINDOW)).toEqual({ pass: 0, along: 0, shown: 1 });
    expect(armRing(grab, start + WINDOW * 2 + 0.15).shown).toBeCloseTo(0.5);
    expect(armRing(grab, start + WINDOW * 2 + 0.31).along).toBeGreaterThan(0.9);
    expect(armRing(grab, start + WINDOW * 2 + 1).along).toBe(0);
    const taken = { ...grab, taken: 0 };
    expect(armRing(taken, start + WINDOW * 2 + 0.1).shown).toBe(0);
  });
});
