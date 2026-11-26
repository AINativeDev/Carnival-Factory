// @vitest-environment happy-dom
import { afterEach, describe, expect, it } from 'vitest';
import { startHarness, type MapHarness } from '../test-support/map-harness';
import { click, key } from '../test-support/map-events';
import { LEVEL, levelOptions, type Told } from '../test-support/map-fixtures';
import { boothBox, centredBox, fullBox, wideBox } from './visit-stage';
import { roomArea } from './interior';
import { levelWorld } from './level';

let map: MapHarness | undefined;
afterEach(() => {
  map?.stop();
  map = undefined;
  document.body.replaceChildren();
});

/** Inside a level's square, on a laptop-sized screen, once the fade is over. */
function inside() {
  const told: Told = [];
  const level = { name: 'Test Fair', tint: 'tint', world: levelWorld(LEVEL), id: 'inside' };
  map = startHarness({ ...levelOptions(told), level });
  map.step(0);
  map.controls.visit('attraction', 'cocoa');
  for (let t = 100; t < 900; t += 100) map.step(t);
  return { running: map, told };
}

describe('inside a square', () => {
  it('draws the square in the middle, between a column either side', () => {
    const { running } = inside();
    const box = centredBox(1200, 800);
    if (!box) throw new Error('A 1200 by 800 screen has room for columns');
    expect(running.canvas.dataset.stage).toBe(
      [box.x, box.y, box.w, box.h].map((n) => Math.round(n)).join(','),
    );
  });

  it('draws the square alone in the middle of the whole screen, full screen', () => {
    const { running } = inside();
    (running.canvas.parentElement as HTMLElement).classList.add('map-frame');
    (running.canvas.parentElement as HTMLElement).dataset.full = '';
    running.step(1000);
    const box = fullBox(1200, 800);
    expect(running.canvas.dataset.stage).toBe(
      [box.x, box.y, box.w, box.h].map((n) => Math.round(n)).join(','),
    );
  });

  it('walks nowhere, by key or by click, so nobody leaves by accident', () => {
    const { running, told } = inside();
    const at = running.canvas.dataset.stage;
    key('keydown', 'ArrowDown');
    for (let t = 1000; t < 3000; t += 100) running.step(t);
    key('keyup', 'ArrowDown');
    click(running, { x: 600, y: 790 });
    for (let t = 3000; t < 5000; t += 100) running.step(t);
    expect(running.canvas.dataset.stage).toBe(at);
    expect(told).not.toContainEqual(['leave']);
  });
});

describe('a square on a narrower laptop', () => {
  it('stands flush against the panel when there is no room for a column either side', () => {
    const level = { name: 'Test Fair', tint: 'tint', world: levelWorld(LEVEL), id: 'narrow' };
    map = startHarness({ ...levelOptions([]), level }, { width: 900, height: 700 });
    map.step(0);
    map.controls.visit('attraction', 'cocoa');
    for (let t = 100; t < 900; t += 100) map.step(t);
    const box = boothBox(roomArea(900, 700));
    expect(map.canvas.dataset.stage).toBe(
      [box.x, box.y, box.w, box.h].map((n) => Math.round(n)).join(','),
    );
  });
});

describe('a square on a phone held upright', () => {
  it('draws the square across the width, under the way back', () => {
    const told: Told = [];
    const level = { name: 'Test Fair', tint: 'tint', world: levelWorld(LEVEL), id: 'upright' };
    map = startHarness({ ...levelOptions(told), level }, { width: 390, height: 844 });
    map.step(0);
    map.controls.visit('attraction', 'cocoa');
    for (let t = 100; t < 900; t += 100) map.step(t);
    const box = wideBox(390);
    expect(map.canvas.dataset.stage).toBe([box.x, box.y, box.w, box.h].join(','));
  });
});
