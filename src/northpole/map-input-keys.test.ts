// @vitest-environment happy-dom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { startHarness, type MapHarness } from '../test-support/map-harness';
import { key } from '../test-support/map-events';
import { LEVEL, levelOptions, square, type Told } from '../test-support/map-fixtures';
import { levelWorld } from './level';

/**
 * The keys a square hears while the player is inside it (ADR 0064): the
 * arrows, Enter and Space go to its next frame instead of walking anyone.
 */
let map: MapHarness | undefined;
let told: Told = [];
let worlds = 0;
const LEVEL_PLACE = { name: 'Test Fair', tint: 'tint' };
afterEach(() => {
  map?.stop();
  map = undefined;
  document.body.replaceChildren();
});

/** Where the player stands after a few frames. */
const walked = (running: MapHarness, from: number) => {
  for (let t = from; t < from + 600; t += 100) running.step(t);
  return running.canvas.dataset.player;
};

describe('keys inside a square', () => {
  /** The map with a cocoa stand that notes the keys each of its frames hears. */
  const hearing = () => {
    const heard: unknown[] = [];
    const draw = vi.fn(
      (_ctx: unknown, _size: number, _time: number, _pointer?: unknown, keys?: unknown) => {
        if (keys !== undefined && (keys as unknown[]).length) heard.push(keys);
      },
    );
    told = [];
    const options = levelOptions(told, { attractions: [square('skates'), square('cocoa', draw)] });
    const level = { ...LEVEL_PLACE, world: levelWorld(LEVEL) };
    map = startHarness({ ...options, level: { ...level, id: `input-${String(++worlds)}` } });
    return { running: map, heard };
  };

  it('go to the square, once each and in order, and never walk the player', () => {
    const { running, heard } = hearing();
    running.step(0);
    key('keydown', 'ArrowRight');
    running.controls.visit('attraction', 'cocoa');
    running.step(100);
    const at = running.canvas.dataset.player;
    expect(key('keydown', 'ArrowRight')).toBe(false);
    key('keydown', ' ');
    key('keydown', 'Enter');
    key('keydown', 'ArrowLeft');
    running.step(200);
    running.step(300);
    expect(heard).toEqual([['right', 'space', 'enter', 'left']]);
    expect(walked(running, 400)).toBe(at);
  });

  it('leave Enter on a button, other keys, and more than a frame carries, alone', () => {
    const { running, heard } = hearing();
    running.step(0);
    running.controls.visit('attraction', 'cocoa');
    running.step(100);
    const button = document.createElement('button');
    document.body.append(button);
    button.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
    expect(key('keydown', 'x')).toBe(true);
    for (let n = 0; n < 12; n++) key('keydown', 'ArrowDown');
    running.step(200);
    running.step(300);
    expect(heard).toEqual([Array.from({ length: 8 }, () => 'down')]);
  });

  it('never carry over from one visit to the next square', () => {
    const { running, heard } = hearing();
    running.step(0);
    running.controls.visit('attraction', 'skates');
    key('keydown', 'ArrowUp');
    running.controls.visit('attraction', 'cocoa');
    running.step(100);
    expect(heard).toEqual([]);
  });
});
