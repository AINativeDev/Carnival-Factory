/**
 * One frame of the map, in the order it's drawn: the player walks, the camera
 * follows, then the sky, the ground, the scene and the front fence, the
 * weather and the fade, and the tag and the call to action over it all; or,
 * inside a square, its room. Each part is a file of its own; this is the order
 * they go in.
 */
import { worldToScreen } from './camera';
import { fadeAt, FADE } from './interior';
import { darken, drawBackdrop, drawFront, drawGround, drawWeather } from './map-backdrop';
import { easeWalking, follow } from './map-camera';
import { squareOf } from './map-labels';
import { showPrompt } from './map-prompt';
import { drawInside } from './map-room';
import { drawScene } from './map-scene';
import type { MapRun } from './map-state';
import { showTag } from './map-tag';
import { timeFrame } from './map-timing';
import { drawEdgeArrow } from './map-trail';
import { walk } from './map-walk';
import { middle } from './render';
import { toScreen } from './world';

/** Asks the browser for the map's next frame. */
export function nextFrame(m: MapRun) {
  m.frameId = requestAnimationFrame((time) => {
    drawFrame(m, time);
  });
}

/** Draws the frame at `time`, and asks for the next. */
function drawFrame(m: MapRun, time: number) {
  const started = performance.now();
  const dt = m.last === undefined ? 0 : Math.min(0.1, (time - m.last) / 1000);
  m.last = time;
  // Decoration stands still for anyone who'd rather nothing moved.
  const still = m.reduced.matches;
  const motion = still ? 0 : time;
  walk(m, dt);
  const width = m.frame.clientWidth;
  const height = m.frame.clientHeight;
  easeWalking(m, dt, time);
  // Halfway through the fade, the view goes in or out.
  if (still || time - m.fading >= FADE / 2) m.entered = m.visiting;
  const dark = still ? 0 : fadeAt(time - m.fading);
  const square = m.entered && squareOf(m, m.entered);
  if (m.entered && square) {
    showPrompt(m, time, m.zoom, m.camera ?? toScreen(m.player));
    drawInside(m, m.entered, square, { width, height, time, dark });
    nextFrame(m);
    return;
  }
  const { canvas, ctx } = m;
  if (canvas.dataset.room) {
    delete canvas.dataset.room;
    delete canvas.dataset.stage;
  }
  const { camera, view } = follow(m, dt, still, width, height);
  drawBackdrop(m, width, height, motion);
  const { scale, zoom } = m;
  const k = scale * zoom;
  ctx.setTransform(
    k,
    0,
    0,
    k,
    (width / 2 - camera.x * zoom) * scale,
    (height / 2 - camera.y * zoom) * scale,
  );
  drawGround(m, motion);
  drawScene(m, view, { time, motion, still, width, height, k, camera });
  drawFront(m, motion);
  drawWeather(m, width, height, time, still);
  if (m.trailing && m.selected) {
    const at = worldToScreen(middle(m.selected), width, height, camera, zoom);
    drawEdgeArrow(ctx, at, width, height);
  }
  darken(ctx, dark, width, height);
  showTag(m, zoom, camera);
  showPrompt(m, time, zoom, camera);
  // How long the map took to draw this frame, for the smoke test's budget.
  timeFrame(m, started);
  nextFrame(m);
}
