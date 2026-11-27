// @vitest-environment happy-dom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { startHarness, type MapHarness } from '../test-support/map-harness';
import { point, screenAt } from '../test-support/map-events';
import { northPoleOptions, type Told } from '../test-support/map-fixtures';
import { rideOptions } from '../test-support/ride-fixtures';
import { layWorld } from './map-plan';
import type { MapOptions } from './map-options';

let map: MapHarness | undefined;
let told: Told = [];
// The fixtures' broken square says so on the console, every frame.
beforeEach(() => vi.spyOn(console, 'error').mockImplementation(() => undefined));
afterEach(() => {
  map?.stop();
  map = undefined;
  told = [];
  vi.restoreAllMocks();
});

const start = (options: MapOptions) => {
  map = startHarness(options);
  map.step(0);
  return map;
};

describe('the pointer leaving the map', () => {
  it("stops a mouse's hovering, but leaves a finger's tag showing", () => {
    const options = northPoleOptions(told);
    const open = layWorld(options, []).spots.find((spot) => spot.kind === 'open');
    if (!open) throw new Error('no open spot');
    const running = start(options);
    running.controls.jumpTo('booth', 'jedi4ever');
    for (let t = 100; t < 400; t += 100) running.step(t);
    const centre = { x: open.x + open.w / 2, y: open.y + open.h / 2 };
    point(running, 'pointermove', screenAt(running, centre));
    running.step(400);
    expect(running.tag()?.dataset.spot).toMatch(/^open:/);
    point(running, 'pointerleave', screenAt(running, centre), { pointerType: 'touch' });
    running.step(500);
    expect(running.tag()?.dataset.spot).toMatch(/^open:/);
    expect(running.tag()?.classList.contains('shown')).toBe(true);
    point(running, 'pointerleave', screenAt(running, centre));
    running.step(600);
    // The call to action already names the booth the player stands at, so the tag goes.
    expect(running.tag()?.classList.contains('shown')).toBe(false);
  });
});

describe('a stopped map', () => {
  it('no longer hears its call to action', () => {
    const running = start(northPoleOptions(told, { focus: { kind: 'booth', id: 'comet' } }));
    running.prompt.click();
    expect(told).toContainEqual(['open', 'booth', 'comet']);
    told.length = 0;
    const { prompt } = running;
    running.stop();
    map = undefined;
    prompt.click();
    expect(told).toEqual([]);
  });

  it("no longer hears a ride's button", () => {
    const running = start(rideOptions(told));
    const button = running.frame.querySelector<HTMLButtonElement>('.ride-on');
    if (!button) throw new Error('no Ride on button');
    running.controls.jumpTo('attraction', 'skates');
    button.click();
    expect(told.at(-1)).toEqual(['select', undefined, undefined]);
    running.stop();
    map = undefined;
    running.controls.jumpTo('attraction', 'skates');
    told.length = 0;
    button.click();
    expect(told).toEqual([]);
  });
});
