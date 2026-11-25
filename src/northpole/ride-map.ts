/**
 * A ride level on the map (ADR 0041): the player sits in the coaster's car
 * instead of walking, so each frame the car carries them on and the camera
 * follows; at a station the stall's call to action shows, and Space, →, D, a
 * tap on the ground or the "Ride on" button sends the car on to the next. The
 * ride itself is plain functions in `ride.ts`; this is its part in the map's
 * frame and input, which walking levels never reach.
 */
import { select } from './map-open';
import type { MapRun } from './map-state';
import { carAt, rideFor, rideOn, standAt, stationAt, waiting, type Ride } from './ride';
import { plotAtDoor } from './walking';
import { toScreen, type Tile } from './world';

/** The keys that send the car on: Space, the right arrow and D, the way ahead in a game. */
const RIDE_ON = new Set([' ', 'arrowright', 'd']);

/** Makes the "Ride on" button, hidden, inside the map's frame. */
export function makeRideButton(frame: HTMLElement): HTMLButtonElement {
  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'hud ride-on';
  button.hidden = true;
  frame.append(button);
  return button;
}

/**
 * Carries the player on in the car for `dt` seconds, and shows the button
 * while it stands at a station. Returns false while they're inside a square,
 * where they walk round its room as in any level.
 */
export function rideAlong(m: MapRun, ride: Ride, dt: number): boolean {
  const button = m.rideButton;
  if (m.visiting) {
    if (button) button.hidden = true;
    return false;
  }
  const before = m.player;
  m.ride = rideFor(ride, dt * 1000);
  m.player = carAt(m.ride);
  const stopped = waiting(m.ride);
  m.moving = !stopped;
  const dx = toScreen(m.player).x - toScreen(before).x;
  if (Math.abs(dx) > 0.01) m.facing = Math.sign(dx);
  // At a station, its stall is the one invited into; between stations, none is.
  m.near = stopped ? plotAtDoor(m.world, m.player) : undefined;
  const state = `${String(m.ride.stop)} ${stopped ? 'stopped' : 'riding'}`;
  if (m.canvas.dataset.ride !== state) m.canvas.dataset.ride = state;
  if (button) showButton(m, button, m.ride.stop === 0 ? 'Start the ride' : 'Ride on', stopped);
  return true;
}

/** The button's words and key, written only when they change, and shown only while the car stands still. */
function showButton(m: MapRun, button: HTMLButtonElement, words: string, stopped: boolean) {
  button.hidden = !stopped;
  const key = m.touchScreen.matches ? '' : 'Space';
  if (button.dataset.words === `${words}|${key}`) return;
  button.dataset.words = `${words}|${key}`;
  const kbd = document.createElement('kbd');
  kbd.textContent = key;
  button.replaceChildren(words, ...(key ? [' ', kbd] : []));
}

/** Sends the car on to the next station, if it stands at one: gliding there, or there at once for anyone who'd rather nothing moved. */
export function rideOnward(m: MapRun) {
  if (!m.ride || m.visiting || !waiting(m.ride)) return;
  select(m, undefined);
  m.panned = undefined;
  m.ride = rideOn(m.ride, m.reduced.matches);
}

/**
 * A key in a ride: Space, → and D ride on. Space on a button is the button's
 * own. Returns whether the key rode on.
 */
export function rideKey(m: MapRun, name: string, onButton: boolean): boolean {
  if (!RIDE_ON.has(name) || (onButton && name === ' ')) return false;
  rideOnward(m);
  return true;
}

/** Puts the car at the station on `door`, if there's one, and the player in it, as when a square is opened from afar. */
export function boardAt(m: MapRun, door: Tile | undefined) {
  if (!m.ride || !door) return;
  const n = stationAt(m.ride, door);
  if (n !== undefined) m.ride = standAt(m.ride, n);
  m.player = carAt(m.ride);
}
