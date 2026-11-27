/**
 * The coaster's course: a flat run out of the station, then hill after hill,
 * with little bumps between them, each a smooth cosine rise and fall from the
 * ground. It gets steeper and bumpier the further it goes. Plain geometry in
 * metres along the track and metres up, kept apart from the drawing so the
 * ride is tested without a canvas.
 */

/** Gravity on the ride, in metres a second each second: gentler than Earth's, so it reads on screen. */
export const G = 24;
/** The flat run out of the station before the first hill, in metres. */
const LEAD = 24;
/** How many hills the course has: more than anyone rides in one run's clock. */
const HILLS_ON_COURSE = 90;

/** One hill or bump: where it starts, how long and tall it is, and the speeds over its crest. */
export interface Hill {
  start: number;
  length: number;
  height: number;
  /** A little bump between hills: it gives a hop, and never throws anyone off. */
  bump: boolean;
  /** Where its crest is along the track. */
  crest: number;
  /** The slowest speed over the crest that lifts the sleigh off the rail. */
  lift: number;
  /** The speed over the crest that flies the sleigh off the rails: Infinity on a bump. */
  crash: number;
}

/** A steady pseudo-random number from 0 to 1 for `n`, so the course is the same every ride. */
function hash(n: number): number {
  const s = Math.sin(n * 127.1 + 311.7) * 43_758.5453;
  return s - Math.floor(s);
}

/** How far the course has come on, from 0 at the first hill to 1 by the twentieth. */
const rise = (n: number) => Math.min(1, n / 20);

/** How sharply a cosine hill bends over its crest. */
const bendOf = (length: number, height: number) => (height / 2) * ((2 * Math.PI) / length) ** 2;

/** How long a cosine hill `height` tall must be to lift a sleigh off its crest at `lift`. */
const lengthFor = (height: number, lift: number) => lift * Math.PI * Math.sqrt((2 * height) / G);

/**
 * The course's hills in order: gentle ones at first, then taller and steeper,
 * with bumps between them more and more often, and a narrower margin between
 * lifting off and flying off. Each big hill is as long as it must be to lift
 * the sleigh off at a speed it can be steered to, so the hills grow steeper
 * without their crests becoming impossible to judge.
 */
export function makeHills(count: number): Hill[] {
  const hills: Hill[] = [];
  let start = LEAD;
  for (let n = 0; hills.length < count; n++) {
    const r = rise(hills.length);
    const bump = hills.length > 2 && !hills.at(-1)?.bump && hash(n) < 0.12 + 0.38 * r;
    const height = bump
      ? 1.6 + 1.4 * r + hash(n + 0.7) * 0.6
      : 13 + 13 * r + (hash(n + 0.9) - 0.5) * 5;
    const aim = 17 - 4 * r + (hash(n + 0.3) - 0.5) * 3;
    const length = bump ? 20 - 3 * r + hash(n + 0.5) * 3 : lengthFor(height, aim);
    const lift = Math.sqrt(G / bendOf(length, height));
    const crash = bump ? Infinity : lift * (1.8 - 0.3 * r);
    hills.push({ start, length, height, bump, crest: start + length / 2, lift, crash });
    start += length;
  }
  return hills;
}

/** The ride's course, the same for every rider. */
export const HILLS = makeHills(HILLS_ON_COURSE);

/** The hill under `x`, or undefined on the flat: before the first hill or past the last. */
export function hillAt(x: number): Hill | undefined {
  let low = 0;
  let high = HILLS.length - 1;
  while (low <= high) {
    const mid = (low + high) >> 1;
    const hill = HILLS.at(mid);
    if (!hill) return undefined;
    if (x < hill.start) high = mid - 1;
    else if (x >= hill.start + hill.length) low = mid + 1;
    else return hill;
  }
  return undefined;
}

/** The track at `x`: its height, its slope and how it bends (negative over a crest). */
export function trackAt(x: number): { height: number; slope: number; bend: number } {
  const hill = hillAt(x);
  if (!hill) return { height: 0, slope: 0, bend: 0 };
  const k = (2 * Math.PI) / hill.length;
  const a = k * (x - hill.start);
  const half = hill.height / 2;
  return {
    height: half * (1 - Math.cos(a)),
    slope: half * k * Math.sin(a),
    bend: half * k * k * Math.cos(a),
  };
}

/** The height of the track at `x`, in metres. */
export const heightAt = (x: number) => trackAt(x).height;

/** The next real hill (not a bump) whose crest is still ahead of `x`. */
export function nextHill(x: number): Hill | undefined {
  return HILLS.find((hill) => !hill.bump && hill.crest > x);
}
