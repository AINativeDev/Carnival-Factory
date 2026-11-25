/**
 * The sleigh station's platforms, each with a sleigh waiting and a sign saying
 * which level it goes to (docs/specs/levels.md), and the small "Being updated"
 * sign beside a booth while a change to it is built. Both are signs on posts
 * by a plot, drawn apart from the stalls they stand beside.
 */
import { block, corners, middle, shadow } from './brushes';
import { standing } from './stall-plan';
import { drawSleigh } from './street-things';
import { canvasFont, theme } from './theme';
import type { Box, Plot } from './world';

const { colors } = theme;

/** What a sleigh platform's sign says: where its sleigh goes, and who it belongs to. */
export interface PlatformLabel {
  name: string;
  by: string;
  /** Its sign's colour, from the level's theme. */
  color: string;
  closed: boolean;
}

/** The sleigh platform's sign: how tall its post is, and its board's size, in world pixels. */
const PLATFORM_SIGN = { post: 70, w: 140, h: 40 };

/**
 * A sleigh platform: a low wooden deck with a sleigh waiting on it and a sign
 * on a post saying where it goes. At the sleigh station each one goes to a
 * participant's level; inside a level, one goes back to the North Pole. A
 * closed level's platform has a "Closed for repairs" sign and no sleigh.
 */
export function drawPlatform(
  ctx: CanvasRenderingContext2D,
  plot: Plot,
  label: PlatformLabel,
  time: number,
  near = false,
): Box {
  const c = corners(plot);
  const { x, y } = middle(plot);
  shadow(ctx, x, y + 6, 70);
  block(ctx, plot, 8, colors.gingerbread, colors.wood, colors.cocoa);
  if (!label.closed) {
    const sleigh = { kind: 'sleigh' as const, x: plot.x + 0.5, y: plot.y + 0.5, w: 1, h: 1 };
    ctx.save();
    ctx.translate(0, -8);
    drawSleigh(ctx, { ...sleigh, seed: 0, blocks: true });
    ctx.restore();
  }
  const { post, w, h } = PLATFORM_SIGN;
  const foot = { x: (c.left.x + c.bottom.x) / 2, y: (c.left.y + c.bottom.y) / 2 - 4 };
  const lift = near ? Math.abs(Math.sin(time / 180)) * 6 : 0;
  ctx.fillStyle = colors.cocoa;
  ctx.fillRect(foot.x - 3, foot.y - post, 6, post);
  const top = foot.y - post - h - lift;
  ctx.fillRect(foot.x - w / 2 - 3, top - 3, w + 6, h + 6);
  ctx.fillStyle = colors.cream;
  ctx.fillRect(foot.x - w / 2, top, w, h);
  ctx.fillStyle = label.closed ? colors.muted : label.color;
  ctx.fillRect(foot.x - w / 2, top + h - 5, w, 5);
  ctx.fillStyle = colors.ink;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = canvasFont('small', 'bold');
  ctx.fillText(label.name, foot.x, top + 12, w - 10);
  ctx.font = canvasFont('small');
  ctx.fillText(label.closed ? 'Closed for repairs' : label.by, foot.x, top + 29, w - 10);
  ctx.textBaseline = 'alphabetic';
  const box = standing(plot, 50);
  const left = Math.min(box.x, foot.x - w / 2 - 4);
  return {
    x: left,
    y: Math.min(box.y, top - 4),
    w: Math.max(box.x + box.w, foot.x + w / 2 + 4) - left,
    h: box.y + box.h - Math.min(box.y, top - 4),
  };
}

/** A small "Being updated" sign on a post at a booth's side, while a change to it is being built. */
export function drawUpdateSign(ctx: CanvasRenderingContext2D, plot: Plot) {
  const c = corners(plot);
  const foot = { x: (c.bottom.x + c.right.x) / 2 + 10, y: (c.bottom.y + c.right.y) / 2 + 6 };
  const w = 104;
  const h = 22;
  ctx.fillStyle = colors.cocoa;
  ctx.fillRect(foot.x - 2, foot.y - 30, 4, 30);
  const top = foot.y - 30 - h;
  ctx.fillRect(foot.x - w / 2 - 2, top - 2, w + 4, h + 4);
  ctx.fillStyle = colors.gold;
  ctx.fillRect(foot.x - w / 2, top, w, h);
  ctx.fillStyle = colors.ink;
  ctx.font = canvasFont('small', 'bold');
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('Being updated', foot.x, top + h / 2 + 1, w - 6);
  ctx.textBaseline = 'alphabetic';
}
