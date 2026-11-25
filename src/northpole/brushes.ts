/**
 * The map's shared brushes for things standing on the snow: their footprint's
 * corners, lit blocks, cool shadows, warm glows and bulbs. The scenery in
 * `render.ts` and the level props in `rides.ts` and `performers.ts` paint with
 * the same ones, so a carousel stands in the same light as a cabin.
 */
import { theme } from './theme';
import { toScreen, type Box, type Tile } from './world';

const { colors } = theme;

/** Where a box's ground diamond has its corners on screen. */
export function corners(box: Box) {
  const at = (x: number, y: number) => toScreen({ x: x - 0.5, y: y - 0.5 });
  return {
    top: at(box.x, box.y),
    right: at(box.x + box.w, box.y),
    bottom: at(box.x + box.w, box.y + box.h),
    left: at(box.x, box.y + box.h),
  };
}

/** The middle of a box's footprint on screen. */
export function middle(box: Box): Tile {
  return toScreen({ x: box.x + (box.w - 1) / 2, y: box.y + (box.h - 1) / 2 });
}

export function diamond(ctx: CanvasRenderingContext2D, c: ReturnType<typeof corners>, lift = 0) {
  ctx.beginPath();
  ctx.moveTo(c.top.x, c.top.y - lift);
  ctx.lineTo(c.right.x, c.right.y - lift);
  ctx.lineTo(c.bottom.x, c.bottom.y - lift);
  ctx.lineTo(c.left.x, c.left.y - lift);
  ctx.closePath();
}

/** A box standing `height` high on its footprint: its two front faces and its top. */
export function block(
  ctx: CanvasRenderingContext2D,
  box: Box,
  height: number,
  top: string,
  left: string,
  right: string,
  lift = 0,
) {
  const c = corners(box);
  ctx.fillStyle = left;
  ctx.beginPath();
  ctx.moveTo(c.left.x, c.left.y - lift);
  ctx.lineTo(c.bottom.x, c.bottom.y - lift);
  ctx.lineTo(c.bottom.x, c.bottom.y - lift - height);
  ctx.lineTo(c.left.x, c.left.y - lift - height);
  ctx.fill();
  ctx.fillStyle = right;
  ctx.beginPath();
  ctx.moveTo(c.bottom.x, c.bottom.y - lift);
  ctx.lineTo(c.right.x, c.right.y - lift);
  ctx.lineTo(c.right.x, c.right.y - lift - height);
  ctx.lineTo(c.bottom.x, c.bottom.y - lift - height);
  ctx.fill();
  ctx.fillStyle = top;
  diamond(ctx, c, lift + height);
  ctx.fill();
}

/** A soft round glow, as a lamp or a window throws. */
export function glow(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  radius: number,
  strength: number,
) {
  ctx.fillStyle = colors.glow;
  for (const r of [radius, radius * 0.65, radius * 0.35]) {
    ctx.globalAlpha = 0.12 * strength;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
}

/** A shadow on the snow under something standing. */
export function shadow(ctx: CanvasRenderingContext2D, x: number, y: number, width: number) {
  ctx.fillStyle = colors.night;
  ctx.globalAlpha = 0.18;
  ctx.beginPath();
  ctx.ellipse(x, y, width, width / 2.4, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = 1;
}

/** A filled outline through `points`, ready to fill. */
export function quad(ctx: CanvasRenderingContext2D, points: Tile[]) {
  ctx.beginPath();
  points.forEach((p, i) => {
    if (i) ctx.lineTo(p.x, p.y);
    else ctx.moveTo(p.x, p.y);
  });
  ctx.closePath();
}

/** How bright a string light is at `time`: most of them glow, and now and then one dips. */
export function twinkle(time: number, seed: number) {
  return 0.65 + 0.35 * Math.sin(time / 420 + seed * 1.7) * Math.sin(time / 1300 + seed * 0.3);
}

/** One warm light bulb with its glow. */
export function bulb(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  color: string,
  strength: number,
) {
  ctx.globalAlpha = 0.25 * strength;
  ctx.fillStyle = colors.glow;
  ctx.beginPath();
  ctx.arc(x, y, 5, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = strength;
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(x, y, 2, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = 1;
}
