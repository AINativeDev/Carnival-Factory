// @vitest-environment happy-dom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { startHarness, type MapHarness, type Screen } from '../test-support/map-harness';
import { key } from '../test-support/map-events';
import { northPoleOptions } from '../test-support/map-fixtures';
import { MAX_PINCH_ZOOM, screenToWorld, worldToScreen } from './camera-view';
import { makeZoomButtons } from './map-zoom-buttons';

let map: MapHarness | undefined;
// The fixtures' broken square says so on the console, every frame.
beforeEach(() => vi.spyOn(console, 'error').mockImplementation(() => undefined));
afterEach(() => {
  vi.restoreAllMocks();
  map?.stop();
  map = undefined;
  document.body.replaceChildren();
});

/** The North Pole, standing still for reduced motion, so the camera goes straight where it's aimed. */
const start = (screen: Screen = {}) => {
  map = startHarness(northPoleOptions([]), { width: 1500, height: 900, reduced: true, ...screen });
  map.step(0);
  return map;
};

/** The camera's centre and zoom, as the last frame left them. */
const cameraOf = (running: MapHarness) => {
  const [x = 0, y = 0, zoom = 0] = String(running.canvas.dataset.camera).split(',').map(Number);
  return { centre: { x, y }, zoom };
};

/** The zoom after the next frame. */
const zoomAfter = (running: MapHarness, time: number) => {
  running.step(time);
  return cameraOf(running).zoom;
};

const button = (running: MapHarness, label: string) =>
  running.frame.querySelector<HTMLButtonElement>(`.hud-zoom button[aria-label="${label}"]`);

/** Turns the wheel over the map at (300, 200). happy-dom's WheelEvent has no place of its own, so it's given one. */
const wheel = (running: MapHarness, init: WheelEventInit) => {
  const event = new WheelEvent('wheel', { cancelable: true, ...init });
  Object.defineProperties(event, { clientX: { value: 300 }, clientY: { value: 200 } });
  running.canvas.dispatchEvent(event);
  return event;
};

describe('the zoom buttons', () => {
  it('are a labelled pair over the map, gone when the map stops', () => {
    const running = start();
    expect(button(running, 'Zoom in')?.textContent).toBe('+');
    expect(button(running, 'Zoom out')?.textContent).toBe('−');
    running.stop();
    expect(running.frame.querySelector('.hud-zoom')).toBeNull();
    map = undefined;
  });

  it('stand beside the page own actions over the map, when it has them', () => {
    const frame = document.createElement('div');
    frame.innerHTML = '<div class="hud-actions"></div>';
    expect(makeZoomButtons(frame).element.parentElement?.className).toBe('hud-actions');
    expect(makeZoomButtons(document.createElement('div')).element.parentElement).not.toBeNull();
  });

  it('zoom in and out a step at a time, and turn off at the limits', () => {
    const running = start();
    const before = cameraOf(running).zoom;
    button(running, 'Zoom in')?.click();
    expect(zoomAfter(running, 100)).toBeGreaterThan(before);
    for (let n = 0; n < 12; n++) button(running, 'Zoom in')?.click();
    expect(zoomAfter(running, 200)).toBe(MAX_PINCH_ZOOM);
    expect(button(running, 'Zoom in')?.disabled).toBe(true);
    expect(button(running, 'Zoom out')?.disabled).toBe(false);
    for (let n = 0; n < 20; n++) button(running, 'Zoom out')?.click();
    const fit = zoomAfter(running, 300);
    expect(fit).toBeLessThan(before);
    expect(button(running, 'Zoom out')?.disabled).toBe(true);
    expect(button(running, 'Zoom in')?.disabled).toBe(false);
    running.controls.toggleOverview();
    expect(zoomAfter(running, 400)).toBe(fit);
  });

  it('keep the visitor zoom while the player walks, until the overview goes on or off', () => {
    const running = start();
    button(running, 'Zoom in')?.click();
    const chosen = zoomAfter(running, 100);
    key('keydown', 'd');
    for (let t = 200; t < 1200; t += 100) running.step(t);
    key('keyup', 'd');
    expect(cameraOf(running).zoom).toBe(chosen);
    running.controls.toggleOverview();
    running.controls.toggleOverview();
    expect(zoomAfter(running, 1300)).not.toBe(chosen);
  });
});

describe('the zoom keys', () => {
  it('zoom in with + or =, and out with - or _', () => {
    const running = start();
    // Out first, clear of the nearest limit the resting view sits close to.
    key('keydown', '-');
    key('keydown', '-');
    const before = zoomAfter(running, 50);
    key('keydown', '+');
    const nearer = zoomAfter(running, 100);
    key('keydown', '=');
    expect(zoomAfter(running, 200)).toBeGreaterThan(nearer);
    key('keydown', '-');
    key('keydown', '_');
    expect(zoomAfter(running, 300)).toBeCloseTo(before);
  });

  it('leave typing, shortcuts, other keys and the inside of a square alone', () => {
    const running = start();
    const before = cameraOf(running).zoom;
    const field = document.createElement('input');
    document.body.append(field);
    field.dispatchEvent(new KeyboardEvent('keydown', { key: '+', bubbles: true }));
    key('keydown', '+', { ctrlKey: true });
    key('keydown', '-', { metaKey: true });
    key('keydown', '+', { altKey: true });
    key('keydown', 'q');
    expect(zoomAfter(running, 100)).toBe(before);
    running.controls.visit('attraction', 'ferris-wheel');
    const pressed = new KeyboardEvent('keydown', { key: '+', cancelable: true });
    window.dispatchEvent(pressed);
    expect(pressed.defaultPrevented).toBe(false);
  });

  it('wait for the first frame', () => {
    const zoom = cameraOf(start()).zoom;
    map?.stop();
    map = startHarness(northPoleOptions([]), { width: 1500, height: 900, reduced: true });
    key('keydown', '+');
    expect(zoomAfter(map, 0)).toBe(zoom);
  });
});

describe('the wheel', () => {
  it('zooms round the pointer, and keeps the page from scrolling under the map', () => {
    const running = start();
    const before = cameraOf(running);
    const under = screenToWorld({ x: 300, y: 200 }, 1500, 900, before.centre, before.zoom);
    const turned = wheel(running, { deltaY: -100 });
    expect(turned.defaultPrevented).toBe(true);
    running.step(100);
    const after = cameraOf(running);
    expect(after.zoom).toBeGreaterThan(before.zoom);
    const still = worldToScreen(under, 1500, 900, after.centre, after.zoom);
    expect(still.x).toBeCloseTo(300, -1);
    expect(still.y).toBeCloseTo(200, -1);
    wheel(running, { deltaY: -40 });
    expect(zoomAfter(running, 200)).toBeGreaterThan(after.zoom);
  });

  it('zooms out, a trackpad pinch too, and still keeps the page put at a limit', () => {
    const running = start();
    const before = cameraOf(running).zoom;
    wheel(running, { deltaY: 30, ctrlKey: true });
    const farther = zoomAfter(running, 100);
    expect(farther).toBeLessThan(before);
    for (let n = 0; n < 40; n++) wheel(running, { deltaY: 3, deltaMode: 1 });
    const fit = zoomAfter(running, 200);
    expect(wheel(running, { deltaY: 100 }).defaultPrevented).toBe(true);
    expect(zoomAfter(running, 300)).toBe(fit);
  });

  it('lets the page have the wheel inside a square', () => {
    const running = start();
    running.controls.visit('attraction', 'ferris-wheel');
    expect(wheel(running, { deltaY: -100 }).defaultPrevented).toBe(false);
  });
});
