/**
 * Zooming the map on every device: the zoom buttons, + and − on the keyboard,
 * and the wheel or a trackpad's pinch round the pointer. Each sets the
 * visitor's own zoom, which the camera eases to (map-camera.ts) and keeps
 * while the player walks; fingers pinching on a touch screen are map-touch.ts.
 */
import { frameCentre } from './camera';
import { pinchCentre, wheelZoom, ZOOM_STEP, zoomBy } from './camera-view';
import { aimedZoom, want } from './map-camera';
import { typing } from './map-input';
import type { MapRun } from './map-state';
import type { Tile } from './world';

/** The keys that zoom, and how much nearer each takes the camera. */
const ZOOM_KEYS = new Map([
  ['+', ZOOM_STEP],
  ['=', ZOOM_STEP],
  ['-', 1 / ZOOM_STEP],
  ['_', 1 / ZOOM_STEP],
]);

/**
 * Zooms the camera by `factor`, between the whole island and the nearest it
 * comes, keeping what's at `at` on the screen there, or else what it looks at.
 * It doesn't inside a square, before the first frame, or past a limit.
 */
function zoomAround(m: MapRun, factor: number, at?: Tile) {
  const { camera } = m;
  if (m.visiting || !camera) return;
  const width = m.frame.clientWidth;
  const height = m.frame.clientHeight;
  const aimed = aimedZoom(m, want(m), width, height);
  const next = zoomBy(aimed.zoom, factor, aimed.fit);
  if (next === aimed.zoom) return;
  if (at) {
    const centre = m.panned ? frameCentre(m.bounds, width, height, aimed.zoom, m.panned) : camera;
    m.panned = pinchCentre(m.bounds, width, height, aimed.zoom, next, centre, at, at);
  }
  m.chosen = next;
}

/** The wheel, or a pinch on a trackpad, zooms round the pointer, and the page doesn't scroll under the map. */
function onWheel(m: MapRun, event: WheelEvent) {
  if (m.visiting) return;
  event.preventDefault();
  const box = m.canvas.getBoundingClientRect();
  const factor = wheelZoom(event.deltaY, event.deltaMode, event.ctrlKey, box.height);
  zoomAround(m, factor, { x: event.clientX - box.left, y: event.clientY - box.top });
}

/** + or = zooms in and - zooms out, unless the key belongs to a text field or a shortcut. */
function onZoomKey(m: MapRun, event: KeyboardEvent) {
  if (typing(event.target) || event.metaKey || event.ctrlKey || event.altKey) return;
  const factor = ZOOM_KEYS.get(event.key);
  if (factor === undefined || m.visiting) return;
  event.preventDefault();
  zoomAround(m, factor);
}

/** Listens for the zoom buttons, the wheel and the keys. Returns what stops listening. */
export function listenForZoom(m: MapRun) {
  const { nearer, farther } = m.zoomButtons;
  const zoomIn = () => {
    zoomAround(m, ZOOM_STEP);
  };
  const zoomOut = () => {
    zoomAround(m, 1 / ZOOM_STEP);
  };
  const wheel = (event: WheelEvent) => {
    onWheel(m, event);
  };
  const keys = (event: KeyboardEvent) => {
    onZoomKey(m, event);
  };
  nearer.addEventListener('click', zoomIn);
  farther.addEventListener('click', zoomOut);
  // Not passive, so the wheel over the map zooms it instead of scrolling the page.
  m.canvas.addEventListener('wheel', wheel, { passive: false });
  window.addEventListener('keydown', keys);
  return () => {
    nearer.removeEventListener('click', zoomIn);
    farther.removeEventListener('click', zoomOut);
    m.canvas.removeEventListener('wheel', wheel);
    window.removeEventListener('keydown', keys);
  };
}
