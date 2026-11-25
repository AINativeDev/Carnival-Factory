/**
 * The course down the mountain: where each snowflake, rock and snowdrift lies on
 * a run, from the run's seed alone, so the same seed always makes the same course
 * and nothing about it is stored between frames.
 */

/** Things on the course: one every `SPACING` metres, the first two spacings in. */
const SPACING = 9;

/** Half the width of the track: lanes run from -1.2 to 1.2 with a margin of snow beyond. */
export const TRACK = 1.4;
/** The furthest lane either side that the penguin and the things on the course can use. */
export const EDGE = 1.2;

/** What lies on the course: a snowflake to scoop up, or a rock or snowdrift to steer round. */
export type Kind = 'flake' | 'rock' | 'drift';

/** One snowflake, rock or snowdrift on a run's course. */
export interface Thing {
  index: number;
  kind: Kind;
  /** Metres from the start of the run. */
  distance: number;
  /** Across the track, -1.2 left to 1.2 right. */
  lane: number;
}

/** Wraps `value` into [0, `span`), negative values included, for scenery that loops. */
export function wrap(value: number, span: number): number {
  return ((value % span) + span) % span;
}

/** Keeps `value` between `low` and `high`, so nothing leaves the track. */
export function clamp(value: number, low: number, high: number): number {
  return Math.min(high, Math.max(low, value));
}

/** A number from 0 to 1 that is always the same for the same seed, index and salt. */
function random(seed: number, index: number, salt: number): number {
  const s = Math.sin(seed * 127.1 + index * 311.7 + salt * 74.7) * 43_758.5453;
  return s - Math.floor(s);
}

/** The clear line down this run's course: the penguin weaves along it when nobody steers. */
export function pathAt(seed: number, distance: number): number {
  return 0.55 * Math.sin((distance / 80) * Math.PI * 2 + seed * 1.7);
}

/**
 * Thing `index` on a run's course. Snowflakes lie near the clear line, and rocks
 * and snowdrifts sit at least 0.75 lanes to one side of it, so there is always a
 * way through.
 */
export function thingAt(seed: number, index: number): Thing {
  const distance = (index + 2) * SPACING;
  const path = pathAt(seed, distance);
  const pick = random(seed, index, 1);
  const spread = random(seed, index, 2);
  if (pick < 0.4) {
    return {
      index,
      kind: 'flake',
      distance,
      lane: clamp(path + (spread - 0.5) * 1.2, -EDGE, EDGE),
    };
  }
  let side = random(seed, index, 3) < 0.5 ? -1 : 1;
  let lane = path + side * (0.75 + spread * 0.4);
  if (Math.abs(lane) > EDGE) {
    side = -side;
    lane = path + side * (0.75 + spread * 0.4);
  }
  return { index, kind: pick < 0.7 ? 'rock' : 'drift', distance, lane: clamp(lane, -EDGE, EDGE) };
}

/** The things whose distance is after `from` and up to `to`, nearest first. */
export function thingsBetween(seed: number, from: number, to: number): Thing[] {
  const found: Thing[] = [];
  const first = Math.max(0, Math.floor(from / SPACING) - 2);
  for (let i = first; (i + 2) * SPACING <= to; i++) {
    const t = thingAt(seed, i);
    if (t.distance > from) found.push(t);
  }
  return found;
}
