/**
 * An open plot waiting for a booth: fresh snow roped off between stakes, a soft
 * beam of light rising from it, and a big "For claim" sign that bounces while
 * the player stands at it, inviting them to ask for a booth of their own.
 */
import { corners, diamond, middle } from './brushes';
import { sidesOf } from './rounds';
import { canvasFont, theme } from './theme';
import type { Box, Plot, Tile } from './world';

const { colors } = theme;

/** The "For claim" sign on an open plot: how tall its post is, and its board's size, in world pixels. */
export const CLAIM_SIGN = { post: 96, w: 128, h: 40 };

/**
 * An open plot: a square of fresh snow roped off between stakes, a soft beam
 * of light rising from it, and a big "For claim" sign on a tall post. The sign
 * bounces while the player stands at the plot. Everything moves with `time`,
 * so it all stands still when the map passes 0.
 */
export function drawOpenPlot(
  ctx: CanvasRenderingContext2D,
  plot: Plot,
  time: number,
  near: boolean,
): Box {
  const c = corners(plot);
  const pulse = 0.75 + 0.25 * Math.sin(time / 700 + plot.number);
  claimBeam(ctx, c, middle(plot).y, pulse);
  claimRope(ctx, c);
  const lift = near
    ? Math.abs(Math.sin(time / 180)) * 10
    : Math.sin(time / 900 + plot.number) * 1.5;
  return claimSign(ctx, middle(plot), lift);
}

/** The beam: a column of warm light fading upwards, over a glow on the snow. */
function claimBeam(
  ctx: CanvasRenderingContext2D,
  c: ReturnType<typeof corners>,
  y: number,
  pulse: number,
) {
  ctx.save();
  ctx.fillStyle = colors.glow;
  ctx.globalAlpha = 0.35 * pulse;
  diamond(ctx, c, 0);
  ctx.fill();
  const beam = ctx.createLinearGradient(0, y, 0, y - 190);
  beam.addColorStop(0, colors.glow);
  beam.addColorStop(1, `${colors.glow}00`);
  ctx.fillStyle = beam;
  ctx.globalAlpha = 0.4 * pulse;
  ctx.beginPath();
  ctx.moveTo(c.left.x + 10, c.left.y);
  ctx.lineTo(c.bottom.x, c.bottom.y);
  ctx.lineTo(c.right.x - 10, c.right.y);
  ctx.lineTo(c.right.x - 22, c.right.y - 190);
  ctx.lineTo(c.left.x + 22, c.left.y - 190);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

/** The rope, sagging a little between its stakes. */
function claimRope(ctx: CanvasRenderingContext2D, c: ReturnType<typeof corners>) {
  const stakes = [c.top, c.right, c.bottom, c.left];
  ctx.strokeStyle = colors.berry;
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  for (const { p, q } of sidesOf(stakes)) {
    ctx.moveTo(p.x, p.y - 14);
    ctx.quadraticCurveTo((p.x + q.x) / 2, (p.y + q.y) / 2 - 8, q.x, q.y - 14);
  }
  ctx.stroke();
  for (const p of stakes) {
    ctx.fillStyle = colors.wood;
    ctx.fillRect(p.x - 2, p.y - 18, 4, 18);
    ctx.fillStyle = colors.berry;
    ctx.fillRect(p.x - 2, p.y - 18, 4, 4);
  }
}

/** The sign on its tall post at (`x`, `y`), raised by `lift`; returns where a click opens the plot. */
function claimSign(ctx: CanvasRenderingContext2D, { x, y }: Tile, lift: number): Box {
  const { post, w, h } = CLAIM_SIGN;
  ctx.fillStyle = colors.cocoa;
  ctx.fillRect(x - 3, y - post, 6, post);
  const top = y - post - h / 2 - lift;
  ctx.fillStyle = colors.cocoa;
  ctx.fillRect(x - w / 2 - 3, top - 3, w + 6, h + 6);
  ctx.fillStyle = colors.gold;
  ctx.fillRect(x - w / 2, top, w, h);
  ctx.fillStyle = colors.snow;
  ctx.fillRect(x - w / 2 - 4, top - 6, w + 8, 5);
  ctx.fillStyle = colors.ink;
  ctx.font = canvasFont('body', 'bold');
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('For claim', x, top + h / 2, w - 12);
  ctx.textBaseline = 'alphabetic';
  const reach = post + h / 2 + 16;
  return { x: x - w / 2 - 8, y: y - reach, w: w + 16, h: reach + 24 };
}
