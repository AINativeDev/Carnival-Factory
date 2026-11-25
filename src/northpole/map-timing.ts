/**
 * How long the map takes to draw a frame, written on the canvas for the smoke
 * test's frame budget. Kept apart so the map's frame and a room's frame are
 * timed the same way.
 */
import type { MapRun } from './map-state';

/** Frames the map draws before it starts timing them, while the page warms up. */
const WARM_UP_FRAMES = 30;

/** Notes how long a frame took to draw, from `started`, for the smoke test's budget. */
export function timeFrame(m: MapRun, started: number) {
  const spent = performance.now() - started;
  if (++m.frames <= WARM_UP_FRAMES) return;
  m.slowest = Math.max(m.slowest, spent);
  m.recent.push(spent);
  if (m.recent.length > 60) m.recent.shift();
  if (m.frames % 15 === 0) {
    m.canvas.dataset.frameMs = (m.recent.reduce((a, b) => a + b, 0) / m.recent.length).toFixed(2);
    m.canvas.dataset.slowestFrameMs = m.slowest.toFixed(2);
  }
}
