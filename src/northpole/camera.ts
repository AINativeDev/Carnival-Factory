/**
 * Framing the North Pole: the island's outline on screen, and where the camera
 * looks and how near. Plain functions, so the map frames the island and the
 * tests check it the same way. Everything is in world pixels, with the town
 * square's centre at (0, 0), except a viewport's size, which is in CSS pixels.
 */
import { toScreen, type Box, type Tile, type World } from './world';

/** How thick the island's snow slab is under its front edges, in world pixels. */
export const SLAB = 56;
/** How far the tallest things, the ferris wheel and the trees at the back, rise over the island. */
const HEADROOM = 140;
/** The room left round the whole island on a laptop, in CSS pixels. */
export const MARGIN = 32;
/** The room left round the carnival on a laptop, in CSS pixels. */
export const CARNIVAL_MARGIN = 12;
/** How far the pavilions' roofs rise over their plots, in world pixels. */
const CARNIVAL_HEADROOM = 240;
/** How near the camera ever comes on a laptop. */
const MAX_ZOOM = 1.25;
/** How much nearer the camera comes on a laptop while the player walks. */
export const WALK_ZOOM = 0.35;
/** How near the camera is on a phone, following the player. */
export const PHONE_ZOOM = 0.75;
/** How near two fingers can pinch the camera in. */
export const MAX_PINCH_ZOOM = 1.5;
/** Viewports narrower than this, in CSS pixels, are framed as a phone's. */
const PHONE_WIDTH = 720;

/** The four corners of the island's ground on screen, at the outer edges of its outer tiles. */
export function islandCorners(world: World) {
  const e = world.extent + 0.5;
  return {
    top: toScreen({ x: -e, y: -e }),
    right: toScreen({ x: e, y: -e }),
    bottom: toScreen({ x: e, y: e }),
    left: toScreen({ x: -e, y: e }),
  };
}

/** The box round everything on the island: its ground, the slab under it and what stands tall on it. */
export function islandBounds(world: World): Box {
  const c = islandCorners(world);
  return {
    x: c.left.x,
    y: c.top.y - HEADROOM,
    w: c.right.x - c.left.x,
    h: c.bottom.y + SLAB - (c.top.y - HEADROOM),
  };
}

/** The box round the boxes and points in `boxes`. */
function union(boxes: Box[]): Box {
  const x = Math.min(...boxes.map((b) => b.x));
  const y = Math.min(...boxes.map((b) => b.y));
  const right = Math.max(...boxes.map((b) => b.x + b.w));
  const bottom = Math.max(...boxes.map((b) => b.y + b.h));
  return { x, y, w: right - x, h: bottom - y };
}

/** The screen box round a box of tiles, from its top corner to its bottom one. */
function tilesOnScreen(box: Box): Box {
  const top = toScreen({ x: box.x - 0.5, y: box.y - 0.5 });
  const right = toScreen({ x: box.x + box.w - 0.5, y: box.y - 0.5 });
  const bottom = toScreen({ x: box.x + box.w - 0.5, y: box.y + box.h - 0.5 });
  const left = toScreen({ x: box.x - 0.5, y: box.y + box.h - 0.5 });
  return { x: left.x, y: top.y, w: right.x - left.x, h: bottom.y - top.y };
}

/**
 * The box round the carnival itself: every plot and what stands on it, the
 * town square, the ends of the avenues and the entrance, without the forest
 * and the sights round it. It grows with the booths, as the island does.
 */
export function carnivalBounds(world: World): Box {
  const plots = union(world.plots.map(tilesOnScreen));
  return union([
    { ...plots, y: plots.y - CARNIVAL_HEADROOM, h: plots.h + CARNIVAL_HEADROOM },
    tilesOnScreen({ x: world.start.x, y: world.start.y - 1, w: 1, h: 3 }),
  ]);
}

/** Whether a viewport is framed as a phone's. */
export const isPhone = (width: number) => width < PHONE_WIDTH;

/** The zoom that fits all of `bounds` in a viewport, with `margin` round it. */
export function fitZoom(bounds: Box, width: number, height: number, margin = MARGIN): number {
  return Math.max(
    0.05,
    Math.min((width - 2 * margin) / bounds.w, (height - 2 * margin) / bounds.h),
  );
}

/**
 * Where the camera's centre goes to look at `target` at `zoom` in a viewport:
 * as near `target` as it can without showing anything past `bounds`. When the
 * viewport is wider or taller than `bounds` at that zoom, it centres `bounds`
 * that way instead, so there's even room round the island.
 */
export function frameCentre(
  bounds: Box,
  width: number,
  height: number,
  zoom: number,
  target: Tile,
): Tile {
  const axis = (start: number, length: number, view: number, at: number) => {
    const half = view / zoom / 2;
    if (2 * half >= length) return start + length / 2;
    return Math.min(start + length - half, Math.max(start + half, at));
  };
  return {
    x: axis(bounds.x, bounds.w, width, target.x),
    y: axis(bounds.y, bounds.h, height, target.y),
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

/** How the camera frames the island: the zoom it settles on, and the point it looks at. */
export interface Framing {
  zoom: number;
  target: Tile;
}

/**
 * How the camera wants to frame the island for a viewport. On a laptop it fits
 * the carnival, and the player wherever they stand, and comes in by up to
 * `WALK_ZOOM` as `walking` goes from 0 to 1, towards the player. On a phone it
 * follows the player close up. Either way, `overview` asks for the whole island.
 */
export function framing(
  world: World,
  width: number,
  height: number,
  player: Tile,
  walking: number,
  overview: boolean,
): Framing {
  const fit = fitZoom(islandBounds(world), width, height);
  const at = toScreen(player);
  if (overview) return { zoom: fit, target: at };
  if (isPhone(width)) return { zoom: Math.max(fit, PHONE_ZOOM), target: at };
  const around = union([carnivalBounds(world), { x: at.x - 48, y: at.y - 120, w: 96, h: 150 }]);
  const still = Math.max(fit, Math.min(MAX_ZOOM, fitZoom(around, width, height, CARNIVAL_MARGIN)));
  const t = Math.min(1, Math.max(0, walking));
  const middle = { x: around.x + around.w / 2, y: around.y + around.h / 2 };
  return {
    zoom: still * (1 + WALK_ZOOM * t),
    target: { x: middle.x + (at.x - middle.x) * t, y: middle.y + (at.y - middle.y) * t },
  };
}

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
 * How dark the dusk sky is at `time`, from 0 to 1: it darkens a little over a
 * few minutes, and lightens again.
 */
export function duskAt(time: number, period = 240_000): number {
  return (1 - Math.cos((time / period) * Math.PI * 2)) / 2;
}

/**
 * Points along one edge of the island from `a` to `b`, `gap` world pixels
 * apart or a little less, ends included: where the fence posts and the string
 * lights go.
 */
export function alongEdge(a: Tile, b: Tile, gap: number): Tile[] {
  const length = Math.hypot(b.x - a.x, b.y - a.y);
  const steps = Math.max(1, Math.ceil(length / gap));
  return Array.from({ length: steps + 1 }, (_, n) => ({
    x: a.x + ((b.x - a.x) * n) / steps,
    y: a.y + ((b.y - a.y) * n) / steps,
  }));
}
