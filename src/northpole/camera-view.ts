/**
 * The camera as a viewport sees it: turning a point in the viewport into the
 * world and back, and where fingers move the camera as they drag or pinch the
 * map. It's apart from `camera.ts`, which decides how the island is framed,
 * because this follows the visitor's own hands, a frame at a time.
 */
import { frameCentre } from './camera';
import type { Box, Tile } from './world';

/** How near two fingers can pinch the camera in. */
export const MAX_PINCH_ZOOM = 1.5;

/** The world point under a point in a viewport, for a camera at `centre` and `zoom`. */
export function screenToWorld(
  point: Tile,
  width: number,
  height: number,
  centre: Tile,
  zoom: number,
): Tile {
  return {
    x: centre.x + (point.x - width / 2) / zoom,
    y: centre.y + (point.y - height / 2) / zoom,
  };
}

/** Where a world point shows in a viewport, for a camera at `centre` and `zoom`. */
export function worldToScreen(
  point: Tile,
  width: number,
  height: number,
  centre: Tile,
  zoom: number,
): Tile {
  return {
    x: width / 2 + (point.x - centre.x) * zoom,
    y: height / 2 + (point.y - centre.y) * zoom,
  };
}

/**
 * Where the camera's centre goes when a finger drags the map from `from` to
 * `to`, in CSS pixels: the island moves with the finger, and the camera stops
 * where `frameCentre` would, so the drag never shows anything past `bounds`.
 */
export function dragCentre(
  bounds: Box,
  width: number,
  height: number,
  zoom: number,
  centre: Tile,
  from: Tile,
  to: Tile,
): Tile {
  return frameCentre(bounds, width, height, zoom, {
    x: centre.x - (to.x - from.x) / zoom,
    y: centre.y - (to.y - from.y) / zoom,
  });
}

/**
 * The zoom two fingers pinch the camera to, from `zoom` as they move from
 * `from` to `to` apart: nearer as they spread, farther as they close, and never
 * farther than `min`, the whole island, or nearer than `MAX_PINCH_ZOOM`.
 */
export function pinchZoom(zoom: number, from: number, to: number, min: number): number {
  const next = from > 0 ? (zoom * to) / from : zoom;
  return Math.min(Math.max(min, MAX_PINCH_ZOOM), Math.max(min, next));
}

/**
 * Where the camera's centre goes when two fingers pinch it from `zoom` to
 * `next` while the point between them moves from `from` to `to`, in CSS
 * pixels: what was under the fingers stays under them, and the camera stops
 * where `frameCentre` would.
 */
export function pinchCentre(
  bounds: Box,
  width: number,
  height: number,
  zoom: number,
  next: number,
  centre: Tile,
  from: Tile,
  to: Tile,
): Tile {
  const held = screenToWorld(from, width, height, centre, zoom);
  return frameCentre(bounds, width, height, next, {
    x: held.x - (to.x - width / 2) / next,
    y: held.y - (to.y - height / 2) / next,
  });
}
