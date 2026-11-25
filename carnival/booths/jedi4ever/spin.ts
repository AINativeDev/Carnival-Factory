/** How fast the cube turns, in radians a second, and how it gets there. */
export const TOP_SPEED = 14;
const SPEED_UP = 6;
/** Longer holds go faster still: the extra speed a held second adds, up to the top. */
const HOLD_BOOST = 3;
/** The share of its speed the cube keeps after one second of coasting. */
const COAST = 0.08;

/** What the cube remembers: its turn, its speed and how long it has been held. */
export interface Spin {
  angle: number;
  speed: number;
  held: number;
}

/** A cube at rest, turned a little so its faces show before anyone presses. */
export function restingSpin(): Spin {
  return { angle: 0.6, speed: 0, held: 0 };
}

/**
 * Moves the cube on by `dt` seconds. While the pointer is down it speeds up
 * toward a target that grows the longer it is held; once let go it slows to a
 * stop. Booth.ts guards `dt`, so a long gap between frames can't fling it.
 */
export function stepSpin(spin: Spin, dt: number, down: boolean): Spin {
  const held = down ? spin.held + dt : 0;
  const target = Math.min(TOP_SPEED, 5 + held * HOLD_BOOST);
  const speed = down
    ? Math.min(target, spin.speed + SPEED_UP * dt * 2)
    : spin.speed * Math.pow(COAST, dt) * (spin.speed < 0.05 ? 0 : 1);
  return { angle: spin.angle + speed * dt, speed, held };
}
