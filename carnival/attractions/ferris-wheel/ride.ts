/**
 * Riding the ferris wheel: how far the wheel has turned, which car a tap
 * picks, and how a boarded car is carried to the top for the view before it
 * comes round again. Plain functions, so the ride is tested without drawing.
 */

/** One full turn of the wheel at its usual pace, in milliseconds. */
export const TURN = 24_000;

/** How many cars hang from the rim. */
export const CARS = 8;

/** How long the view from the top stays open, in milliseconds. */
export const VIEW = 9_000;

/** How long the view takes to open out, and to close again, in milliseconds. */
export const OPENING = 1_400;

/** How near a car's middle a tap must land to board it, in the square's 0 to 100 units. */
const REACH = 6;

/** Where a car hangs on the rim, at the hook, in the square's 0 to 100 units. */
export interface CarSpot {
  x: number;
  y: number;
}

/**
 * One ride, the attraction's one memory of the pointer: which car was boarded
 * and when, the wheel's angle then, and how far it turns to bring that car to
 * the top.
 */
export interface Ride {
  car: number;
  at: number;
  from: number;
  lift: number;
}

/** Straight up, as an angle on the canvas, where y runs down. */
const TOP = -Math.PI / 2;
const FULL = Math.PI * 2;

/** How long the wheel takes to lift a car through `lift` radians: quicker than its usual pace, never a jolt. */
export function riseTime(lift: number): number {
  return 1_000 + (lift / FULL) * 6_000;
}

/** Eases from 0 to 1 and back to rest, so the wheel starts and stops gently. */
function ease(p: number): number {
  return (1 - Math.cos(Math.min(1, Math.max(0, p)) * Math.PI)) / 2;
}

/**
 * The wheel's angle at `time`, turning clockwise once every `TURN`. With a
 * ride, it carries the boarded car up, holds it at the top for the view, then
 * turns on at its usual pace from there, so it never jumps.
 */
export function wheelAngle(time: number, ride?: Ride): number {
  if (!ride) return (time / TURN) * FULL;
  const elapsed = time - ride.at;
  const rise = riseTime(ride.lift);
  if (elapsed < rise) return ride.from + ease(elapsed / rise) * ride.lift;
  const top = ride.from + ride.lift;
  return top + (Math.max(0, elapsed - rise - VIEW) / TURN) * FULL;
}

/** Where each of `count` cars hangs, evenly round a rim of `radius` about (cx, cy), with the wheel at `angle`. */
export function carSpots(
  count: number,
  angle: number,
  cx: number,
  cy: number,
  radius: number,
): CarSpot[] {
  return Array.from({ length: count }, (_, i) => {
    const a = angle + (i / count) * FULL;
    return { x: cx + Math.cos(a) * radius, y: cy + Math.sin(a) * radius };
  });
}

/** Where a car's bauble hangs below its hook: the part a visitor taps. */
export function baubleOf(spot: CarSpot): CarSpot {
  return { x: spot.x + 2.5, y: spot.y + 5.35 };
}

/** The car whose bauble is nearest (x, y) and within `REACH` of it, or -1 for none. */
export function carAt(x: number, y: number, spots: readonly CarSpot[]): number {
  let nearest = -1;
  let best = REACH;
  spots.forEach((spot, i) => {
    const bauble = baubleOf(spot);
    const away = Math.hypot(bauble.x - x, bauble.y - y);
    if (away <= best) {
      nearest = i;
      best = away;
    }
  });
  return nearest;
}

/** Whether a car may be boarded at `time`: always, except while a ride is rising or at the top. */
export function canBoard(time: number, ride?: Ride): boolean {
  return !ride || time - ride.at >= riseTime(ride.lift) + VIEW;
}

/** Boards `car` at `time`: the wheel turns on, clockwise, until that car is at the top. */
export function board(car: number, time: number, ride?: Ride): Ride {
  const from = wheelAngle(time, ride);
  const at = from + (car / CARS) * FULL;
  const lift = (((TOP - at) % FULL) + FULL) % FULL;
  return { car, at: time, from, lift };
}

/**
 * How far open the view from the top is at `time`, from 0 (closed) to 1: it
 * opens out once the car reaches the top and closes before the car comes down.
 */
export function viewOpen(time: number, ride?: Ride): number {
  if (!ride) return 0;
  const since = time - ride.at - riseTime(ride.lift);
  if (since <= 0 || since >= VIEW) return 0;
  return ease(Math.min(since, VIEW - since) / OPENING);
}
