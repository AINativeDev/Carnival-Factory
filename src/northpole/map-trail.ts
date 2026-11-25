/**
 * The way to a plot, shown in the snow: the footprints left walking to claim
 * one, fading as they fill with snow, the faint steps ahead on a walk to a
 * picked square, and an arrow at the edge of the screen when it's out of view.
 */
import type { MapRun } from './map-state';
import { theme } from './theme';
import { toScreen, type Tile } from './world';

const { colors } = theme;

/** How long footprints stay in the snow, in milliseconds. */
const FOOTPRINT_TIME = 9000;

/** One footprint at a point of the world, offset to the left or the right foot. */
function step(ctx: CanvasRenderingContext2D, at: Tile, right: boolean) {
  const { x, y } = toScreen(at);
  ctx.beginPath();
  ctx.ellipse(x + (right ? 5 : -5), y, 4, 2.5, 0, 0, Math.PI * 2);
  ctx.fill();
}

/** The footprints left walking to claim a plot, fading as they fill with snow. */
export function drawFootprints(m: MapRun) {
  const { ctx } = m;
  const now = performance.now();
  m.footprints = m.footprints.filter((print) => now - print.time < FOOTPRINT_TIME);
  for (const print of m.footprints) {
    ctx.globalAlpha = 0.6 * (1 - (now - print.time) / FOOTPRINT_TIME);
    ctx.fillStyle = colors.snowShade;
    step(ctx, print.at, print.side !== 0);
  }
}

/** On a walk to a picked square, the way ahead shows as faint footprints until the player arrives. */
export function drawTrail(m: MapRun) {
  if (!m.trailing) return;
  const { ctx } = m;
  ctx.fillStyle = colors.snowShade;
  ctx.globalAlpha = 0.45;
  m.path.forEach((tile, n) => {
    step(ctx, tile, n % 2 !== 0);
  });
}

/** An arrow at the edge of the screen pointing toward `at`, a point in screen pixels, when it's off screen. */
export function drawEdgeArrow(
  ctx: CanvasRenderingContext2D,
  at: Tile,
  width: number,
  height: number,
) {
  const margin = 28;
  if (at.x > margin && at.x < width - margin && at.y > margin && at.y < height - margin) return;
  const cx = width / 2;
  const cy = height / 2;
  const angle = Math.atan2(at.y - cy, at.x - cx);
  // Where the line from the middle toward the square leaves the screen, kept inside the margin.
  const reach = Math.min(
    Math.abs(width / 2 - margin) / Math.max(Math.abs(Math.cos(angle)), 1e-6),
    Math.abs(height / 2 - margin) / Math.max(Math.abs(Math.sin(angle)), 1e-6),
  );
  ctx.save();
  ctx.translate(cx + Math.cos(angle) * reach, cy + Math.sin(angle) * reach);
  ctx.rotate(angle);
  ctx.fillStyle = colors.cocoa;
  ctx.beginPath();
  ctx.moveTo(16, 0);
  ctx.lineTo(-10, -13);
  ctx.lineTo(-10, 13);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = colors.gold;
  ctx.beginPath();
  ctx.moveTo(12, 0);
  ctx.lineTo(-7, -9);
  ctx.lineTo(-7, 9);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}
