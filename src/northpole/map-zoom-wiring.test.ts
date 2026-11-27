// @vitest-environment happy-dom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { startHarness, type MapHarness } from '../test-support/map-harness';
import { northPoleOptions } from '../test-support/map-fixtures';
import { screenToWorld, worldToScreen } from './camera-view';

let map: MapHarness | undefined;
beforeEach(() => vi.spyOn(console, 'error').mockImplementation(() => undefined));
afterEach(() => {
  vi.restoreAllMocks();
  map?.stop();
  map = undefined;
});

const cameraOf = (running: MapHarness) => {
  const [x = 0, y = 0, zoom = 0] = String(running.canvas.dataset.camera).split(',').map(Number);
  return { centre: { x, y }, zoom };
};

const wheel = (running: MapHarness, deltaY: number, at = { x: 300, y: 200 }) => {
  const event = new WheelEvent('wheel', { cancelable: true, deltaY });
  Object.defineProperties(event, { clientX: { value: at.x }, clientY: { value: at.y } });
  running.canvas.dispatchEvent(event);
  return event;
};

describe('the wheel over a map that is not at the top-left of the page', () => {
  it('zooms round the point under the pointer, wherever the map sits', () => {
    map = startHarness(northPoleOptions([]), { width: 1500, height: 900, reduced: true });
    map.canvas.getBoundingClientRect = () => new DOMRect(50, 30, 1500, 900);
    map.step(0);
    const before = cameraOf(map);
    const under = screenToWorld({ x: 250, y: 170 }, 1500, 900, before.centre, before.zoom);
    wheel(map, -100);
    map.step(100);
    const after = cameraOf(map);
    expect(after.zoom).toBeGreaterThan(before.zoom);
    const still = worldToScreen(under, 1500, 900, after.centre, after.zoom);
    expect(still.x).toBeCloseTo(250, -1);
    expect(still.y).toBeCloseTo(170, -1);
  });
});

describe('the wheel at the nearest the camera comes', () => {
  it('leaves the camera on its way to where it was going', () => {
    map = startHarness(northPoleOptions([]), { width: 1500, height: 900 });
    map.step(0);
    const nearer = map.frame.querySelector<HTMLButtonElement>('.hud-zoom button');
    for (let n = 0; n < 15; n++) nearer?.click();
    for (let t = 100; t < 3000; t += 100) map.step(t);
    map.controls.jumpTo('booth', 'dancer');
    map.step(3100);
    const leaving = cameraOf(map).centre;
    wheel(map, -100, { x: 100, y: 100 });
    for (let t = 3200; t < 6000; t += 100) map.step(t);
    expect(cameraOf(map).centre).not.toEqual(leaving);
  });
});

describe("the zoom's listeners", () => {
  it('keep the page from scrolling under the wheel, and are all let go when the map stops', () => {
    const added = vi.spyOn(HTMLCanvasElement.prototype, 'addEventListener');
    map = startHarness(northPoleOptions([]), { width: 1500, height: 900, reduced: true });
    expect(added.mock.calls.find(([type]) => type === 'wheel')?.[2]).toEqual({ passive: false });
    const buttons = [...map.frame.querySelectorAll<HTMLButtonElement>('.hud-zoom button')];
    const removed = buttons.map((button) => vi.spyOn(button, 'removeEventListener'));
    const { canvas } = map;
    map.stop();
    map = undefined;
    for (const spy of removed) expect(spy.mock.calls.map(([type]) => type)).toEqual(['click']);
    expect(wheel({ canvas } as MapHarness, -100).defaultPrevented).toBe(false);
  });
});
