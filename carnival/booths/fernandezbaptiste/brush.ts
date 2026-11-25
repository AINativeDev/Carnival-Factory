/**
 * The few strokes the whole scene is drawn with: a filled shape, a rounded
 * line and a line of text at the scene's scale, so the table, the cards and
 * the elves all paint the same way.
 */
import type { Point } from '../../../src/northpole/diorama';
import { canvasFont } from '../../../src/northpole/theme';

/** The context the scene is drawn on. */
export type Ctx = CanvasRenderingContext2D;

/** A filled shape through `points`, for card faces, coats, hats and the baize. */
export function poly(ctx: Ctx, color: string, points: readonly Point[]) {
  ctx.fillStyle = color;
  ctx.beginPath();
  points.forEach((p, n) => {
    if (n) ctx.lineTo(p.x, p.y);
    else ctx.moveTo(p.x, p.y);
  });
  ctx.closePath();
  ctx.fill();
}

/** A rounded line from `a` to `b`, for arms and the lantern's post. */
export function line(ctx: Ctx, color: string, width: number, a: Point, b: Point) {
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(a.x, a.y);
  ctx.lineTo(b.x, b.y);
  ctx.stroke();
}

/** The point `k` of the way from `a` to `b`, for a hand reaching across the table. */
export function lerp(a: Point, b: Point, k: number): Point {
  return { x: a.x + (b.x - a.x) * k, y: a.y + (b.y - a.y) * k };
}

/** A line of small text centred on (x, y), at the scene's scale: the score and what a tap does. */
export function label(
  ctx: Ctx,
  x: number,
  y: number,
  text: string,
  color: string,
  align: 'left' | 'center',
) {
  ctx.fillStyle = color;
  ctx.font = canvasFont('small', 'bold');
  ctx.textAlign = align;
  ctx.textBaseline = 'middle';
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(0.3, 0.3);
  ctx.fillText(text, 0, 0, 90 / 0.3);
  ctx.restore();
}
