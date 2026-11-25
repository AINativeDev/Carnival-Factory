/**
 * Everything standing on the island in one frame, drawn back to front by its
 * footprint so what's in front hides what's behind: the trees and things, every
 * plot's structure with its square's drawing on its face, the crowd and the
 * player, and the picked square's beam over all of it.
 */
import { screenToWorld } from './camera-view';
import { addCrowd, addPlayer, type AddToScene } from './map-crowd';
import { plotUnder, squareOf } from './map-labels';
import type { MapRun } from './map-state';
import { addPlots, type Aim } from './map-stands';
import { arrowBounce, highlightAt } from './owners';
import { drawThing } from './render';
import { drawSelectionBeam } from './plot-marks';
import { middle } from './brushes';
import type { Box, Tile } from './world';

/** What a frame of the scene is drawn with: the time, and whether anything should move. */
export interface SceneFrame {
  time: number;
  motion: number;
  still: boolean;
  width: number;
  height: number;
  /** World pixels to device pixels. */
  k: number;
  /** Where the camera looks this frame. */
  camera: Tile;
}

/** Draws everything standing in `view`, a box of the world, back to front. */
export function drawScene(m: MapRun, view: Box, frame: SceneFrame) {
  const { ctx } = m;
  const { time, motion, still } = frame;
  const shown = (box: Box) => {
    const { x, y } = middle(box);
    return (
      x > view.x - 200 && x < view.x + view.w + 200 && y > view.y - 60 && y < view.y + view.h + 320
    );
  };
  const scene: { depth: number; draw: () => void }[] = [];
  const add: AddToScene = (depth, draw) => scene.push({ depth, draw });
  for (const thing of m.world.things) {
    if (!shown(thing)) continue;
    if (thing.kind === 'drift') drawThing(ctx, thing, motion);
    else
      // The billboard is drawn last, over whatever stands near it, so it is never hidden.
      add(thing.kind === 'billboard' ? Infinity : thing.x + thing.w + thing.y + thing.h - 2, () => {
        drawThing(ctx, thing, motion);
      });
  }
  const aim = aimOf(m, frame);
  m.targets = [];
  if (m.selected) m.selectedAt ??= time;
  const picked = m.selectedAt === undefined ? 0 : highlightAt(time - m.selectedAt);
  addPlots(m, add, shown, aim, picked, frame);
  addCrowd(m, add, time, motion, still);
  addPlayer(m, add, time, still);
  scene.sort((a, b) => a.depth - b.depth);
  for (const item of scene) item.draw();
  // The picked square's beam and arrow, over whatever stands in front of it.
  const pickedTarget = m.selected && m.targets.find((t) => t.plot === m.selected);
  if (pickedTarget && picked > 0)
    drawSelectionBeam(ctx, pickedTarget.plot, pickedTarget.box.y, picked, arrowBounce(time, still));
  // Which square has the pointer, for the smoke test.
  if (m.canvas.dataset.pointer !== aim.pointed) m.canvas.dataset.pointer = aim.pointed;
}

/** The pointer, in world pixels, and the square in front under it: only that square gets it. */
function aimOf(m: MapRun, frame: SceneFrame): Aim {
  const pressed = m.pointer.now();
  if (!pressed) return { target: undefined, pointed: '' };
  const aimed = screenToWorld(pressed, frame.width, frame.height, frame.camera, m.zoom);
  // Plots are found where the last frame drew them.
  const under = plotUnder(m, aimed);
  const square = under && squareOf(m, under);
  return { target: under && square && { pressed, aimed, under, square }, pointed: '' };
}
