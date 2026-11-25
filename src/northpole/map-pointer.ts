/**
 * The mouse or a finger over the map's canvas, as plain numbers a square can
 * be given: where it is, whether it's pressed, and the presses since the last
 * frame. Kept apart from the map because the page's own events must never reach
 * a square (docs/specs/squares-and-sandbox.md), only these numbers.
 */
import { isTap } from './pointer';
import type { Tile } from './world';

/** How long a press shows as `down`, at least, so a quick tap still reaches the square. */
const PRESS_SHOWN = 150;

/**
 * Follows the mouse or a finger over `element`: where it is, in CSS pixels
 * from the element's top-left, whether it's pressed, how many presses began
 * since the last frame, and whether the last press was a click or a drag. A quick tap stays pressed for `PRESS_SHOWN`, and
 * a finger lifted off stays there as long, so a square asked for its next frame
 * still sees it.
 */
export function trackPointer(element: HTMLElement) {
  let at: Tile | undefined;
  let held = false;
  let pressedAt = -Infinity;
  let pressedFrom: Tile | undefined;
  /** Whether the press has moved too far to be a click, at any point since it began. */
  let dragged = false;
  let goneAt = Infinity;
  /** Presses begun since `now` last took them. */
  let presses = 0;
  const place = (event: PointerEvent): Tile => {
    const box = element.getBoundingClientRect();
    return { x: event.clientX - box.left, y: event.clientY - box.top };
  };
  const onMove = (event: PointerEvent) => {
    at = place(event);
    // Back over the element with the button still down, after leaving it.
    held = event.buttons !== 0;
    if (held && pressedFrom && !isTap(pressedFrom, at)) dragged = true;
    goneAt = Infinity;
  };
  const onDown = (event: PointerEvent) => {
    at = pressedFrom = place(event);
    held = true;
    dragged = false;
    presses += 1;
    pressedAt = performance.now();
    goneAt = Infinity;
  };
  const onUp = (event: PointerEvent) => {
    at = place(event);
    held = false;
  };
  const onLeave = (event: PointerEvent) => {
    held = false;
    goneAt = event.pointerType === 'mouse' ? 0 : performance.now() + PRESS_SHOWN;
  };
  const events = [
    ['pointermove', onMove],
    ['pointerdown', onDown],
    ['pointerup', onUp],
    ['pointerleave', onLeave],
    ['pointercancel', onLeave],
  ] as const;
  for (const [name, listener] of events) element.addEventListener(name, listener);
  return {
    /**
     * Where the pointer is now, whether it's pressed and the presses begun
     * since the last call, or undefined when it's off the element. Call it
     * once a frame.
     */
    now(): { x: number; y: number; down: boolean; presses: number } | undefined {
      const time = performance.now();
      const fresh = presses;
      presses = 0;
      if (!at || time > goneAt) return undefined;
      return { x: at.x, y: at.y, down: held || time - pressedAt < PRESS_SHOWN, presses: fresh };
    },
    /** Whether a click at `point` ended a press that barely moved, so it opens what it's on. */
    tapped(point: Tile) {
      return !pressedFrom || (!dragged && isTap(pressedFrom, point));
    },
    stop() {
      for (const [name, listener] of events) element.removeEventListener(name, listener);
    },
  };
}

/** What the map asks of the pointer each frame. */
export type PointerTracker = ReturnType<typeof trackPointer>;
