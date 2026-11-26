/**
 * North Pole Night Run's rules, as plain functions: the van's speed and its
 * slide on the ice, the traffic and parcels coming up the road, a crash, and
 * the autopilot that plays the stall's front when nobody is steering.
 * Distances are metres down the road and sideways positions run from -1 (the
 * left kerb) to 1 (the right); `z` is how far ahead of the van something is.
 */

/** What can come up the road. */
export type TrafficKind = 'sleigh' | 'plough' | 'van' | 'bus';
/** The traffic's mix, with sleighs twice as common as the rest. */
export const TRAFFIC_KINDS: readonly TrafficKind[] = ['sleigh', 'plough', 'van', 'bus', 'sleigh'];
/** How far from its middle a kind of traffic still hits the van. */
export function halfWidth(kind: TrafficKind): number {
  if (kind === 'plough') return 0.3;
  if (kind === 'bus') return 0.28;
  return kind === 'van' ? 0.22 : 0.2;
}

export interface Traffic {
  kind: TrafficKind;
  x: number;
  z: number;
}
export interface Parcel {
  x: number;
  z: number;
}
/** A tyre mark in the snow, and the distance run when it was left. */
export interface Trail {
  x: number;
  at: number;
}
/** A burst of sparkles where a parcel landed, and the run time it began. */
export interface Spark {
  at: number;
}
export interface Run {
  seed: number;
  /** Metres driven and seconds run since the run began. */
  dist: number;
  time: number;
  van: { x: number; vx: number; slide: number; speed: number };
  traffic: Traffic[];
  parcels: Parcel[];
  trails: Trail[];
  sparks: Spark[];
  score: number;
  best: number;
  crashed: boolean;
  /** Seconds since the crash, for the spin-out. */
  crashTime: number;
  spawned: number;
  nextSpawn: number;
}

/** How far ahead things appear, and how fast the road rushes at the start and at the top. */
export const SPAWN_Z = 150;
const START_SPEED = 14;
const TOP_SPEED = 34;
const ONCOMING = 5;
const SIDE_LIMIT = 0.85;
const VAN_HALF = 0.2;
const CRASH_LENGTH = 2.5;
const PARCEL_POINTS = 10;

/** The speed, in metres a second, a run has built up to after `seconds`. */
export function speedAt(seconds: number): number {
  return Math.min(TOP_SPEED, START_SPEED + seconds * 0.35);
}

/** A repeatable number from 0 to 1 for the `index`th thing of a run. */
export function chance(seed: number, index: number): number {
  const x = Math.sin(index * 12.9898 + seed * 78.233) * 43758.5453;
  return x - Math.floor(x);
}

/** A fresh run on the starting line, with the best of the visit so far. */
export function newRun(seed: number, best = 0): Run {
  return {
    seed,
    dist: 0,
    time: 0,
    van: { x: 0, vx: 0, slide: 0, speed: START_SPEED },
    traffic: [],
    parcels: [],
    trails: [],
    sparks: [],
    score: 0,
    best,
    crashed: false,
    crashTime: 0,
    spawned: 0,
    nextSpawn: 20,
  };
}

/** A new run after a crash, remembering the best. */
export function restart(run: Run, seed: number): Run {
  return newRun(seed, run.best);
}

/** Adds the next car, and sometimes a parcel after it, once the van has driven far enough. */
function spawn(run: Run): Run {
  if (run.dist < run.nextSpawn) return run;
  const n = run.spawned;
  const last = run.traffic.at(-1);
  const x = Math.max(-0.7, Math.min(0.7, (last?.x ?? 0) + (chance(run.seed, n) - 0.5) * 1.6));
  const pick = Math.floor(chance(run.seed, n + 500) * TRAFFIC_KINDS.length);
  const car: Traffic = { kind: TRAFFIC_KINDS[pick] ?? 'van', x, z: SPAWN_Z };
  const gift = chance(run.seed, n + 900) < 0.7;
  const parcel: Parcel = { x: (chance(run.seed, n + 300) - 0.5) * 1.5, z: SPAWN_Z + 14 };
  return {
    ...run,
    traffic: [...run.traffic, car],
    parcels: gift ? [...run.parcels, parcel] : run.parcels,
    spawned: n + 1,
    nextSpawn: run.nextSpawn + 30 + chance(run.seed, n + 700) * 20,
  };
}

/** The van's side-to-side movement: it eases towards `target`, so it slides before it straightens. */
function steered(van: Run['van'], dt: number, target: number): Run['van'] {
  const want = Math.max(-2.2, Math.min(2.2, (target - van.x) * 4));
  const vx = van.vx + (want - van.vx) * Math.min(1, dt * 6);
  const x = Math.max(-SIDE_LIMIT, Math.min(SIDE_LIMIT, van.x + vx * dt));
  const slide = van.slide + (vx * 0.3 * (van.speed / TOP_SPEED) - van.slide) * Math.min(1, dt * 4);
  return { ...van, x, vx: x === van.x ? 0 : vx, slide };
}

/** The run `dt` seconds on, with the van steering for sideways position `target`. */
export function advance(run: Run, dt: number, target: number): Run {
  if (run.crashed) {
    const van = { ...run.van, speed: run.van.speed * Math.max(0, 1 - dt * 2.5) };
    return { ...run, van, crashTime: run.crashTime + dt, dist: run.dist + van.speed * dt };
  }
  const time = run.time + dt;
  const van = { ...steered(run.van, dt, target), speed: speedAt(time) };
  const step = van.speed * dt;
  const closing = (van.speed + ONCOMING) * dt;
  const sliding = Math.abs(van.slide) > 0.05;
  const trails = [
    ...run.trails.filter((mark) => run.dist - mark.at < 12),
    ...(sliding ? [{ x: van.x, at: run.dist }] : []),
  ];
  const traffic = run.traffic
    .map((car) => ({ ...car, z: car.z - closing }))
    .filter((car) => car.z > -10);
  const hit = traffic.some(
    (car) =>
      Math.abs(car.z) < CRASH_LENGTH && Math.abs(car.x - van.x) < halfWidth(car.kind) + VAN_HALF,
  );
  const moved = run.parcels.map((parcel) => ({ ...parcel, z: parcel.z - closing }));
  const caught = (p: Parcel) => Math.abs(p.z) < 2 && Math.abs(p.x - van.x) < 0.3;
  const score = run.score + moved.filter(caught).length * PARCEL_POINTS;
  const sparks = [
    ...run.sparks.filter((burst) => time - burst.at < 0.7),
    ...moved.filter(caught).map(() => ({ at: time })),
  ];
  return spawn({
    ...run,
    time,
    van,
    dist: run.dist + step,
    traffic,
    trails,
    sparks,
    parcels: moved.filter((p) => !caught(p) && p.z > -10),
    score,
    best: Math.max(run.best, score),
    crashed: hit,
  });
}

/** Where the autopilot steers: the clear line through the traffic that picks up parcels. */
export function autopilotTarget(run: Run): number {
  let bestX = 0;
  let bestCost = Infinity;
  for (let x = -SIDE_LIMIT; x <= SIDE_LIMIT + 1e-9; x += 0.05) {
    let cost = Math.abs(x - run.van.x) * 0.4 + Math.abs(x) * 0.2;
    for (const car of run.traffic) {
      if (car.z < -3 || car.z > 90) continue;
      const room = Math.abs(x - car.x) - halfWidth(car.kind) - VAN_HALF;
      if (room < 0.18) cost += 200 / (1 + car.z * 0.04);
    }
    for (const parcel of run.parcels) {
      if (parcel.z > 0 && parcel.z < 60 && Math.abs(x - parcel.x) < 0.12) cost -= 1.5;
    }
    if (cost < bestCost) {
      bestCost = cost;
      bestX = x;
    }
  }
  return bestX;
}
