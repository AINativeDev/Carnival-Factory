/**
 * Fingers on the map, on a touch screen: one drags the camera round, two pinch
 * it nearer or farther, and a tap still walks or opens (map-input.ts). The
 * mouse moving over the map hovers a plot instead. The camera's arithmetic is
 * in camera.ts; this is what each finger does to it.
 */
import { fitZoom } from './camera';
import { dragCentre } from './camera-view';
import { pinchZoom } from './camera-view';
import { pinchCentre } from './camera-view';
import { billboardUnder, pointAt } from './map-input';
import { plotUnder } from './map-labels';
import type { MapRun } from './map-state';
import { isTap } from './pointer';
import type { Tile } from './world';

/** How far apart the first two fingers on the map are, and the point between them. Only asked with two down. */
function pinchOf(m: MapRun) {
  const [a, b] = [...m.fingers.values()] as [Tile, Tile];
  return {
    apart: Math.hypot(b.x - a.x, b.y - a.y),
    between: { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 },
  };
}

/** Where a pointer event is on the canvas. */
function placeOf(m: MapRun, event: PointerEvent): Tile {
  const box = m.canvas.getBoundingClientRect();
  return { x: event.clientX - box.left, y: event.clientY - box.top };
}

/** A finger comes down: the first starts a drag, the second a pinch. */
export function onPointerDown(m: MapRun, event: PointerEvent) {
  if (event.pointerType !== 'touch' || m.visiting) return;
  const at = placeOf(m, event);
  m.fingers.set(event.pointerId, at);
  // The drag, or the pinch, goes on when a finger slides off the map.
  m.canvas.setPointerCapture(event.pointerId);
  if (m.fingers.size === 2) {
    m.dragging = undefined;
    m.pinching = pinchOf(m);
  } else if (m.fingers.size === 1) {
    m.dragging = { id: event.pointerId, from: at, moved: false };
  }
}

/** A finger lifts: with one of the pair gone, the pinch goes on from the two fingers left. */
export function onPointerEnd(m: MapRun, event: PointerEvent) {
  m.fingers.delete(event.pointerId);
  m.pinching = m.fingers.size < 2 ? undefined : pinchOf(m);
  if (m.dragging?.id === event.pointerId) m.dragging = undefined;
}

/** A finger moving drags or pinches the camera; the mouse moving hovers a plot. */
export function onPointerMove(m: MapRun, event: PointerEvent) {
  if (event.pointerType !== 'touch') {
    const at = pointAt(m, event);
    m.hovered = m.visiting ? undefined : plotUnder(m, at);
    const link = !m.visiting && billboardUnder(m, at);
    m.canvas.style.cursor = m.hovered || link ? 'pointer' : 'default';
    return;
  }
  if (!m.fingers.has(event.pointerId) || m.visiting || !m.camera) return;
  const to = placeOf(m, event);
  m.fingers.set(event.pointerId, to);
  if (m.pinching) pinch(m, m.camera, m.pinching);
  else drag(m, m.camera, event.pointerId, to);
}

/** Two fingers pinch the camera nearer or farther, round the point between them. It follows at once, without easing. */
function pinch(m: MapRun, camera: Tile, pinching: { apart: number; between: Tile }) {
  const box = m.canvas.getBoundingClientRect();
  const next = pinchOf(m);
  const nearer = pinchZoom(
    m.zoom,
    pinching.apart,
    next.apart,
    fitZoom(m.bounds, box.width, box.height),
  );
  m.camera = m.panned = pinchCentre(
    m.bounds,
    box.width,
    box.height,
    m.zoom,
    nearer,
    camera,
    pinching.between,
    next.between,
  );
  m.zoom = m.chosen = nearer;
  m.pinching = next;
}

/** One finger drags the camera round, once it has moved too far to be a tap. It follows at once, without easing. */
function drag(m: MapRun, camera: Tile, id: number, to: Tile) {
  const { dragging } = m;
  if (dragging?.id !== id) return;
  if (!dragging.moved && isTap(dragging.from, to)) return;
  dragging.moved = true;
  const box = m.canvas.getBoundingClientRect();
  m.camera = m.panned = dragCentre(
    m.bounds,
    box.width,
    box.height,
    m.zoom,
    camera,
    dragging.from,
    to,
  );
  dragging.from = to;
}
