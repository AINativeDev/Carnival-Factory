// @vitest-environment happy-dom
import { afterEach, describe, expect, it } from 'vitest';
import { startHarness, type MapHarness, type Screen } from '../test-support/map-harness';
import { click, key, screenAt } from '../test-support/map-events';
import type { Told } from '../test-support/map-fixtures';
import { rideOptions } from '../test-support/ride-fixtures';
import type { MapOptions } from './map-options';
import { remembered } from './map-state';

let map: MapHarness | undefined;
let told: Told = [];
afterEach(() => {
  map?.stop();
  map = undefined;
  document.body.replaceChildren();
});

/** Starts the test ride level, in a world of its own. */
const start = (screen?: Screen, extra: Partial<MapOptions> = {}) => {
  told = [];
  map = startHarness(rideOptions(told, extra), screen);
  return map;
};

/** Draws frames a tenth of a second apart from `from` to `to`. */
const frames = (running: MapHarness, from: number, to: number) => {
  for (let t = from; t < to; t += 100) running.step(t);
};

/** The ride's button, which a ride level always has. */
const button = (running: MapHarness) => {
  const found = running.frame.querySelector<HTMLButtonElement>('.ride-on');
  if (!found) throw new Error('no Ride on button');
  return found;
};

describe('riding a ride level', () => {
  it('starts in the car at the boarding station, by the sleigh home', () => {
    const running = start();
    running.step(0);
    running.step(16);
    expect(running.canvas.dataset.ride).toBe('0 stopped');
    expect(running.canvas.dataset.player).toBe('-2,2');
    expect(running.canvas.dataset.near).toBe('exit:north-pole');
    expect(button(running).hidden).toBe(false);
    expect(button(running).textContent).toBe('Start the ride Space');
  });

  it('rides on with Space to the next station, where its square is invited into', () => {
    const running = start();
    running.step(0);
    key('keydown', ' ');
    running.step(100);
    expect(running.canvas.dataset.ride).toBe('1 riding');
    expect(running.canvas.dataset.near).toBe('');
    expect(button(running).hidden).toBe(true);
    frames(running, 200, 3400);
    expect(running.canvas.dataset.ride).toBe('1 stopped');
    expect(running.canvas.dataset.near).toBe('attraction:skates');
    expect(button(running).textContent).toBe('Ride on Space');
    key('keydown', 'e');
    expect(told).toContainEqual(['open', 'attraction', 'skates']);
  });

  it('rides on with the right arrow, D, a click on the ground and the button, but never walks', () => {
    const running = start(undefined);
    running.step(0);
    const rideOn = (act: () => void, stop: number, until: number) => {
      act();
      frames(running, running.canvas.dataset.ride ? until - 9000 : 0, until);
      expect(running.canvas.dataset.ride).toBe(`${String(stop)} stopped`);
    };
    // The walking keys don't move the car, nor the player off it.
    for (const name of ['ArrowUp', 'w', 'a', 's', 'ArrowLeft', 'ArrowDown']) key('keydown', name);
    frames(running, 100, 600);
    expect(running.canvas.dataset.ride).toBe('0 stopped');
    expect(running.canvas.dataset.player).toBe('-2,2');
    rideOn(
      () => {
        key('keydown', 'ArrowRight');
      },
      1,
      9_100,
    );
    rideOn(
      () => {
        key('keydown', 'd');
      },
      2,
      18_100,
    );
    rideOn(
      () => {
        click(running, screenAt(running, { x: 5, y: -5 }));
      },
      0,
      27_100,
    );
    rideOn(
      () => {
        button(running).click();
      },
      1,
      36_100,
    );
  });

  it('leaves Space on a button to the button, and keys with a modifier alone', () => {
    const running = start();
    running.step(0);
    const other = document.createElement('button');
    document.body.append(other);
    other.dispatchEvent(new KeyboardEvent('keydown', { key: ' ', bubbles: true }));
    key('keydown', 'd', { ctrlKey: true });
    running.step(100);
    expect(running.canvas.dataset.ride).toBe('0 stopped');
  });

  it('only rides on from a station, and not from inside a square', () => {
    const running = start();
    running.step(0);
    key('keydown', ' ');
    running.step(100);
    key('keydown', ' ');
    frames(running, 200, 3400);
    expect(running.canvas.dataset.ride).toBe('1 stopped');
    running.controls.visit('attraction', 'skates');
    running.step(3500);
    expect(button(running).hidden).toBe(true);
    key('keydown', ' ');
    key('keydown', 'd');
    frames(running, 3600, 4000);
    running.controls.leave();
    running.step(4100);
    expect(running.canvas.dataset.ride).toBe('1 stopped');
    expect(button(running).hidden).toBe(false);
  });

  it('takes the car to the station of a square opened from afar, or jumped to', () => {
    const running = start();
    running.step(0);
    running.controls.visit('attraction', 'cocoa');
    running.step(100);
    running.controls.leave();
    running.step(200);
    expect(running.canvas.dataset.ride).toBe('2 stopped');
    expect(running.canvas.dataset.near).toBe('attraction:cocoa');
    running.controls.jumpTo('attraction', 'skates');
    running.step(300);
    expect(running.canvas.dataset.ride).toBe('1 stopped');
    running.controls.visit('attraction', 'skates');
    running.controls.jumpTo('attraction', 'cocoa');
    expect(told).toContainEqual(['leave']);
  });

  it('starts at the station of the square the page opened on', () => {
    const running = start(undefined, { focus: { kind: 'attraction', id: 'cocoa' } });
    running.step(0);
    expect(running.canvas.dataset.ride).toBe('2 stopped');
  });

  it('boards at the first station when the player was last off the track', () => {
    told = [];
    const options = rideOptions(told);
    remembered.set(options.level?.id ?? '', { x: 6, y: 4 });
    map = startHarness(options);
    map.step(0);
    expect(map.canvas.dataset.ride).toBe('0 stopped');
  });

  it('jumps station to station for reduced motion, with no key on a touch screen', () => {
    const running = start({ reduced: true, coarse: true, width: 390, height: 700 });
    running.step(0);
    expect(button(running).textContent).toBe('Start the ride');
    button(running).click();
    running.step(100);
    expect(running.canvas.dataset.ride).toBe('1 stopped');
  });

  it('takes the sleigh home from the boarding station', () => {
    const running = start();
    running.step(0);
    key('keydown', 'e');
    expect(told).toContainEqual(['travel', undefined]);
  });

  it('lets go of the button when the map stops', () => {
    const running = start();
    running.step(0);
    running.stop();
    map = undefined;
    expect(document.querySelector('.ride-on')).toBeNull();
  });
});
