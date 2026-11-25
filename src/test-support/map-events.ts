/**
 * What a visitor does to the map in its tests: keys, the mouse and fingers,
 * aimed at a tile of the world through the camera the map last drew with.
 * Separate from the harness, which only runs the map, so each stays small.
 */
import { worldToScreen } from '../northpole/camera-view';
import { toScreen, type Tile } from '../northpole/world';
import type { MapHarness } from './map-harness';

/** Presses or lets go of a key on the page. */
export const key = (type: 'keydown' | 'keyup', name: string, init: KeyboardEventInit = {}) =>
  window.dispatchEvent(new KeyboardEvent(type, { key: name, cancelable: true, ...init }));

/** Where a tile of the world shows on the screen now, from the camera's last frame. */
export function screenAt(map: MapHarness, tile: Tile): Tile {
  const [x, y, zoom] = String(map.canvas.dataset.camera).split(',').map(Number) as [
    number,
    number,
    number,
  ];
  const box = map.canvas.getBoundingClientRect();
  return worldToScreen(toScreen(tile), box.width, box.height, { x, y }, zoom);
}

/** A pointer event on the map's canvas at a point on the screen. */
export function point(
  map: MapHarness,
  type: string,
  at: Tile,
  init: PointerEventInit = {},
): PointerEvent {
  const event = new PointerEvent(type, {
    clientX: at.x,
    clientY: at.y,
    pointerType: 'mouse',
    pointerId: 1,
    cancelable: true,
    ...init,
  });
  map.canvas.dispatchEvent(event);
  return event;
}

/** A mouse click, or a tap, at a point: down, up and the click, as a browser sends them. */
export function click(map: MapHarness, at: Tile, init: PointerEventInit = {}) {
  point(map, 'pointerdown', at, { buttons: 1, ...init });
  point(map, 'pointerup', at, init);
  point(map, 'click', at, init);
}
