/**
 * Wiring the visitor's keys, mouse, fingers and the call to action to a
 * running map, and unwiring them when it stops. What each event does is in
 * map-input.ts, map-touch.ts and map-zoom.ts; this is only which element hears which.
 */
import { onClick, onKeyDown, onPrompt } from './map-input';
import { resize } from './map-layers';
import type { MapRun } from './map-state';
import { onPointerDown, onPointerEnd, onPointerMove } from './map-touch';
import { rideOnward } from './ride-map';
import { listenForZoom } from './map-zoom';

/**
 * A listener that hands the running map and its event to `act`. Each event's
 * name says its kind (a KeyboardEvent for keydown, a PointerEvent for
 * pointermove), which `act` is written for.
 */
const handle = (m: MapRun, act: (m: MapRun, event: never) => void) => (event: Event) => {
  act(m, event as never);
};

/** Listens for the visitor on the window, the canvas and the prompt. Returns what stops listening. */
export function listen(m: MapRun) {
  const { canvas, prompt } = m;
  const windowEvents = [
    ['resize', handle(m, resize)],
    ['keydown', handle(m, onKeyDown)],
    ['keyup', handle(m, (_, event: KeyboardEvent) => m.held.delete(event.key.toLowerCase()))],
    [
      'blur',
      handle(m, () => {
        m.held.clear();
      }),
    ],
  ] as const;
  const canvasEvents = [
    ['click', handle(m, onClick)],
    ['pointerdown', handle(m, onPointerDown)],
    ['pointermove', handle(m, onPointerMove)],
    ['pointerup', handle(m, onPointerEnd)],
    ['pointercancel', handle(m, onPointerEnd)],
    ['pointerleave', handle(m, onPointerLeave)],
  ] as const;
  const promptClicked = handle(m, onPrompt);
  const rideClicked = handle(m, rideOnward);
  for (const [name, listener] of windowEvents) window.addEventListener(name, listener);
  for (const [name, listener] of canvasEvents) canvas.addEventListener(name, listener);
  prompt.addEventListener('click', promptClicked);
  m.rideButton?.addEventListener('click', rideClicked);
  const unzoom = listenForZoom(m);
  return () => {
    unzoom();
    for (const [name, listener] of windowEvents) window.removeEventListener(name, listener);
    for (const [name, listener] of canvasEvents) canvas.removeEventListener(name, listener);
    prompt.removeEventListener('click', promptClicked);
    m.rideButton?.removeEventListener('click', rideClicked);
  };
}

/** The mouse leaving the map stops hovering; a finger lifted off it leaves its tag showing. */
function onPointerLeave(m: MapRun, event: PointerEvent) {
  if (event.pointerType !== 'touch') m.hovered = undefined;
}
