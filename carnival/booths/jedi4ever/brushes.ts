import { canvasFont, theme } from '../../../src/northpole/theme';

/** The canvas every part of the night run paints on. */
export type Ctx = CanvasRenderingContext2D;

/** A filled dot: lamps, wheels, wreaths and sparkles are all made of them. */
export function circle(ctx: Ctx, x: number, y: number, r: number) {
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();
}

/** A filled flat-sided shape through the given corners. */
export function polygon(ctx: Ctx, corners: readonly (readonly [number, number])[], fill: string) {
  ctx.fillStyle = fill;
  ctx.beginPath();
  corners.forEach(([x, y], index) => {
    if (index === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  });
  ctx.closePath();
  ctx.fill();
}

/** A rounded block, for vehicle bodies. */
export function slab(ctx: Ctx, x: number, y: number, w: number, h: number, fill: string) {
  ctx.fillStyle = fill;
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, Math.min(w, h) * 0.2);
  ctx.fill();
}

/** The colours every part uses, so each file reads `colors.berry`. */
export const colors = theme.colors;

/** Words in the theme's font, `height` units tall and no wider than `width`. */
export function words(ctx: Ctx, text: string, x: number, y: number, height: number, width: number) {
  ctx.save();
  ctx.font = canvasFont('title', 'bold');
  const k = height / theme.font.title;
  ctx.translate(x, y);
  ctx.scale(k, k);
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, 0, 0, width / k);
  ctx.restore();
}
