/** The shop's flat front, drawn straight onto its wall: strips, outlines and lettering. */
import { iso } from '../../../src/northpole/diorama';
import { canvasFont, theme } from '../../../src/northpole/theme';

/** The drawing context a square gets, inside its sandboxed frame. */
export type Ctx = CanvasRenderingContext2D;

/** Words in the theme's font at (x, y), `height` units tall and no wider than `width`. */
export function words(
  ctx: Ctx,
  text: string,
  x: number,
  y: number,
  height: number,
  width: number,
  weight: 'normal' | 'bold' = 'normal',
) {
  ctx.save();
  ctx.font = canvasFont('title', weight);
  const k = height / theme.font.title;
  ctx.translate(x, y);
  ctx.scale(k, k);
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, 0, 0, width / k);
  ctx.restore();
}

/** Traces the outline through iso `points`, ready for the caller to fill. */
export function outline(ctx: Ctx, points: { x: number; y: number }[]) {
  ctx.beginPath();
  points.forEach((p, n) => {
    if (n) ctx.lineTo(p.x, p.y);
    else ctx.moveTo(p.x, p.y);
  });
}

/** A strip along the shop's front, from gx0 to gx1 at gy, from z0 up to z1. */
export function front(ctx: Ctx, gx0: number, gx1: number, gy: number, z0: number, z1: number) {
  outline(ctx, [iso(gx0, gy, z0), iso(gx1, gy, z0), iso(gx1, gy, z1), iso(gx0, gy, z1)]);
  ctx.closePath();
}
