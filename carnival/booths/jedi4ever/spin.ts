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
/** A frame never counts for longer than this, so a tab left in the background doesn't jump. */
const LONGEST_FRAME = 100;

/** The plaque on the back wall, in the booth's 0 to 100 units. */
export const PLAQUE = { x: 82, y: 35, w: 15, h: 14 };

/** Whether a point, in the booth's 0 to 100 units, is on the plaque. */
export function onLogo(x: number, y: number): boolean {
  return x >= PLAQUE.x && x <= PLAQUE.x + PLAQUE.w && y >= PLAQUE.y && y <= PLAQUE.y + PLAQUE.h;
}

/** The spin at `time`, given whether the logo is being held now. */
export function stepSpin(spin: Spin, holding: boolean, time: number): Spin {
  const dt = Math.min(LONGEST_FRAME, Math.max(0, time - spin.at));
  let speed = holding
    ? Math.min(MAX_SPEED, spin.speed + ACCEL * dt)
    : spin.speed * Math.exp(-dt / SETTLE);
  if (!holding && speed < MAX_SPEED / 50) speed = 0;
  return { angle: spin.angle + speed * dt, speed, at: time };
}
