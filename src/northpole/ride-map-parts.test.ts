// @vitest-environment happy-dom
import { afterEach, describe, expect, it } from 'vitest';
import { rideOptions } from '../test-support/ride-fixtures';
import { openRun } from './map-run';
import type { MapRun } from './map-state';
import { carAt, type Ride } from './ride';
import { makeRideButton, rideAlong, rideKey, rideOnward } from './ride-map';
import { toScreen } from './world';

afterEach(() => {
  document.body.replaceChildren();
});

/** A ride level's run, never drawn, with its car at the boarding station and its button. */
function riding() {
  const frame = document.createElement('div');
  document.body.append(frame);
  const m = openRun(
    frame,
    document.createElement('canvas'),
    document.createElement('button'),
    rideOptions([]),
  );
  const { ride, rideButton } = m;
  if (!ride || !rideButton) throw new Error('not a ride level');
  return { m, ride, button: rideButton };
}

/** Carries the car on for `dt` seconds with its own ride. */
const along = (m: MapRun, button: HTMLButtonElement, dt: number) =>
  rideAlong(m, m.ride as Ride, button, dt);

describe('the Ride on button', () => {
  it('is a plain button, hidden until the car stands at a station', () => {
    const frame = document.createElement('div');
    const button = makeRideButton(frame);
    expect([button.parentElement, button.type, button.className, button.hidden]).toEqual([
      frame,
      'button',
      'hud ride-on',
      true,
    ]);
  });

  it('says what pressing it does, with its key, and is only written again when that changes', () => {
    const { m, button } = riding();
    along(m, button, 0.1);
    expect([button.hidden, button.textContent]).toEqual([false, 'Start the ride Space']);
    const kbd = button.querySelector('kbd');
    along(m, button, 0.1);
    expect(button.querySelector('kbd')).toBe(kbd);
    Object.assign(m, { touchScreen: { matches: true } });
    along(m, button, 0.1);
    expect([button.textContent, button.querySelector('kbd')]).toEqual(['Start the ride', null]);
  });
});

describe('the car on its track', () => {
  it('waits at a station, its rider facing as they were, and the canvas says so once', async () => {
    const { m, button } = riding();
    m.facing = -1;
    const changes: string[] = [];
    new MutationObserver((records) => {
      for (const record of records) changes.push(String(record.attributeName));
    }).observe(m.canvas, { attributes: true });
    expect(along(m, button, 0.1)).toBe(true);
    expect(along(m, button, 0.1)).toBe(true);
    await Promise.resolve();
    expect(changes).toEqual(['data-ride']);
    expect([m.canvas.dataset.ride, m.facing, m.moving]).toEqual(['0 stopped', -1, false]);
    expect(m.near?.kind).toBe('exit');
  });

  it('rides on to the next station, the rider facing the way it goes', () => {
    const { m, button } = riding();
    m.selected = m.world.spots[0];
    rideOnward(m);
    expect(m.selected).toBeUndefined();
    const leaving = m.ride;
    // Riding, it can't be sent on again.
    rideOnward(m);
    expect(m.ride).toBe(leaving);
    m.facing = 0;
    const facing = [];
    for (let frame = 0; frame < 5; frame++) {
      const before = toScreen(m.player).x;
      along(m, button, 0.05);
      facing.push([Math.sign(toScreen(m.player).x - before), m.facing]);
    }
    expect(facing.filter(([way]) => way !== 0)).toHaveLength(5);
    for (const [way, faced] of facing) expect(faced).toBe(way);
    expect([m.moving, m.near, button.hidden, m.canvas.dataset.ride]).toEqual([
      true,
      undefined,
      true,
      '1 riding',
    ]);
    expect(m.player).toEqual(carAt(m.ride as Ride));
  });

  it('stands still while the player is inside a square, and keeps the button out of the way', () => {
    const { m, button, ride } = riding();
    button.hidden = false;
    m.visiting = m.world.spots.find((spot) => spot.kind === 'attraction');
    expect(along(m, button, 0.5)).toBe(false);
    expect([button.hidden, m.ride]).toEqual([true, ride]);
    rideOnward(m);
    expect(m.ride).toBe(ride);
  });
});

describe('the keys that ride on', () => {
  it('are Space, the right arrow and D, except Space on a button', () => {
    const { m } = riding();
    expect(rideKey(m, 'd', true)).toBe(true);
    expect(rideKey(m, ' ', true)).toBe(false);
    expect(rideKey(m, 'q', false)).toBe(false);
    expect(rideKey(m, 'arrowright', false)).toBe(true);
    expect(rideKey(m, ' ', false)).toBe(true);
  });
});
