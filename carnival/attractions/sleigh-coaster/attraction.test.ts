import { describe, expect, it } from 'vitest';
import { CHEERS, handsUp, launch, rideTime, riding, WAITING } from './ride';
import { RIDE, ridePoint, sleighAt, sleighPose, trackY } from './track';

describe('trackY', () => {
  it('is highest at the top of the hill, in the middle', () => {
    for (const x of [0, 16, 30, 70, 84, 100]) expect(trackY(50)).toBeLessThan(trackY(x));
  });

  it('stays inside the attraction', () => {
    for (let x = 0; x <= 100; x++) {
      expect(trackY(x)).toBeGreaterThan(20);
      expect(trackY(x)).toBeLessThan(90);
    }
  });
});

describe('sleighAt', () => {
  it('rides the track from one edge to the other', () => {
    expect(sleighAt(0).x).toBe(0);
    expect(sleighAt(RIDE / 2).x).toBeCloseTo(50);
    expect(sleighAt(RIDE - 1).x).toBeCloseTo(100, 0);
    const { x, y } = sleighAt(RIDE / 3);
    expect(y).toBeCloseTo(trackY(x));
  });

  it('only ever goes forwards', () => {
    let last = -1;
    for (let time = 0; time < RIDE; time += 50) {
      const { x } = sleighAt(time);
      expect(x).toBeGreaterThanOrEqual(last);
      last = x;
    }
  });

  it('climbs the hill and tips down the other side', () => {
    expect(sleighAt(RIDE * 0.4).angle).toBeLessThan(0);
    expect(sleighAt(RIDE * 0.6).angle).toBeGreaterThan(0);
  });
});

describe('ridePoint', () => {
  it('runs the track left to right across the slab, and up over the hill', () => {
    expect(ridePoint(0, 0).x).toBeLessThan(ridePoint(100, 0).x);
    expect(ridePoint(50, 0).y).toBeLessThan(ridePoint(0, 0).y);
    expect(ridePoint(50, 0).y).toBeLessThan(ridePoint(100, 0).y);
  });

  it('never drops below the ground', () => {
    expect(ridePoint(50, 0, 1000)).toEqual(ridePoint(50, 0, 60));
    expect(ridePoint(50, 0, 1000).y).toBeGreaterThan(ridePoint(50, 0, 10).y);
  });

  it('stays inside the square', () => {
    for (let x = 0; x <= 100; x++) {
      for (const across of [-6, 6]) {
        const p = ridePoint(x, across);
        expect(p.x).toBeGreaterThan(0);
        expect(p.x).toBeLessThan(100);
        expect(p.y).toBeGreaterThan(0);
        expect(p.y).toBeLessThan(100);
      }
    }
  });
});

describe('sleighPose', () => {
  it('sits on the near rail where the sleigh is', () => {
    const time = RIDE / 3;
    const pose = sleighPose(time, 3);
    const p = ridePoint(sleighAt(time).x, 3);
    expect(pose.x).toBeCloseTo(p.x);
    expect(pose.y).toBeCloseTo(p.y);
  });

  it('tilts up the hill and down the other side, as the track does', () => {
    expect(sleighPose(RIDE * 0.4, 3).angle).toBeLessThan(0);
    expect(sleighPose(RIDE * 0.6, 3).angle).toBeGreaterThan(0);
  });
});

describe('launch', () => {
  it('waits at the station until a tap launches it, and fills the cheer meter one more', () => {
    expect(riding(WAITING, 1_000)).toBe(false);
    expect(launch(WAITING, 1_000, 0)).toBe(WAITING);
    const ride = launch(WAITING, 1_000, 1);
    expect(ride).toEqual({ launchedAt: 1_000, cheers: 1 });
    expect(riding(ride, 1_000 + RIDE / 2)).toBe(true);
    expect(riding(ride, 1_000 + RIDE)).toBe(false);
  });

  it('ignores taps while the sleigh is out on the track', () => {
    const ride = launch(WAITING, 1_000, 1);
    expect(launch(ride, 2_000, 3)).toBe(ride);
    expect(launch(ride, 1_000 + RIDE, 1)).toEqual({ launchedAt: 1_000 + RIDE, cheers: 2 });
  });

  it('starts the meter again from one once it is full', () => {
    let ride = WAITING;
    for (let n = 0; n < CHEERS; n++) ride = launch(ride, n * RIDE, 1);
    expect(ride.cheers).toBe(CHEERS);
    expect(launch(ride, CHEERS * RIDE, 1).cheers).toBe(1);
  });
});

describe('rideTime', () => {
  it('keeps the sleigh at the station before and after a ride', () => {
    const ride = launch(WAITING, 10_000, 1);
    expect(rideTime(WAITING, 500)).toBe(0);
    expect(rideTime(ride, 9_000)).toBe(0);
    expect(rideTime(ride, 12_000)).toBe(2_000);
    expect(rideTime(ride, 10_000 + RIDE)).toBe(0);
    expect(sleighAt(rideTime(ride, 9_000)).x).toBe(0);
  });
});

describe('handsUp', () => {
  const ride = launch(WAITING, 0, 1);

  it('puts the riders’ hands up on the drop, and only there', () => {
    expect(handsUp(ride, RIDE * 0.62)).toBe(true);
    expect(handsUp(ride, RIDE * 0.4)).toBe(false);
    expect(handsUp(ride, RIDE * 0.05)).toBe(false);
    expect(handsUp(WAITING, RIDE * 0.62)).toBe(false);
  });
});
