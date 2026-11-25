import { canvasFont, theme } from '../../../src/northpole/theme';

/** The canvas every part of the workshop paints on. */
export type Ctx = CanvasRenderingContext2D;

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

/** A filled dot: the bulbs, wheels, heads and snowflakes are all made of them. */
export function circle(ctx: Ctx, x: number, y: number, r: number) {
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();
}
