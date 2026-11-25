import { describe, expect, it } from 'vitest';
import { figureEight } from './attraction';
import {
  FADE,
  ICE,
  SPARKLE,
  SPEED,
  SPIN,
  TRAIL,
  onIce,
  rest,
  skate,
  sparkle,
  spinning,
  startRink,
  turnBetween,
  type Rink,
} from './skate';

/** Skates the rink after `path` for `ms`, a frame every 16 ms, from `start`. */
function skateAlong(
  rink: Rink,
  path: (time: number) => { x: number; y: number },
  ms: number,
  start = 0,
) {
  let now = rink;
  for (let time = start; time <= start + ms; time += 16) now = skate(now, path(time), time, 0);
  return now;
}

/** A figure eight on the ice, one lap every eight seconds. */
const eight = (time: number) => {
  const { x, y } = figureEight(time / 8_000);
  return { x: ICE.x + x * 25, y: ICE.y + y * 22 };
};

/** A circle round the middle of the ice, one way only. */
const circle = (time: number) => ({
  x: ICE.x + Math.cos(time / 600) * 15,
  y: ICE.y + Math.sin(time / 600) * 8,
});

describe('onIce', () => {
  it('keeps a point on the ice where it is', () => {
    expect(onIce(ICE.x + 5, ICE.y - 2)).toEqual({ x: ICE.x + 5, y: ICE.y - 2 });
  });

  it('brings a point off the ice to its edge', () => {
    expect(onIce(100, ICE.y)).toEqual({ x: ICE.x + ICE.across, y: ICE.y });
    expect(onIce(ICE.x, 0).y).toBeCloseTo(ICE.y - ICE.down);
  });
});

describe('turnBetween', () => {
  it('turns the short way round', () => {
    expect(turnBetween(0, 0.5)).toBeCloseTo(0.5);
    expect(turnBetween(3, -3)).toBeCloseTo(2 * Math.PI - 6);
    expect(turnBetween(-3, 3)).toBeCloseTo(6 - 2 * Math.PI);
  });
});

describe('skate', () => {
  it('glides toward the pointer no faster than its speed', () => {
    const start = skate(startRink(), { x: ICE.x, y: ICE.y }, 1_000, 0);
    const later = skate(start, { x: ICE.x + 20, y: ICE.y }, 1_050, 0);
    expect(later.x - ICE.x).toBeCloseTo((SPEED * 50) / 1000);
    expect(later.y).toBeCloseTo(ICE.y);
  });

  it('stops on the pointer, and never leaves the ice', () => {
    const there = skateAlong(startRink(), () => ({ x: ICE.x + 4, y: ICE.y + 1 }), 1_000);
    expect(there.x).toBeCloseTo(ICE.x + 4);
    expect(there.y).toBeCloseTo(ICE.y + 1);
    const edge = skateAlong(startRink(), () => ({ x: 0, y: 0 }), 5_000);
    const reach = Math.hypot((edge.x - ICE.x) / ICE.across, (edge.y - ICE.y) / ICE.down);
    expect(reach).toBeCloseTo(1);
  });

  it("doesn't jump after a long frame", () => {
    const start = skate(startRink(), { x: ICE.x, y: ICE.y }, 0, 0);
    const later = skate(start, { x: ICE.x + 20, y: ICE.y }, 60_000, 0);
    expect(later.x - ICE.x).toBeCloseTo(SPEED / 10);
  });

  it('carves a trail that fades from the ice', () => {
    const carved = skateAlong(startRink(), circle, 3_000);
    expect(carved.trail.length).toBeGreaterThan(10);
    const resting = skateAlong(carved, () => ({ x: carved.x, y: carved.y }), FADE, 3_016);
    expect(resting.trail.length).toBeLessThanOrEqual(1);
  });

  it('keeps its trail short', () => {
    expect(skateAlong(startRink(), circle, 20_000).trail.length).toBeLessThanOrEqual(TRAIL);
  });

  it('keeps every line at full speed until it has faded', () => {
    const across = (time: number) => ({ x: Math.floor(time / 1_500) % 2 ? 0 : 100, y: ICE.y });
    const carved = skateAlong(startRink(), across, 10_000);
    const oldest = carved.trail.at(0)?.at ?? Infinity;
    expect(10_000 - oldest).toBeGreaterThan(FADE - 100);
  });
});

describe('spinning', () => {
  it('spins on the spot, then glides on', () => {
    const start = skate(startRink(), { x: ICE.x, y: ICE.y }, 0, 0);
    const far = { x: ICE.x + 20, y: ICE.y };
    const tapped = skate(start, far, 16, 1);
    const spun = skateAlong(tapped, () => far, SPIN - 50, 32);
    expect(spun.x).toBe(ICE.x);
    expect(skate(spun, far, SPIN + 66, 0).x).toBeGreaterThan(ICE.x);
  });

  it('spins for a while after a tap', () => {
    const tapped = skate(startRink(), { x: ICE.x, y: ICE.y }, 500, 1);
    expect(spinning(tapped, 500)).toBe(0);
    expect(spinning(tapped, 500 + SPIN / 2)).toBeCloseTo(0.5);
    expect(spinning(tapped, 500 + SPIN)).toBeUndefined();
    expect(spinning(startRink(), 500)).toBeUndefined();
  });
});

describe('sparkle', () => {
  it('sparkles for a figure eight', () => {
    const skated = skateAlong(startRink(), eight, 9_000);
    expect(skated.sparkledAt).toBeGreaterThan(0);
    expect(sparkle(skated, skated.sparkledAt)).toBe(1);
    expect(sparkle(skated, skated.sparkledAt + SPARKLE / 4)).toBeCloseTo(0.75);
    expect(sparkle(skated, skated.sparkledAt + SPARKLE)).toBe(0);
  });

  it("doesn't sparkle for going round and round one way", () => {
    const skated = skateAlong(startRink(), circle, 20_000);
    expect(skated.sparkledAt).toBe(-Infinity);
    expect(sparkle(skated, 20_000)).toBe(0);
  });
});

describe('rest', () => {
  const lane = { x: ICE.x + 10, y: ICE.y + 3 };

  it('stands on the lane, from time alone, until first steered', () => {
    expect(rest(startRink(), lane, 5_000)).toMatchObject(lane);
    expect(rest(rest(startRink(), eight(0), 0), lane, 5_000)).toMatchObject(lane);
  });

  it('waits where it was left once steered, while its trail fades', () => {
    const steered = skateAlong(startRink(), circle, 2_000);
    const left = rest(steered, lane, 2_100);
    expect(left).toMatchObject({ x: steered.x, y: steered.y, then: 2_100 });
    expect(left.trail.length).toBeGreaterThan(0);
    expect(rest(steered, lane, 2_000 + FADE + 16).trail).toEqual([]);
  });

  it('never sparkles while nobody steers', () => {
    let rink = startRink();
    for (let time = 0; time <= 20_000; time += 16) rink = rest(rink, eight(time), time);
    expect(rink.sparkledAt).toBe(-Infinity);
    expect(rink.turn).toBe(0);
  });
});
