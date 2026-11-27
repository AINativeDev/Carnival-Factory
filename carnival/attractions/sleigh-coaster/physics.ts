/**
 * How the sleigh moves: pushed or coasting along the rail, pulled back by
 * gravity on the climbs and a little by the snow, lifted off the rail when it
 * goes over a crest faster than gravity can hold it down, flying until it
 * lands again, and thrown off the rails when it crosses a crest too fast.
 * Plain functions stepped a fixed slice of time at a time, so the ride is the
 * same however often it's drawn.
 */
import { G, HILLS, heightAt, nextHill, trackAt } from './track';

/** One slice of the ride, in seconds. */
export const STEP = 1 / 240;
/** The hardest holding pushes the sleigh on, from a standstill, in metres a second each second. */
export const PUSH = 30;
/**
 * How much speed, squared, holding adds each second, however fast it goes:
 * a steady push, like a horse's, so the gauge's needle climbs at the same
 * pace in a valley as near a crest.
 */
const POWER = 320;
/** How much of its speed the snow on the rail takes each second. */
const DRAG = 0.12;

/** The sleigh in the air: its height, and its speed along and up. */
interface Flight {
  y: number;
  vx: number;
  vy: number;
}

/** Where the sleigh is and how it moves: on the rail at `speed`, or flying. */
export interface Sleigh {
  /** How far along the track, in metres from the station. */
  x: number;
  /** Its speed along the rail, while it's on it: backwards is negative. */
  speed: number;
  air: Flight | null;
  /** The next crest it hasn't crossed yet, by its place on the course. */
  next: number;
  /** Whether it crossed a crest too fast and flew off the rails. */
  off: boolean;
}

/** The sleigh at the station, waiting. */
export const AT_STATION: Sleigh = { x: 0, speed: 0, air: null, next: 0, off: false };

/** How high the sleigh is: on the rail, or up in the air. */
export const heightOf = (sleigh: Sleigh) => sleigh.air?.y ?? heightAt(sleigh.x);

/** How fast the sleigh is going, whichever way, on the rail or in the air. */
export function speedOf(sleigh: Sleigh): number {
  const { air } = sleigh;
  return air ? Math.hypot(air.vx, air.vy) : Math.abs(sleigh.speed);
}

/** The sleigh on the rail at `x`, pushed or not, one step on. */
function roll(sleigh: Sleigh, pushing: boolean, dt: number): Sleigh {
  const track = trackAt(sleigh.x);
  const across = 1 / Math.hypot(1, track.slope);
  const push = pushing ? Math.min(PUSH, POWER / Math.max(1, Math.abs(sleigh.speed))) : 0;
  let speed = sleigh.speed + (push - G * track.slope * across - DRAG * sleigh.speed) * dt;
  let x = sleigh.x + speed * across * dt;
  // The station's buffer: it can't roll back out of the station.
  if (x < 0) [x, speed] = [0, Math.max(0, speed)];
  const here = trackAt(x);
  const cos = 1 / Math.hypot(1, here.slope);
  // Over a crest, the rail falls away faster than gravity can pull the sleigh down with it.
  const holds = speed * speed * -here.bend * cos * cos * cos <= G * cos;
  if (holds) return { ...sleigh, x, speed };
  const air = { y: here.height, vx: speed * cos, vy: speed * here.slope * cos };
  return { ...sleigh, x, speed, air };
}

/** The sleigh flying, one step on, and back on the rail once it comes down to it. */
function fly(sleigh: Sleigh, air: Flight, dt: number): Sleigh {
  // Exactly along its arc, so a sleigh that just lifted off doesn't drop straight back.
  const vy = air.vy - G * dt;
  const x = sleigh.x + air.vx * dt;
  const y = air.y + (air.vy + vy) * dt * 0.5;
  const track = trackAt(x);
  if (y > track.height || sleigh.off) return { ...sleigh, x, air: { y, vx: air.vx, vy } };
  // It lands with only the part of its speed that runs along the rail.
  const cos = 1 / Math.hypot(1, track.slope);
  return { ...sleigh, x, speed: (air.vx + vy * track.slope) * cos, air: null };
}

/**
 * The sleigh one step of `dt` seconds on, pushed or coasting. Crossing a
 * crest faster than its `crash` speed flies it off the rails: it's `off`, and
 * flies on until the game sets it down in the snow.
 */
export function step(sleigh: Sleigh, pushing: boolean, dt = STEP): Sleigh {
  let next = sleigh.air ? fly(sleigh, sleigh.air, dt) : roll(sleigh, pushing, dt);
  for (let hill = HILLS.at(next.next); hill && next.x >= hill.crest; hill = HILLS.at(next.next)) {
    const off = next.off || speedOf(next) > hill.crash;
    next = { ...next, next: next.next + 1, off };
  }
  return next;
}

/**
 * What the gauge reads: how fast the sleigh will cross the next hill's crest
 * if it coasts from here, from what it has now (negative when it won't get
 * over), and that crest's speeds for lifting off and flying off.
 */
export function crestReading(sleigh: Sleigh): { over: number; lift: number; crash: number } {
  const hill = nextHill(sleigh.x);
  if (!hill) return { over: speedOf(sleigh), lift: Infinity, crash: Infinity };
  const spare = speedOf(sleigh) ** 2 - 2 * G * (hill.height - heightOf(sleigh));
  return {
    over: Math.sign(spare) * Math.sqrt(Math.abs(spare)),
    lift: hill.lift,
    crash: hill.crash,
  };
}
