/**
 * The coaster's track and where the sleigh is on it: plain geometry in the
 * attraction's 0 to 100 units, kept apart from the drawing so it can be tested.
 */
import { iso } from '../../../src/northpole/diorama';

/** One ride, from the station at one edge of the attraction to the other, in milliseconds. */
export const RIDE = 5_000;

/**
 * The height of the track at `x`, both in the attraction's 0 to 100 units: a small
 * bump, then the big snowy hill in the middle, then a dip and a last bump.
 */
export function trackY(x: number): number {
  const hill = 38 * Math.exp(-(((x - 50) / 16) ** 2));
  const bumps = 8 * Math.exp(-(((x - 16) / 7) ** 2)) + 10 * Math.exp(-(((x - 84) / 7) ** 2));
  return 78 - hill - bumps;
}

/** Where the sleigh is `time` into a ride, and the angle of the track under it, in radians. */
export function sleighAt(time: number): { x: number; y: number; angle: number } {
  // It slows near the top of the hill and speeds down it, like a real coaster.
  const t = (time % RIDE) / RIDE;
  const x = 100 * (t + Math.sin(t * Math.PI * 2) / (Math.PI * 4));
  const y = trackY(x);
  const angle = Math.atan2(trackY(x + 0.5) - trackY(x - 0.5), 1);
  return { x, y, angle };
}

/**
 * A point on the ride at `x`, `across` the track (from the far side to the
 * near one) and `drop` below the rail. The track runs across the slab from its
 * left corner to its right one, so it reads left to right as it always has.
 */
export function ridePoint(x: number, across: number, drop = 0) {
  const z = (78 - trackY(x)) * 0.72 + 4;
  return iso(-20 + x * 0.4 + across, 20 - x * 0.4 + across, Math.max(0, z - drop));
}

/** Where the sleigh is drawn `time` into a ride, on the track's near rail, and its tilt in radians. */
export function sleighPose(time: number, near: number): { x: number; y: number; angle: number } {
  const { x } = sleighAt(time);
  const p = ridePoint(x, near);
  const ahead = ridePoint(Math.min(x + 1, 100), near);
  const behind = ridePoint(Math.max(x - 1, 0), near);
  return { ...p, angle: Math.atan2(ahead.y - behind.y, ahead.x - behind.x) };
}
