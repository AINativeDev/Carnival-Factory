import { describe, expect, it } from 'vitest';
import { RIDE_LEVEL } from '../test-support/ride-fixtures';
import { levelWorld } from './level';
import {
  carAt,
  pieceUnder,
  rideFor,
  rideOn,
  standAt,
  startRide,
  stationAt,
  waiting,
  type Ride,
} from './ride';
import type { Thing } from './world';

const world = levelWorld(RIDE_LEVEL);
/** The test level's world is centred on (0, 0): its tile (x, y) is (x - 5, y - 5). */
const at = (x: number, y: number) => ({ x: x - 5, y: y - 5 });

/** The ride on the test level, which the tests fail without. */
function ride(): Ride {
  const started = startRide(world.things);
  if (!started) throw new Error('the test level has no ride');
  return started;
}

/** Rides on in frames of a tenth of a second until the car stands at a station again. */
function rideToNext(from: Ride): Ride {
  let now = rideOn(from);
  for (let n = 0; n < 1000 && !waiting(now); n++) now = rideFor(now, 100);
  return now;
}

describe('a ride', () => {
  it('starts standing at the first station, the boarding station by the sleigh home', () => {
    const start = ride();
    expect(start).toMatchObject({ stop: 0, ahead: 0, at: 200, stops: [200, 3020, 8420] });
    expect(start.lap).toBe(11_820);
    expect(start.track).toHaveLength(24);
    expect(waiting(start)).toBe(true);
    expect(carAt(start)).toEqual(at(3, 7));
  });

  it('has no ride without a station, nor without track', () => {
    const plain = world.things.map((thing): Thing =>
      thing.kind === 'coaster-station' ? { ...thing, kind: 'coaster' } : thing,
    );
    expect(startRide(plain)).toBeUndefined();
    expect(startRide([])).toBeUndefined();
  });

  it('stands still at a station until it is asked to ride on', () => {
    const start = ride();
    expect(rideFor(start, 5000)).toEqual(start);
  });

  it('rides on to the next station and stops there, however long the frames', () => {
    const leaving = rideOn(ride());
    expect(leaving).toMatchObject({ stop: 1, at: 200, ahead: 2820 });
    expect(waiting(leaving)).toBe(false);
    const halfway = rideFor(leaving, 1000);
    expect(halfway.at).toBe(1200);
    expect(waiting(halfway)).toBe(false);
    const there = rideFor(halfway, 60_000);
    expect(there).toMatchObject({ stop: 1, at: 3020, ahead: 0 });
    expect(carAt(there)).toEqual(at(3, 2));
    expect(rideFor(leaving, -50)).toEqual(leaving);
  });

  it('comes round from the last station to the first, over the end of the lap', () => {
    const last = standAt(ride(), 2);
    const home = rideToNext(last);
    expect(home).toMatchObject({ stop: 0, at: 200, ahead: 0 });
    expect(carAt(home)).toEqual(at(3, 7));
  });

  it('jumps straight to the next station for anyone who would rather nothing moved', () => {
    expect(rideOn(ride(), true)).toMatchObject({ stop: 1, at: 3020, ahead: 0 });
  });

  it('stays put on a ride with no stations to go to', () => {
    const nowhere = { ...ride(), stops: [] };
    expect(rideOn(nowhere)).toEqual(nowhere);
  });

  it('rides a whole lap round to a lone station', () => {
    const lone = { ...ride(), stops: [200] };
    expect(rideOn(lone)).toMatchObject({ stop: 0, ahead: 11_820 });
  });

  it('stands the car at any station, and leaves it be for one that is not there', () => {
    expect(standAt(ride(), 2)).toMatchObject({ stop: 2, at: 8420, ahead: 0 });
    expect(standAt(ride(), 7)).toEqual(ride());
  });

  it('knows the piece the car is on, and where along it the car is', () => {
    const climbing = rideFor(rideOn(ride()), 650);
    expect(pieceUnder(climbing)).toMatchObject({ kind: 'coaster-lift', ...at(3, 6) });
    // Halfway over the lift hill's tile, then three quarters, on the way up to the next.
    expect(carAt(climbing)).toEqual(at(3, 6));
    expect(carAt(rideFor(rideOn(ride()), 875))).toEqual(at(3, 5.75));
    expect(carAt(rideFor(rideOn(ride()), 425))).toEqual(at(3, 6.25));
    expect(carAt({ ...ride(), track: [] })).toEqual({ x: 0, y: 0 });
  });

  it('finds the station on a door, or none', () => {
    expect(stationAt(ride(), at(8, 5))).toBe(2);
    expect(stationAt(ride(), at(3, 3))).toBeUndefined();
  });
});
