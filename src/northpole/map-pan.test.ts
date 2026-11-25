// @vitest-environment happy-dom
import { afterEach, describe, expect, it } from 'vitest';
import { startHarness, type MapHarness } from '../test-support/map-harness';
import { click, key, point } from '../test-support/map-events';
import { northPoleOptions, type Told } from '../test-support/map-fixtures';

/**
 * Dragging the map with the mouse looks round it, as a finger does on a phone
 * (docs/specs/map-and-world.md): a press that moves past a tap's slop pans the
 * camera, and its release is not a click.
 */
let map: MapHarness | undefined;
let told: Told = [];
afterEach(() => {
  map?.stop();
  map = undefined;
  document.body.replaceChildren();
});

const start = () => {
  told = [];
  map = startHarness(northPoleOptions(told));
  map.step(0);
  return map;
};

/** Frames from `from` for a while, and where the player stands after them. */
const walked = (running: MapHarness, from: number) => {
  for (let t = from; t < from + 800; t += 100) running.step(t);
  return running.canvas.dataset.player;
};

/** The camera's centre, as `data-camera` says. */
const cameraOf = (running: MapHarness) => {
  const [x = NaN, y = NaN, zoom = NaN] = String(running.canvas.dataset.camera)
    .split(',')
    .map(Number);
  return { x, y, zoom };
};

/** Presses the primary button at `from`, drags it to `to` and lets go, with the click a browser sends. */
const drag = (
  running: MapHarness,
  from: { x: number; y: number },
  to: { x: number; y: number },
) => {
  point(running, 'pointerdown', from, { buttons: 1 });
  point(running, 'pointermove', to, { buttons: 1 });
  point(running, 'pointerup', to);
  point(running, 'click', to);
};

describe('dragging with the mouse', () => {
  it('pans the camera, shows the grabbing hand, and its release neither walks nor opens', () => {
    const running = start();
    const before = cameraOf(running);
    const player = running.canvas.dataset.player;
    point(running, 'pointerdown', { x: 600, y: 400 }, { buttons: 1 });
    point(running, 'pointermove', { x: 603, y: 400 }, { buttons: 1 });
    expect(running.canvas.style.cursor).not.toBe('grabbing');
    point(running, 'pointermove', { x: 700, y: 450 }, { buttons: 1 });
    expect(running.canvas.style.cursor).toBe('grabbing');
    point(running, 'pointerup', { x: 700, y: 450 });
    expect(running.canvas.style.cursor).toBe('default');
    point(running, 'click', { x: 700, y: 450 });
    running.step(100);
    const after = cameraOf(running);
    expect(after.x).toBeLessThan(before.x);
    expect(after.y).toBeLessThan(before.y);
    expect(walked(running, 200)).toBe(player);
    expect(running.controls.visiting).toBeUndefined();
    expect(told).toEqual([]);
  });

  it('still walks on a press and release that barely moves', () => {
    const running = start();
    const player = running.canvas.dataset.player;
    click(running, { x: 900, y: 600 });
    expect(walked(running, 100)).not.toBe(player);
  });

  it('never shows past the island, however far it drags', () => {
    const running = start();
    drag(running, { x: 600, y: 400 }, { x: 590, y: 400 });
    running.step(100);
    const edge = cameraOf(running);
    drag(running, { x: 600, y: 400 }, { x: -50_000, y: 400 });
    running.step(200);
    const far = cameraOf(running);
    drag(running, { x: 600, y: 400 }, { x: -60_000, y: 400 });
    running.step(300);
    expect(cameraOf(running)).toEqual(far);
    expect(far.x).toBeGreaterThan(edge.x);
    expect(Number.isFinite(far.x)).toBe(true);
  });

  it('pans only with the primary button, and stops when the button was let go elsewhere', () => {
    const running = start();
    const before = cameraOf(running);
    point(running, 'pointerdown', { x: 600, y: 400 }, { button: 2, buttons: 2 });
    point(running, 'pointermove', { x: 700, y: 400 }, { buttons: 2 });
    running.step(100);
    expect(cameraOf(running)).toEqual(before);
    point(running, 'pointerdown', { x: 600, y: 400 }, { buttons: 1 });
    point(running, 'pointermove', { x: 600, y: 400 }, { buttons: 0 });
    point(running, 'pointermove', { x: 700, y: 400 }, { buttons: 0 });
    running.step(200);
    expect(cameraOf(running)).toEqual(before);
  });

  it('a walk takes the camera back from where a drag left it', () => {
    /** Where the camera settles after a walk to the same spot, dragged first or not. */
    const settled = (dragFirst: boolean) => {
      const running = start();
      if (dragFirst) drag(running, { x: 600, y: 400 }, { x: 750, y: 500 });
      running.step(100);
      key('keydown', 'd');
      for (let t = 200; t < 1000; t += 100) running.step(t);
      key('keyup', 'd');
      for (let t = 1000; t < 8000; t += 100) running.step(t);
      const camera = cameraOf(running);
      running.stop();
      map = undefined;
      return camera;
    };
    const walkedOnly = settled(false);
    expect(settled(true)).toEqual(walkedOnly);
  });

  it('does nothing to the camera inside a square, where the pointer plays with it', () => {
    const running = start();
    running.controls.visit('attraction', 'ferris-wheel');
    for (let t = 100; t < 3000; t += 100) running.step(t);
    const before = running.canvas.dataset.camera;
    drag(running, { x: 600, y: 400 }, { x: 800, y: 500 });
    point(running, 'pointermove', { x: 900, y: 600 }, { buttons: 1 });
    running.step(3100);
    expect(running.canvas.dataset.camera).toBe(before);
    expect(running.canvas.style.cursor).not.toBe('grabbing');
  });
});
