/**
 * How curling stones move on the pond, as plain functions: the throw a drag
 * back gives, the slide slowed by the ice and pushed across by the wind, the
 * sweeping that carries a stone further and straighter, and stones knocking
 * each other. Stones are moved in small fixed steps, so a slide plays out the
 * same however the frames fall.
 */
import { HACK, STONE, offSheet, type Point, type Stone } from './sheet';

/** How quickly the ice slows a stone, in units a second squared. */
export const FRICTION = 10;
/** How much of the friction and the wind a swept stone feels. */
const SWEPT = { friction: 0.6, wind: 0.5 };
/** How far the hardest throw slides on unswept ice, with no wind. */
export const REACH = 76;
/** How far back a drag goes, in screen units, for the hardest throw. */
export const PULL = 18;
/** How much a drag up or down turns the throw: gently, so a finger can aim finely. */
export const STEER = 0.6;
/** The widest a throw may aim off straight down the sheet, in radians. */
export const AIM = 0.2;
/** How bouncy a knock is: 1 would keep every bit of the speed. */
const BOUNCE = 0.9;
/** One step of the slide, in seconds, and the slowest a stone slides before it stops. */
const STEP = 1 / 120;
/** One step, in milliseconds, for counting how many a frame needs. */
export const STEP_MS = STEP * 1000;
const STOPPED = 0.25;

/** A throw: how hard, from 0 to 1, and its angle off straight down the sheet. */
export interface Throw {
  power: number;
  angle: number;
}

/**
 * The throw a drag gives, from where it was pressed to where it is now, on
 * screen: pulled back, away from the house, like a slingshot. How far back
 * sets the power, and up or down aims it the other way. A drag forward, or too small to mean anything, throws nothing.
 */
export function throwFrom(from: Point, to: Point): Throw | undefined {
  const back = from.x - to.x;
  const across = (from.y - to.y) * STEER;
  if (back <= 0.5) return undefined;
  const power = Math.min(1, back / PULL);
  if (power < 0.08) return undefined;
  return { power, angle: Math.max(-AIM, Math.min(AIM, Math.atan2(across, back))) };
}

/** How far a throw slides on unswept ice with no wind. */
export function slideLength(power: number): number {
  return REACH * power;
}

/** The stone a throw sets sliding from the hack. */
export function launch(thrown: Throw): Stone {
  const speed = Math.sqrt(2 * FRICTION * slideLength(thrown.power));
  return {
    ...{ s: HACK, w: 0, rival: false, out: Infinity },
    ...{ vs: speed * Math.cos(thrown.angle), vw: speed * Math.sin(thrown.angle) },
  };
}

/** Whether a stone is still sliding. */
export function moving(stone: Stone): boolean {
  return stone.out === Infinity && (stone.vs !== 0 || stone.vw !== 0);
}

/** One stone slowed by the ice and pushed by the wind for `dt` seconds; `swept`, it feels less of both. */
function slide(stone: Stone, dt: number, wind: number, swept: boolean): void {
  const speed = Math.hypot(stone.vs, stone.vw);
  if (stone.out !== Infinity || speed === 0) return;
  const slowed = speed - FRICTION * (swept ? SWEPT.friction : 1) * dt;
  if (slowed <= STOPPED) {
    stone.vs = 0;
    stone.vw = 0;
    return;
  }
  stone.vs *= slowed / speed;
  stone.vw = (stone.vw * slowed) / speed + wind * (swept ? SWEPT.wind : 1) * dt;
  stone.s += stone.vs * dt;
  stone.w += stone.vw * dt;
}

/** Two stones that touch push apart, and if they're closing they trade their speed along the knock. */
function knock(a: Stone, b: Stone): boolean {
  const ds = b.s - a.s;
  const dw = b.w - a.w;
  const apart = Math.hypot(ds, dw);
  if (apart >= STONE * 2 || apart === 0) return false;
  const [ns, nw] = [ds / apart, dw / apart];
  const overlap = STONE * 2 - apart;
  a.s -= (ns * overlap) / 2;
  a.w -= (nw * overlap) / 2;
  b.s += (ns * overlap) / 2;
  b.w += (nw * overlap) / 2;
  const closing = (a.vs - b.vs) * ns + (a.vw - b.vw) * nw;
  if (closing <= 0) return false;
  const push = (closing * (1 + BOUNCE)) / 2;
  a.vs -= push * ns;
  a.vw -= push * nw;
  b.vs += push * ns;
  b.vw += push * nw;
  return true;
}

/**
 * Moves the stones on by `steps` fixed steps from `clock`, in milliseconds:
 * each slides, the one at `swept` feels the sweeping while `sweeping` says so,
 * stones knock, and any that leave the sheet go out of play then. Returns how
 * many knocks there were.
 */
export function slideAll(
  stones: Stone[],
  steps: number,
  clock: number,
  how: { wind: number; swept: number; sweeping: (at: number) => boolean },
): number {
  let knocks = 0;
  for (let n = 1; n <= steps; n++) {
    const at = clock + n * STEP_MS;
    stones.forEach((stone, i) => {
      slide(stone, STEP, how.wind, i === how.swept && how.sweeping(at));
    });
    for (let i = 0; i < stones.length; i++) {
      for (let j = i + 1; j < stones.length; j++) {
        const a = stones.at(i);
        const b = stones.at(j);
        if (a && b && a.out === Infinity && b.out === Infinity && knock(a, b)) knocks += 1;
      }
    }
    for (const stone of stones) if (stone.out === Infinity && offSheet(stone)) stone.out = at;
  }
  return knocks;
}
