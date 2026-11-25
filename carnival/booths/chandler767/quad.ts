import type { Point } from '../../../src/northpole/diorama';

type Ctx = CanvasRenderingContext2D;

/** Fills the flat four-cornered patch between `a`, `b`, `c` and `d`: a ledge, a ribbon of ice or a stripe of awning on a wall. */
export function quad(ctx: Ctx, a: Point, b: Point, c: Point, d: Point) {
  ctx.beginPath();
  ctx.moveTo(a.x, a.y);
  ctx.lineTo(b.x, b.y);
  ctx.lineTo(c.x, c.y);
  ctx.lineTo(d.x, d.y);
  ctx.closePath();
  ctx.fill();
}
