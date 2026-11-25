/** The logo's spin: it speeds up while pressed and held, and slows to a stop when let go. */

/** The logo's turn so far (radians), how fast it turns (radians a millisecond) and when that was. */
export interface Spin {
  angle: number;
  speed: number;
  at: number;
}

/** The logo before anyone has touched it. */
export const REST: Spin = { angle: 0, speed: 0, at: -Infinity };
/** The fastest it turns: about one and a half turns a second. */
export const MAX_SPEED = 0.009;
/** How much faster it turns each millisecond it's held. */
const ACCEL = 0.00002;
/** How long, in milliseconds, it takes to lose most of its speed once let go. */
const SETTLE = 450;
/** Below this speed a let-go logo has stopped. */
const STOPPED = MAX_SPEED / 50;

/** The plaque on the back wall, in the booth's 0 to 100 units. */
export const PLAQUE = { x: 82, y: 35, w: 15, h: 14 };

/** Whether a point, in the booth's 0 to 100 units, is on the plaque. */
export function onLogo(x: number, y: number): boolean {
  return x >= PLAQUE.x && x <= PLAQUE.x + PLAQUE.w && y >= PLAQUE.y && y <= PLAQUE.y + PLAQUE.h;
}

/**
 * The spin at `time`, given whether the logo is being held now. It works out
 * the turn over the whole time since the last draw rather than a frame at a
 * time, so the logo moves the same however often the booth is drawn: the
 * drawing contract has squares move from `time`, not from their frame rate.
 */
export function stepSpin(spin: Spin, holding: boolean, time: number): Spin {
  // Before the first draw there is no time to count, so the first press starts from rest.
  const dt = Number.isFinite(spin.at) ? Math.max(0, time - spin.at) : 0;
  return holding ? speedUp(spin, dt, time) : slowDown(spin, dt, time);
}

/** Held: it gains speed steadily until the top speed, then keeps it. */
function speedUp(spin: Spin, dt: number, time: number): Spin {
  const gaining = Math.min(dt, Math.max(0, (MAX_SPEED - spin.speed) / ACCEL));
  const speed = Math.min(MAX_SPEED, spin.speed + ACCEL * dt);
  const turned =
    spin.speed * gaining + (ACCEL * gaining * gaining) / 2 + MAX_SPEED * (dt - gaining);
  return { angle: spin.angle + turned, speed, at: time };
}

/** Let go: its speed dies away exponentially, and it stops once it's barely turning. */
function slowDown(spin: Spin, dt: number, time: number): Spin {
  if (spin.speed <= STOPPED) return { angle: spin.angle, speed: 0, at: time };
  const stopsAfter = SETTLE * Math.log(spin.speed / STOPPED);
  if (dt >= stopsAfter)
    return { angle: spin.angle + SETTLE * (spin.speed - STOPPED), speed: 0, at: time };
  const speed = spin.speed * Math.exp(-dt / SETTLE);
  return { angle: spin.angle + SETTLE * (spin.speed - speed), speed, at: time };
}
