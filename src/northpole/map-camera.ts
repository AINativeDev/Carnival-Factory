/**
 * The camera following the player round the carnival: coming in a little while
 * they walk, easing back out once they stop, staying where a finger dragged or
 * pinched it, and looking a little above them so more of what's ahead shows.
 * The camera's framing itself is plain functions in camera.ts; this is the part
 * that moves it frame by frame.
 */
import { fitZoom, frameCentre, framing, isPhone, type Framing } from './camera';
import type { MapRun } from './map-state';
import { toScreen, type Box, type Tile } from './world';

/** How far above the player the camera looks, in world pixels, so more of what's ahead shows. */
const LOOK_UP = 40;
/** How long the player stands still before the camera eases back out to the carnival, in milliseconds. */
const SETTLE = 2500;

/** How the camera would frame the player now. */
export const want = (m: MapRun): Framing =>
  framing(m.world, m.frame.clientWidth, m.frame.clientHeight, m.player, m.walking, m.overview);

/** Where the camera's centre goes for a framing, at a zoom. */
const centreFor = (m: MapRun, wanted: Framing, at: number) =>
  frameCentre(m.bounds, m.frame.clientWidth, m.frame.clientHeight, at, {
    x: wanted.target.x,
    y: wanted.target.y - LOOK_UP,
  });

/** The camera comes in a little while the player walks, and eases back out once they stop. */
export function easeWalking(m: MapRun, dt: number, time: number) {
  if (m.moving) m.movedAt = time;
  m.walking = m.moving
    ? Math.min(1, m.walking + dt * 1.2)
    : time - m.movedAt > SETTLE
      ? Math.max(0, m.walking - dt * 0.5)
      : m.walking;
}

/** Moves the camera toward the player for this frame, and gives back where it looks and the world box it shows. */
export function follow(
  m: MapRun,
  dt: number,
  still: boolean,
  width: number,
  height: number,
): { camera: Tile; view: Box } {
  const framed = want(m);
  // Two fingers may have pinched the camera nearer or farther, though never past the whole island.
  const wanted = {
    ...framed,
    zoom: Math.max(fitZoom(m.bounds, width, height), framed.zoom * m.closer),
  };
  // A walk takes the camera back from where a finger left it, as the overview going on or off does.
  if (m.moving) m.panned = undefined;
  const camera = aim(m, wanted, dt, still, width, height);
  m.camera = camera;
  const placed = `${Math.round(camera.x)},${Math.round(camera.y)},${m.zoom.toFixed(4)}`;
  if (m.canvas.dataset.camera !== placed) m.canvas.dataset.camera = placed;
  const view = {
    x: camera.x - width / 2 / m.zoom,
    y: camera.y - height / 2 / m.zoom,
    w: width / m.zoom,
    h: height / m.zoom,
  };
  return { camera, view };
}

/** Where the camera looks this frame: at once the first time or without motion, eased after. */
function aim(
  m: MapRun,
  wanted: Framing,
  dt: number,
  still: boolean,
  width: number,
  height: number,
): Tile {
  if (!m.camera || still) {
    m.zoom = wanted.zoom;
    // On a phone the camera opens on the town square, then finds the player.
    return m.panned
      ? frameCentre(m.bounds, width, height, m.zoom, m.panned)
      : isPhone(width) && !still
        ? centreFor(m, { ...wanted, target: toScreen({ x: 0, y: 0 }) }, m.zoom)
        : centreFor(m, wanted, m.zoom);
  }
  const ease = Math.min(1, dt * 4);
  m.zoom += (wanted.zoom - m.zoom) * ease;
  const goal = m.panned
    ? frameCentre(m.bounds, width, height, m.zoom, m.panned)
    : centreFor(m, wanted, m.zoom);
  return {
    x: m.camera.x + (goal.x - m.camera.x) * ease,
    y: m.camera.y + (goal.y - m.camera.y) * ease,
  };
}
