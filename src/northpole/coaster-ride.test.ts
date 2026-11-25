import { describe, expect, it } from 'vitest';
import {
  LOOP_TIME,
  LOOP_SIZE,
  RAIL,
  STRAIGHT_TIME,
  railAt,
  rideCoaster,
  rideProblems,
  ticketAt,
} from './coaster-ride';
import type { LevelProp } from './level';
import { toScreen, type Thing } from './world';

const piece = (kind: 'coaster' | 'coaster-loop', x: number, y: number): Thing => ({
  kind,
  x,
  y,
  w: 1,
  h: 1,
  seed: 0,
  blocks: kind === 'coaster-loop',
});

/** A short ride east: on at (0, 0), round a loop at (1, 0), off at (2, 0), with a pine beside it. */
const ride = () =>
  rideCoaster([
    piece('coaster', 0, 0),
    { kind: 'tree', x: 5, y: 5, w: 1, h: 1, seed: 0.5, blocks: true },
    piece('coaster-loop', 1, 0),
    piece('coaster', 2, 0),
  ]);

/** The ride's `n`th thing, which the test fails without. */
const nth = (things: Thing[], n: number): Thing => {
  const thing = things.at(n);
  if (!thing) throw new Error(`no thing ${String(n)}`);
  return thing;
};

describe('a coaster ride', () => {
  it('times each piece in the order the level lists it, and leaves the rest alone', () => {
    const things = ride();
    const [on, pine, loop, off] = [0, 1, 2, 3].map((n) => nth(things, n).ride);
    const whole = STRAIGHT_TIME * 2 + LOOP_TIME;
    expect(on).toEqual({
      enter: { x: -0.5, y: 0 },
      leave: { x: 0.5, y: 0 },
      from: 0,
      to: STRAIGHT_TIME,
      ride: whole,
    });
    expect(pine).toBeUndefined();
    expect(loop).toMatchObject({ from: STRAIGHT_TIME, to: STRAIGHT_TIME + LOOP_TIME });
    expect(off).toMatchObject({ enter: { x: 1.5, y: 0 }, leave: { x: 2.5, y: 0 } });
  });

  it('carries the ticket on only the piece it is riding', () => {
    const pieces = ride().filter((thing) => thing.ride);
    for (const time of [100, 1000, 2400, 2700]) {
      const riding = pieces.filter((thing) => ticketAt(thing, time));
      expect(riding).toHaveLength(1);
    }
  });

  it('runs the ticket along a straight, level on the rail', () => {
    const on = nth(ride(), 0);
    const ticket = ticketAt(on, STRAIGHT_TIME / 4);
    const halfway = toScreen({ x: -0.25, y: 0 });
    expect(ticket?.x).toBeCloseTo(halfway.x);
    expect(ticket?.y).toBeCloseTo(halfway.y - RAIL);
    expect(ticket?.angle).toBeCloseTo(Math.atan2(16, 32));
    expect(ticketAt(on, STRAIGHT_TIME * 3)).toBeUndefined();
  });

  it('turns the ticket upside down at the top of a loop', () => {
    const loop = nth(ride(), 2);
    const top = ticketAt(loop, STRAIGHT_TIME + LOOP_TIME / 2);
    const centre = railAt(loop);
    expect(top?.x).toBeCloseTo(centre.x);
    expect(top?.y).toBeCloseTo(centre.y - LOOP_SIZE * 2);
    expect(Math.abs(top?.angle ?? 0)).toBeGreaterThan(Math.PI / 2);
    // On and off the loop by the rail either side of it, half a tile from its foot.
    for (const time of [STRAIGHT_TIME + 10, STRAIGHT_TIME + LOOP_TIME - 10])
      expect(Math.abs((ticketAt(loop, time)?.y ?? 0) - centre.y)).toBeLessThan(9);
  });

  it('rides a piece on its own as a ride of one, east to west', () => {
    const lone = piece('coaster-loop', 3, 3);
    expect(ticketAt(lone, 0)).toBeDefined();
    expect(ticketAt(lone, LOOP_TIME + 1)).toBeDefined();
  });

  it('copes with a ride doubling back on itself', () => {
    const there = nth(
      rideCoaster([piece('coaster', 0, 0), piece('coaster-loop', 1, 0), piece('coaster', 0, 0)]),
      1,
    );
    const ticket = ticketAt(there, STRAIGHT_TIME + LOOP_TIME / 4);
    expect(Number.isFinite(ticket?.x)).toBe(true);
  });
});

describe('the rules of a coaster', () => {
  const prop = (kind: LevelProp['kind'], x: number, y: number): LevelProp => ({ kind, x, y });

  it('passes a ride whose pieces join, with its loops on straight runs', () => {
    expect(
      rideProblems([
        prop('coaster', 0, 0),
        prop('pine', 9, 9),
        prop('coaster-loop', 0, 1),
        prop('coaster', 0, 2),
        prop('coaster', 1, 2),
      ]),
    ).toEqual([]);
    expect(rideProblems([])).toEqual([]);
  });

  it("finds a piece that doesn't join the one before it, and a loop on a corner", () => {
    expect(
      rideProblems([
        prop('coaster', 0, 0),
        prop('coaster', 2, 0),
        prop('coaster-loop', 3, 0),
        prop('coaster', 3, 1),
      ]),
    ).toEqual([
      "prop 1, a coaster, doesn't join prop 0, the coaster piece before it",
      'prop 2, a coaster-loop, must stand on a straight run of track',
    ]);
  });
});
