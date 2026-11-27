/**
 * How the ferris wheel turns, and where its cars are: plain functions, so the
 * boarding game is tested without drawing. The wheel turns clockwise at a
 * steady speed, and after a full wheel it whirls one extra turn, its victory
 * lap. Everything is worked out from `time`, from where the wheel last changed
 * speed, so it never jumps.
 */

/** How many cars hang from the rim. */
export const CARS = 8;
/** A full turn, in radians. */
export const FULL = Math.PI * 2;
/** Straight down, as an angle on the canvas (y runs down): where the boarding gate is. */
export const BOTTOM = Math.PI / 2;
/** How far either side of the gate a car may be and still be boarded, in radians. */
export const WINDOW = 0.2;
/** How near the gate a boarding counts as perfect, in radians. */
export const PERFECT = 0.07;
/** One turn of the wheel at the first lap's pace, in milliseconds. */
export const TURN = 16_000;
/** How long the victory lap after a full wheel takes, in milliseconds. */
export const SPIN = 2_800;
/** The fastest the wheel gets, as a multiple of the first lap's pace. */
const FASTEST = 2.4;
/** How much quicker each lap turns than the one before. */
const QUICKER = 1.15;

/** The wheel's hub, its rim's radius, and how far behind the far rim stands, in 0 to 100 units. */
export const HUB = { x: 48, y: 41, radius: 25, depth: { x: 5, y: -2.5 } };

/** A point in the square's 0 to 100 units. */
export interface Spot {
  x: number;
  y: number;
}

/**
 * How the wheel turns: its angle `base` at `anchor`, turning `speed` radians a
 * millisecond, plus the extra whirl of a victory lap begun at `spinAt`.
 */
export interface Wheel {
  base: number;
  anchor: number;
  speed: number;
  spinAt: number;
}

/** Eases from 0 to 1 and comes to rest, so the wheel speeds up and slows down gently. */
export function ease(p: number): number {
  return (1 - Math.cos(Math.min(1, Math.max(0, p)) * Math.PI)) / 2;
}

/** How fast the wheel turns on lap `lap`, in radians a millisecond: quicker each lap, up to a limit. */
export function lapSpeed(lap: number): number {
  return (FULL / TURN) * Math.min(FASTEST, QUICKER ** Math.max(0, lap - 1));
}

/** A wheel standing at `angle` at `time`, turning at `speed`, with no victory lap yet. */
export function wheelFrom(angle: number, time: number, speed: number): Wheel {
  return { base: angle, anchor: time, speed, spinAt: Infinity };
}

/** The wheel's angle at `time`: car 0's place on the rim, unwrapped, so it only ever grows. */
export function angleAt(wheel: Wheel, time: number): number {
  const whirl = time < wheel.spinAt ? 0 : FULL * ease((time - wheel.spinAt) / SPIN);
  return wheel.base + wheel.speed * (time - wheel.anchor) + whirl;
}

/** Whether the wheel is in its victory lap at `time`. */
export function spinning(wheel: Wheel, time: number): boolean {
  return time >= wheel.spinAt && time < wheel.spinAt + SPIN;
}

/** The wheel held still for `gap` milliseconds, as while the tab was hidden, so it never jumps on. */
export function paused(wheel: Wheel, gap: number): Wheel {
  return { ...wheel, anchor: wheel.anchor + gap, spinAt: wheel.spinAt + gap };
}

/**
 * How far car `car` is from the gate when the wheel is at `angle`, from -PI to
 * PI: below zero it's still coming down to it, above zero it has passed.
 */
export function fromGate(angle: number, car: number): number {
  const off = (angle + (car * FULL) / CARS - BOTTOM) % FULL;
  const wrapped = off < 0 ? off + FULL : off;
  return wrapped > Math.PI ? wrapped - FULL : wrapped;
}

/** The car nearest the gate when the wheel is at `angle`, and how far from it. */
export function nearestCar(angle: number): { car: number; off: number } {
  let nearest = { car: 0, off: fromGate(angle, 0) };
  for (let car = 1; car < CARS; car++) {
    const off = fromGate(angle, car);
    if (Math.abs(off) < Math.abs(nearest.off)) nearest = { car, off };
  }
  return nearest;
}

/** How many times car `car` has gone out past the gate's window, counted from the wheel's angle. */
function laps(angle: number, car: number): number {
  return Math.floor((angle + (car * FULL) / CARS - BOTTOM - WINDOW) / FULL);
}

/** The cars that went out past the gate's window as the wheel turned from `from` to `to`. */
export function passedGate(from: number, to: number): number[] {
  const passed: number[] = [];
  for (let car = 0; car < CARS; car++) if (laps(to, car) > laps(from, car)) passed.push(car);
  return passed;
}

/** Where each car's hook is on the rim with the wheel at `angle`. */
export function carSpots(angle: number): Spot[] {
  return Array.from({ length: CARS }, (_, car) => {
    const a = angle + (car * FULL) / CARS;
    return { x: HUB.x + Math.cos(a) * HUB.radius, y: HUB.y + Math.sin(a) * HUB.radius };
  });
}

/** Where a car's bauble hangs below its hook, between the near rim and the far one. */
export function baubleOf(hook: Spot): Spot {
  return { x: hook.x + HUB.depth.x / 2, y: hook.y + HUB.depth.y / 2 + 7 };
}

/** Where the car at the gate hangs: where an elf hops in, and riders hop out. */
export const GATE: Spot = baubleOf({ x: HUB.x, y: HUB.y + HUB.radius });
