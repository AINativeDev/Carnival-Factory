/**
 * Fingers and the mouse on the map: one finger, or the mouse with its primary
 * button held, drags the camera round, two fingers pinch it nearer or farther,
 * and a tap or a click that barely moved still walks or opens (map-input.ts,
 * which `trackPointer` tells a drag's release is no click). The mouse moving
 * with no button held hovers a spot instead. The camera's arithmetic is in
 * camera.ts; this is what each finger, or the mouse, does to it.
 */
import { fitZoom } from './camera';
import { dragCentre } from './camera-view';
import { pinchZoom } from './camera-view';
import { pinchCentre } from './camera-view';
import { billboardUnder, pointAt } from './map-input';
import { spotUnder } from './map-labels';
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

/** A finger comes down: the first starts a drag, the second a pinch. The mouse's primary button starts a drag too. */
export function onPointerDown(m: MapRun, event: PointerEvent) {
  // Inside a square the pointer is the square's to play with, not the camera's.
  if (m.visiting || (event.pointerType !== 'touch' && event.button !== 0)) return;
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
  if (m.dragging?.id !== event.pointerId) return;
  if (m.dragging.moved) m.canvas.style.cursor = 'default';
  m.dragging = undefined;
}

/** A finger, or the mouse held down, moving drags or pinches the camera; the mouse moving otherwise hovers a spot. */
export function onPointerMove(m: MapRun, event: PointerEvent) {
  const mouse = event.pointerType !== 'touch';
  // A button let go off the page sends no pointerup here, so the drag ends at the next move.
  if (mouse && m.fingers.has(event.pointerId) && !(event.buttons & 1)) onPointerEnd(m, event);
  if (mouse && !m.fingers.has(event.pointerId)) {
    hover(m, event);
    return;
  }
  if (!m.fingers.has(event.pointerId) || m.visiting || !m.camera) return;
  const to = placeOf(m, event);
  m.fingers.set(event.pointerId, to);
  if (m.pinching) pinch(m, m.camera, m.pinching);
  else drag(m, m.camera, event.pointerId, to);
  if (mouse && m.dragging?.moved) {
    m.hovered = undefined;
    m.canvas.style.cursor = 'grabbing';
  }
}

/** The mouse over the map hovers the spot under it, and shows a hand over what a click opens. */
function hover(m: MapRun, event: PointerEvent) {
  const at = pointAt(m, event);
  m.hovered = m.visiting ? undefined : spotUnder(m, at);
  const link = !m.visiting && billboardUnder(m, at);
  m.canvas.style.cursor = m.hovered || link ? 'pointer' : 'default';
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

/** One finger, or the mouse, drags the camera round, once it has moved too far to be a tap. It follows at once, without easing. */
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
