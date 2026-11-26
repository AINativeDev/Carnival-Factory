import { describe, expect, it } from 'vitest';
import { advance, autopilotTarget, newRun, restart, speedAt, type Run } from './game';

/** Runs the van with a steering rule for `seconds`, in 30 ms steps. */
function drive(run: Run, seconds: number, steer: (state: Run) => number): Run {
  let state = run;
  for (let t = 0; t < seconds; t += 0.03) state = advance(state, 0.03, steer(state));
  return state;
}

describe('speedAt', () => {
  it('builds slowly through a run and tops out', () => {
    expect(speedAt(0)).toBeLessThan(speedAt(30));
    expect(speedAt(1000)).toBe(speedAt(2000));
  });
});

describe('advance', () => {
  it('follows the steering with a little drift, and stays on the road', () => {
    const run = advance(newRun(0), 0.03, 5);
    expect(run.van.x).toBeGreaterThan(0);
    expect(run.van.slide).toBeGreaterThan(0);
    const far = drive(newRun(0), 3, () => 5);
    expect(far.van.x).toBeLessThanOrEqual(0.85);
  });

  it('crashes into traffic that is in the way, softly and for good', () => {
    const run = newRun(1);
    run.traffic.push({ kind: 'bus', x: 0, z: 1 });
    const hit = advance(run, 0.03, 0);
    expect(hit.crashed).toBe(true);
    const later = drive(hit, 2, () => 0);
    expect(later.crashed).toBe(true);
    expect(later.van.speed).toBeLessThan(hit.van.speed);
  });

  it('lets traffic in another lane go by', () => {
    const run = newRun(1);
    run.traffic.push({ kind: 'sleigh', x: 0.8, z: 1 });
    expect(advance(run, 0.03, 0).crashed).toBe(false);
  });

  it('collects a parcel for points and best remembers the run', () => {
    const run = newRun(1);
    run.parcels.push({ x: 0, z: 0.5 });
    const got = advance(run, 0.03, 0);
    expect(got.score).toBeGreaterThan(0);
    expect(got.parcels).toHaveLength(0);
    expect(got.sparks.length).toBeGreaterThan(0);
    expect(got.best).toBe(got.score);
  });

  it('spawns traffic and parcels as it goes, and drops what has gone by', () => {
    const run = drive(newRun(2), 20, (state) => autopilotTarget(state));
    expect(run.traffic.every((car) => car.z > -10)).toBe(true);
    expect(run.spawned).toBeGreaterThan(3);
  });

  it('leaves tyre trails when it slides', () => {
    expect(drive(newRun(0), 1, () => 5).trails.length).toBeGreaterThan(0);
  });
});

describe('autopilotTarget', () => {
  it('steers round traffic ahead and for a parcel', () => {
    const run = newRun(3);
    run.traffic.push({ kind: 'plough', x: 0, z: 25 });
    expect(Math.abs(autopilotTarget(run))).toBeGreaterThan(0.2);
    const free = newRun(3);
    free.parcels.push({ x: 0.5, z: 20 });
    expect(autopilotTarget(free)).toBeGreaterThan(0.2);
  });

  it('plays a long time without crashing', () => {
    for (const seed of [1, 2, 3]) {
      const run = drive(newRun(seed), 60, (state) => autopilotTarget(state));
      expect(run.crashed).toBe(false);
      expect(run.score).toBeGreaterThan(0);
    }
  });
});

describe('restart', () => {
  it('starts a fresh run and keeps the best', () => {
    const run = newRun(1);
    run.traffic.push({ kind: 'bus', x: 0, z: 1 });
    run.score = 40;
    const fresh = restart(advance(run, 0.03, 0), 9);
    expect(fresh.crashed).toBe(false);
    expect(fresh.score).toBe(0);
    expect(fresh.best).toBeGreaterThanOrEqual(40);
  });
});
