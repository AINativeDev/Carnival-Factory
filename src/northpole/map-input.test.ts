// @vitest-environment happy-dom
import { afterEach, describe, expect, it } from 'vitest';
import { startHarness, type MapHarness, type Screen } from '../test-support/map-harness';
import { click, key, point, screenAt } from '../test-support/map-events';
import { LEVEL, levelOptions, northPoleOptions, type Told } from '../test-support/map-fixtures';
import { levelWorld } from './level';

let map: MapHarness | undefined;
let told: Told = [];
afterEach(() => {
  map?.stop();
  map = undefined;
  document.body.replaceChildren();
});

/** Starts the test level, in a world of its own so where an earlier test left the player doesn't count. */
const start = (screen?: Screen) => {
  told = [];
  const options = levelOptions(told);
  const level = { ...LEVEL_PLACE, world: levelWorld(LEVEL) };
  map = startHarness({ ...options, level: { ...level, id: `input-${String(++worlds)}` } }, screen);
  return map;
};
let worlds = 0;
const LEVEL_PLACE = { name: 'Test Fair', tint: 'tint' };

/** The bottom of the stage inside a room, on the screen. */
const y0 = (running: MapHarness) => {
  const [, y = 0, , h = 0] = String(running.canvas.dataset.stage).split(',').map(Number);
  return y + h;
};

/** Draws frames from `from` to `to`. */
const frames = (running: MapHarness, from: number, to: number) => {
  for (let t = from; t < to; t += 100) running.step(t);
};

/** Where the player stands after a few frames. */
const walked = (running: MapHarness, from: number) => {
  for (let t = from; t < from + 600; t += 100) running.step(t);
  return running.canvas.dataset.player;
};

describe('keys', () => {
  it('leave typing in a field, and shortcuts with a modifier, alone', () => {
    const running = start();
    running.step(0);
    const at = running.canvas.dataset.player;
    const field = document.createElement('input');
    document.body.append(field);
    field.dispatchEvent(new KeyboardEvent('keydown', { key: 'd', bubbles: true }));
    key('keydown', 'd', { metaKey: true });
    key('keydown', 'd', { ctrlKey: true });
    key('keydown', 'd', { altKey: true });
    expect(walked(running, 100)).toBe(at);
  });

  it('open the square invited into with E, but not Enter on a button, nor from inside', () => {
    const running = start();
    running.controls.jumpTo('attraction', 'skates');
    running.step(0);
    const button = document.createElement('button');
    document.body.append(button);
    button.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
    expect(told.filter(([what]) => what === 'open')).toEqual([]);
    running.controls.visit('attraction', 'skates');
    key('keydown', 'e');
    expect(told.filter(([what]) => what === 'open')).toEqual([]);
    running.prompt.click();
    running.controls.leave();
    key('keydown', 'Escape');
    key('keydown', 'e');
    expect(told).toContainEqual(['open', 'attraction', 'skates']);
  });

  it('let go of the picked square with Escape, and open it from afar with E or the prompt', () => {
    const running = start();
    running.step(0);
    running.controls.walkTo('attraction', 'cocoa');
    key('keydown', 'Escape');
    expect(running.controls.selected).toBeUndefined();
    running.controls.walkTo('attraction', 'cocoa');
    key('keydown', 'e');
    running.controls.walkTo('attraction', 'skates');
    running.step(100);
    running.prompt.click();
    expect(told.filter(([what]) => what === 'open')).toEqual([
      ['open', 'attraction', 'cocoa'],
      ['open', 'attraction', 'skates'],
    ]);
  });

  it('walk inside a room', () => {
    const running = start();
    running.step(0);
    running.controls.visit('attraction', 'cocoa');
    frames(running, 100, 800);
    const at = running.canvas.dataset.room;
    key('keydown', 'w');
    frames(running, 800, 1200);
    key('keyup', 'w');
    expect(running.canvas.dataset.room).not.toBe(at);
  });

  it('do nothing with nothing invited into', () => {
    const running = start();
    running.step(0);
    key('keydown', 'e');
    key('keydown', 'Escape');
    running.prompt.click();
    expect(told).toEqual([]);
  });
});

describe('the mouse', () => {
  it('walks where it clicks before the first frame, with no camera yet', () => {
    const running = start();
    click(running, { x: 10, y: 10 });
    expect(walked(running, 0)).toBeDefined();
  });

  it('does not count a drag as a click', () => {
    const running = start();
    running.step(0);
    const at = running.canvas.dataset.player;
    const from = screenAt(running, { x: 0, y: -2 });
    point(running, 'pointerdown', from, { buttons: 1 });
    point(running, 'pointermove', { x: from.x + 80, y: from.y }, { buttons: 1 });
    point(running, 'pointerup', { x: from.x + 80, y: from.y });
    point(running, 'click', { x: from.x + 80, y: from.y });
    expect(walked(running, 100)).toBe(at);
  });

  it('hovers nothing while inside, and walks out of the room through its doorway', () => {
    const running = start();
    running.step(0);
    running.controls.visit('attraction', 'cocoa');
    for (let t = 100; t < 800; t += 100) running.step(t);
    point(running, 'pointermove', { x: 600, y: 400 });
    expect(running.canvas.style.cursor).toBe('default');
    click(running, { x: 2, y: 2 });
    const [x = 0, y = 0, w = 0, h = 0] = String(running.canvas.dataset.stage)
      .split(',')
      .map(Number);
    point(running, 'pointermove', { x: x + w / 2, y: y + h / 2 });
    running.step(900);
    expect(running.canvas.dataset.pointer).toBe('attraction:cocoa');
    // The doorway is at the middle of the room's front edge, below the stage.
    let t = 1000;
    for (let y = y0(running); !told.length && y < 800; y += 10) {
      click(running, { x: x + w / 2, y });
      for (const end = t + 1500; t < end; t += 100) running.step(t);
    }
    expect(told).toContainEqual(['leave']);
  });
});

describe('fingers', () => {
  const touch = { pointerType: 'touch' };

  it('do nothing before the first frame, or inside a square', () => {
    const running = start({ coarse: true });
    point(running, 'pointerdown', { x: 100, y: 100 }, { ...touch, pointerId: 3 });
    point(running, 'pointermove', { x: 200, y: 200 }, { ...touch, pointerId: 3 });
    point(running, 'pointermove', { x: 200, y: 200 }, { ...touch, pointerId: 4 });
    point(running, 'pointerleave', { x: 200, y: 200 }, { ...touch, pointerId: 3 });
    running.step(0);
    running.controls.visit('attraction', 'skates');
    point(running, 'pointerdown', { x: 100, y: 100 }, { ...touch, pointerId: 5 });
    expect(running.controls.visiting).toEqual({ kind: 'attraction', id: 'skates' });
  });

  it.each([false, true])(
    'move the camera round the North Pole once a drag is longer than a tap (reduced motion: %s)',
    (reduced) => {
      told = [];
      const running = (map = startHarness(northPoleOptions(told), { coarse: true, reduced }));
      running.step(0);
      const camera = running.canvas.dataset.camera;
      point(running, 'pointerdown', { x: 100, y: 300 }, { ...touch, pointerId: 1 });
      point(running, 'pointermove', { x: 101, y: 300 }, { ...touch, pointerId: 1 });
      running.step(100);
      expect(running.canvas.dataset.camera).toBe(camera);
      point(running, 'pointermove', { x: 200, y: 300 }, { ...touch, pointerId: 1 });
      running.step(200);
      expect(running.canvas.dataset.camera).not.toBe(camera);
      point(running, 'pointerup', { x: 300, y: 300 }, { ...touch, pointerId: 9 });
      point(running, 'pointerdown', { x: 300, y: 300 }, { ...touch, pointerId: 2 });
      point(running, 'pointerdown', { x: 300, y: 400 }, { ...touch, pointerId: 3 });
      point(running, 'pointerup', { x: 300, y: 400 }, { ...touch, pointerId: 3 });
      point(running, 'pointerup', { x: 300, y: 300 }, { ...touch, pointerId: 2 });
      point(running, 'pointermove', { x: 250, y: 300 }, { ...touch, pointerId: 1 });
      point(running, 'pointerup', { x: 250, y: 300 }, { ...touch, pointerId: 1 });
      running.step(300);
      expect(running.canvas.dataset.camera).toBeDefined();
    },
  );
});
