/**
 * Launching the sleigh: what the coaster remembers between frames, and what a
 * tap does to it. Plain functions, so the play is tested without a canvas.
 */
import { RIDE, sleighAt } from './track';

/** How many launches fill the cheer meter. */
export const CHEERS = 5;

/** How steeply the track must fall under the sleigh, in radians, for the riders' hands to go up. */
const DROP = 0.25;

/**
 * The coaster's one memory of the pointer: when the sleigh last left the
 * station, and how full the cheer meter is, from 0 to CHEERS.
 */
export interface Ride {
  launchedAt: number;
  cheers: number;
}

/** The sleigh at the station before anyone has launched it. */
export const WAITING: Ride = { launchedAt: -Infinity, cheers: 0 };

/** Whether the sleigh is out on the track at `time`, rather than waiting at the station. */
export function riding(ride: Ride, time: number): boolean {
  const since = time - ride.launchedAt;
  return since >= 0 && since < RIDE;
}

/**
 * The ride after `presses` taps at `time`: a tap while the sleigh waits
 * launches it and fills the cheer meter one more, and a full meter starts
 * again from one. A tap while it's out on the track changes nothing.
 */
export function launch(ride: Ride, time: number, presses: number): Ride {
  if (presses <= 0 || riding(ride, time)) return ride;
  return { launchedAt: time, cheers: (ride.cheers % CHEERS) + 1 };
}

/** How far into its ride the sleigh is at `time`: 0 while it waits at the station. */
export function rideTime(ride: Ride, time: number): number {
  return riding(ride, time) ? time - ride.launchedAt : 0;
}

/** Whether the riders have their hands up at `time`: only on the steep drop down the hill. */
export function handsUp(ride: Ride, time: number): boolean {
  return riding(ride, time) && sleighAt(rideTime(ride, time)).angle > DROP;
}
