// @vitest-environment happy-dom
import { afterEach, describe, expect, it } from 'vitest';
import { startHarness, type MapHarness } from '../test-support/map-harness';
import { click, key } from '../test-support/map-events';
import { LEVEL, levelOptions, type Told } from '../test-support/map-fixtures';
import { areaBox, wideBox } from './full-screen';
import { roomArea } from './interior';
import { levelWorld } from './level';

let map: MapHarness | undefined;
afterEach(() => {
  map?.stop();
  map = undefined;
  document.body.replaceChildren();
});

/** A square's room, its frame marked full screen as the Full screen pill marks it. */
function insideFullScreen() {
  const told: Told = [];
  const level = { name: 'Test Fair', tint: 'tint', world: levelWorld(LEVEL), id: 'full-screen' };
  map = startHarness({ ...levelOptions(told), level });
  map.step(0);
  map.controls.visit('attraction', 'cocoa');
  for (let t = 100; t < 800; t += 100) map.step(t);
  const frame = map.canvas.parentElement as HTMLElement;
  frame.classList.add('map-frame');
  frame.dataset.full = '';
  map.step(900);
  return { running: map, told };
}

describe('a square full screen', () => {
  it('draws the square as big as the space beside the panel allows, with no room round it', () => {
    const { running } = insideFullScreen();
    const box = areaBox(roomArea(1200, 800));
    expect(running.canvas.dataset.stage).toBe(
      [box.x, box.y, box.w, box.h].map((n) => Math.round(n)).join(','),
    );
  });

  it("doesn't walk the hidden player, by key or by click, so nobody leaves by accident", () => {
    const { running, told } = insideFullScreen();
    const at = running.canvas.dataset.room;
    key('keydown', 'ArrowDown');
    for (let t = 1000; t < 3000; t += 100) running.step(t);
    key('keyup', 'ArrowDown');
    click(running, { x: 600, y: 790 });
    for (let t = 3000; t < 5000; t += 100) running.step(t);
    expect(running.canvas.dataset.room).toBe(at);
    expect(told).not.toContainEqual(['leave']);
  });
});

describe('a square on a phone held upright', () => {
  it('draws the square across the width, under the way back, with no room round it', () => {
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
