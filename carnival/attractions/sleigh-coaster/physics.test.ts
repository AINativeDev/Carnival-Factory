import { describe, expect, it } from 'vitest';
import {
  AT_STATION,
  crestReading,
  heightOf,
  PUSH,
  speedOf,
  step,
  STEP,
  type Sleigh,
} from './physics';
import { G, HILLS, heightAt } from './track';

const hill = HILLS[0] ?? { start: 24, crest: 50, height: 13, lift: 17, crash: 30 };
const bump = HILLS.find((h) => h.bump) ?? hill;

/** The sleigh after `seconds` of steps, pushed or not. */
function ride(from: Sleigh, seconds: number, pushing = false): Sleigh {
  let sleigh = from;
  for (let n = 0; n < seconds / STEP; n++) sleigh = step(sleigh, pushing);
  return sleigh;
}

/** A sleigh on the rail just short of `crest` at `speed`, its earlier crests behind it. */
function atCrest(crest: { crest: number }, speed: number): Sleigh {
  const next = HILLS.findIndex((h) => h.crest >= crest.crest);
  return { x: crest.crest - 0.01, speed, air: null, next, off: false };
}

describe('the sleigh on the rail', () => {
  it('waits at the station until it’s pushed, and never rolls back out of it', () => {
    expect(ride(AT_STATION, 1)).toEqual(AT_STATION);
    expect(ride({ ...AT_STATION, speed: -5 }, 0.5).x).toBe(0);
  });

  it('speeds up while it’s pushed on the flat, and slows a little in the snow when it coasts', () => {
    const pushed = ride(AT_STATION, 0.5, true);
    expect(pushed.speed).toBeGreaterThan(PUSH * 0.45);
    expect(pushed.x).toBeGreaterThan(0);
    const coasting = { ...AT_STATION, x: 1, speed: 10 };
    expect(ride(coasting, 0.2).speed).toBeLessThan(10);
  });

  it('slows on a climb and rolls back without the speed to get over', () => {
    const climbing = { ...AT_STATION, x: hill.start, speed: 12 };
    const later = ride(climbing, 3);
    expect(later.x).toBeLessThan(hill.crest);
    expect(later.next).toBe(0);
  });

  it('gets over with the speed, and goes faster down the other side', () => {
    const fast = Math.sqrt(2 * G * hill.height + 12 ** 2);
    const over = ride({ ...AT_STATION, x: hill.start, speed: fast }, 4);
    expect(over.x).toBeGreaterThan(hill.crest);
    expect(over.next).toBeGreaterThan(0);
    expect(over.off).toBe(false);
  });
});

describe('over a crest', () => {
  it('stays on the rail below the lift-off speed', () => {
    const sleigh = step(atCrest(hill, hill.lift * 0.9), false);
    expect(sleigh.air).toBeNull();
    expect(sleigh.off).toBe(false);
  });

  it('lifts off above it, flies in an arc and lands back on the rail going on', () => {
    let sleigh = step(atCrest(hill, (hill.lift + hill.crash) / 2), false);
    expect(sleigh.air).not.toBeNull();
    expect(sleigh.off).toBe(false);
    let highest = 0;
    while (sleigh.air) {
      sleigh = step(sleigh, true);
      highest = Math.max(highest, heightOf(sleigh) - heightAt(sleigh.x));
    }
    expect(highest).toBeGreaterThan(1);
    expect(sleigh.speed).toBeGreaterThan(0);
    expect(heightOf(sleigh)).toBe(heightAt(sleigh.x));
  });

  it('flies off the rails above its crash speed, and keeps flying past the rail', () => {
    let sleigh = step(atCrest(hill, hill.crash + 1), false);
    expect(sleigh.off).toBe(true);
    sleigh = ride(sleigh, 2);
    expect(sleigh.air).not.toBeNull();
    expect(heightOf(sleigh)).toBeLessThan(heightAt(sleigh.x));
  });

  it('never throws it off a bump, however fast', () => {
    const sleigh = step(atCrest(bump, 60), false);
    expect(sleigh.off).toBe(false);
    expect(sleigh.air).not.toBeNull();
  });

  it('counts how fast it’s going in the air, whichever way', () => {
    const flying: Sleigh = { ...AT_STATION, air: { y: 5, vx: 3, vy: -4 } };
    expect(speedOf(flying)).toBe(5);
    expect(heightOf(flying)).toBe(5);
    expect(speedOf({ ...AT_STATION, speed: -2 })).toBe(2);
  });
});

describe('the gauge’s reading', () => {
  it('says how fast the sleigh will cross the next crest if it coasts from here', () => {
    const sleigh = { ...AT_STATION, x: 5, speed: 30 };
    const reading = crestReading(sleigh);
    expect(reading.over).toBeCloseTo(Math.sqrt(30 ** 2 - 2 * G * hill.height));
    expect(reading.lift).toBe(hill.lift);
    expect(reading.crash).toBe(hill.crash);
  });

  it('reads below nothing when it won’t get over', () => {
    expect(crestReading(AT_STATION).over).toBeCloseTo(-Math.sqrt(2 * G * hill.height));
  });

  it('reads just the speed past the end of the course', () => {
    const reading = crestReading({ ...AT_STATION, x: 1e9, speed: 7 });
    expect(reading).toEqual({ over: 7, lift: Infinity, crash: Infinity });
  });
});
