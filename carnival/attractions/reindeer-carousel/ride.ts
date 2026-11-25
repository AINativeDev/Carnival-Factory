/**
 * The carousel's ride: it turns at its own steady pace from `time`, speeds up
 * while a visitor holds it and slows gently back once let go, and the elf a
 * visitor seats on a reindeer. Plain functions, so the tests can play it.
 */

/** One full turn of the carousel at its own pace, in milliseconds. */
export const TURN = 9_000;
/** Its own pace, in radians a millisecond. */
const PACE = (Math.PI * 2) / TURN;
/** How much faster than its own pace it turns at most, held: three times as fast in all. */
export const MAX_BOOST = PACE * 2;
/** How long, in milliseconds, it takes to gain most of its speed while held. */
const GATHER = 1_200;
/** How long it takes to lose most of the extra speed once let go: slower, so it eases off. */
const EASE = 2_400;

/**
 * How far the ride has got ahead of its own pace (radians), how much faster
 * than its pace it turns now (radians a millisecond) and when that was. Left
 * alone it turns at its pace from `time`, so the map and the preview agree.
 */
export interface Ride {
  ahead: number;
  boost: number;
  at: number;
}

/** The ride before anyone has touched it. */
export const AT_PACE: Ride = { ahead: 0, boost: 0, at: -Infinity };

/**
 * The ride at `time`, given whether it's held now. The extra speed moves
 * towards its target exponentially, worked out over the whole time since the
 * last draw, so it moves the same however often the carousel is drawn.
 */
export function stepRide(ride: Ride, holding: boolean, time: number): Ride {
  // Before the first draw there is no time to count.
  const dt = Number.isFinite(ride.at) ? Math.max(0, time - ride.at) : 0;
  const target = holding ? MAX_BOOST : 0;
  const settle = holding ? GATHER : EASE;
  const fade = Math.exp(-dt / settle);
  const boost = target + (ride.boost - target) * fade;
  const ahead = ride.ahead + target * dt + (ride.boost - target) * settle * (1 - fade);
  return { ahead, boost, at: time };
}

/** How far round the carousel is at `time`, in radians. */
export function turnOf(ride: Ride, time: number): number {
  return PACE * time + ride.ahead;
}

/** How fast the ride turns, from 1 at its own pace to 3 at its fastest. */
export function paceOf(ride: Ride): number {
  return 1 + ride.boost / PACE;
}

export interface Rider {
  /** Across the carousel, from -1 (left edge) to 1 (right edge). */
  across: number;
  /** 1 at the front, nearest the viewer, -1 at the back. */
  depth: number;
  /** How far the reindeer has risen on its pole, from 0 to 1. */
  lift: number;
}

/**
 * Where each of `count` reindeer is when the carousel is `turn` radians round,
 * rising and falling on its pole twice a turn.
 */
export function carouselRiders(count: number, turn: number): Rider[] {
  return Array.from({ length: count }, (_, i) => {
    const angle = turn + (i / count) * Math.PI * 2;
    return {
      across: Math.sin(angle),
      depth: Math.cos(angle),
      lift: (1 + Math.sin(angle * 2 + i)) / 2,
    };
  });
}

/** Where a rider's reindeer stands, in the diorama's 0 to 100 units. */
export function riderSpot({ across, depth, lift }: Rider) {
  const foot = 72 + depth * 12;
  return { x: 50 + across * 26, y: foot - 12 - lift * 6, foot };
}

/** The canopy's hem, its half-width and height, and the centre column's half-width, as the scene draws them. */
const HEM = 40;
const CANOPY = 35;
const PEAK = 24;
const COLUMN = 4;

/** Whether `x`, `y` is under the canopy: its striped cone and the half-ellipse of its hem, drawn over every reindeer. */
function underCanopy(x: number, y: number): boolean {
  const off = Math.abs(x - 50) / CANOPY;
  if (y <= HEM) return off <= (y - (HEM - PEAK)) / PEAK;
  return off <= 1 && y <= HEM + (CANOPY / 2) * Math.sqrt(1 - off * off);
}

/**
 * Which reindeer a tap at `x`, `y` (0 to 100 units) lands on, or -1 for none.
 * The nearest the front wins, since it's drawn over the ones behind it, and
 * one hidden by the canopy or, at the back, by the centre column is never picked.
 */
export function reindeerAt(riders: readonly Rider[], x: number, y: number): number {
  if (underCanopy(x, y)) return -1;
  let picked = -1;
  let nearest = -Infinity;
  riders.forEach((rider, index) => {
    const spot = riderSpot(rider);
    const hidden = rider.depth < 0 && Math.abs(x - 50) <= COLUMN;
    const on = !hidden && Math.abs(x - spot.x) <= 8 && y >= spot.y - 14 && y <= spot.y + 6;
    if (on && rider.depth > nearest) {
      picked = index;
      nearest = rider.depth;
    }
  });
  return picked;
}

/** Who rides after a tap on reindeer `tapped`: a tap on the elf's own reindeer lets it hop off. */
export function seatAfterTap(seated: number, tapped: number): number {
  if (tapped < 0) return seated;
  return tapped === seated ? -1 : tapped;
}

/** Who rides after `presses` taps on reindeer `tapped` since the last frame, each one counted. */
export function seatAfterTaps(seated: number, tapped: number, presses: number): number {
  let now = seated;
  for (let n = 0; n < presses; n++) now = seatAfterTap(now, tapped);
  return now;
}

/**
 * How bright bulb `n` of `count` is: a bright spot chases round the canopy
 * four times a turn, so it runs faster as the ride does. At the ride's fastest
 * each bulb brightens a little under twice a second, a soft swell, never a flash.
 */
export function chaseBrightness(turn: number, n: number, count: number): number {
  return 0.75 + 0.25 * Math.cos(turn * 4 - (n / count) * Math.PI * 4);
}
