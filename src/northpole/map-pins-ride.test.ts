// @vitest-environment happy-dom
/**
 * Pins what the map draws and says while a visitor rides a ride level (ADR
 * 0041), frame by frame: the car with the player in it, the stations, the
 * camera following, and the call to action at each stop, so a later change to
 * the map is proven to leave the ride as it was.
 */
import { afterEach, describe, expect, it } from 'vitest';
import { fingerprint, type CanvasCall } from '../test-support/recording-canvas';
import { startHarness, type MapHarness, type Screen } from '../test-support/map-harness';
import { key } from '../test-support/map-events';
import type { Told } from '../test-support/map-fixtures';
import { rideOptions } from '../test-support/ride-fixtures';

let map: MapHarness | undefined;
afterEach(() => map?.stop());

/** Runs a ride and gives back one fingerprint of every frame and page state on it. */
function journey(steps: (frame: (time: number) => void) => void, screen?: Screen) {
  const told: Told = [];
  map = startHarness(rideOptions(told), screen);
  const all: CanvasCall[] = [...map.started];
  const running = map;
  const frame = (time: number) => {
    all.push(...running.step(time), ['page', running.page()]);
  };
  steps(frame);
  all.push(['told', JSON.stringify(told)]);
  return fingerprint(all);
}

describe('riding a level', () => {
  it('boards, rides over the lift hill and the drop to a station, and on round the loop', () => {
    const pin = journey((frame) => {
      frame(0);
      key('keydown', ' ');
      for (let t = 50; t < 3400; t += 150) frame(t);
      key('keydown', 'e');
      key('keydown', 'ArrowRight');
      for (let t = 3400; t < 6000; t += 150) frame(t);
    });
    expect(pin).toMatchInlineSnapshot(`"2c2abd6129e76750 (178060 calls)"`);
  });

  it('keeps still for reduced motion, jumping from station to station', () => {
    const pin = journey(
      (frame) => {
        frame(0);
        key('keydown', 'd');
        frame(100);
        key('keydown', 'd');
        frame(200);
      },
      { width: 390, height: 700, coarse: true, reduced: true },
    );
    expect(pin).toMatchInlineSnapshot(`"99d2b72649b55e34 (12534 calls)"`);
  });
});
