/**
 * The walkable map: the North Pole, or a participant's level, as a diorama on
 * a canvas, which the player walks round with WASD, the arrow keys, or by
 * clicking or tapping the ground. This file starts a map and wires it to the
 * page; each part of it is a file of its own (map-*.ts), sharing one MapRun.
 */
import { mapControls } from './map-controls';
import { nextFrame } from './map-frame';
import { resize } from './map-layers';
import { listen } from './map-listen';
import type { MapControls, MapOptions } from './map-options';
import { openRun } from './map-run';

// The page's entry point and the Booths panel name these here, beside startMap.
export type { MapControls, SquareKind, StationEntry } from './map-options';

/**
 * Draws the North Pole as a diorama on `canvas`, which fills `frame`: the whole
 * carnival on one fenced, lit snow island under a mountain-and-aurora sky. It
 * lets the player walk round it with WASD, the arrow keys, or by clicking or
 * tapping the ground. Standing at a booth or an attraction, or at an open spot,
 * `prompt` offers to open it, as do E, Enter and a click on it.
 */
export function startMap(
  frame: HTMLElement,
  canvas: HTMLCanvasElement,
  prompt: HTMLButtonElement,
  options: MapOptions,
): MapControls {
  const m = openRun(frame, canvas, prompt, options);
  resize(m);
  const unlisten = listen(m);
  nextFrame(m);
  return mapControls(m, () => {
    cancelAnimationFrame(m.frameId);
    unlisten();
    m.tag.element.remove();
    m.rideButton?.remove();
    m.zoomButtons.element.remove();
    delete frame.dataset.visiting;
    m.pointer.stop();
  });
}
