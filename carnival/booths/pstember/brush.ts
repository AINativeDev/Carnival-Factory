/**
 * The few strokes every part of the depot is painted with: filled shapes,
 * round-capped lines and the shaded faces of boxes, so each part of the scene
 * reads as what it draws rather than as canvas calls.
 */
import { iso } from '../../../src/northpole/diorama';
import { theme } from '../../../src/northpole/theme';

const { colors } = theme;

/** The canvas every part of the depot paints on. */
export type Ctx = CanvasRenderingContext2D;

/** A filled shape through `points`, at `alpha`, for faces and cloth. */
export function poly(ctx: Ctx, color: string, points: { x: number; y: number }[], alpha = 1) {
  ctx.fillStyle = color;
  ctx.globalAlpha = alpha;
  ctx.beginPath();
  points.forEach((p, n) => {
    if (n) ctx.lineTo(p.x, p.y);
    else ctx.moveTo(p.x, p.y);
  });
  ctx.closePath();
  ctx.fill();
  ctx.globalAlpha = 1;
}

/** A filled dot, for heads, eyes, bobbles and snow caps. */
export function circle(ctx: Ctx, x: number, y: number, r: number, color: string) {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();
}

/** A filled oval, tilted by `tilt` radians, for bodies, beards and hoof prints. */
export function ellipse(
  ctx: Ctx,
  x: number,
  y: number,
  rx: number,
  ry: number,
  color: string,
  tilt = 0,
) {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.ellipse(x, y, rx, ry, tilt, 0, Math.PI * 2);
  ctx.fill();
}

/** A round-capped line through `pts`, for legs, arms, rails and antlers. */
export function line(ctx: Ctx, color: string, width: number, ...pts: [number, number][]) {
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.beginPath();
  pts.forEach(([x, y], n) => {
    if (n) ctx.lineTo(x, y);
    else ctx.moveTo(x, y);
  });
  ctx.stroke();
}

/** The shaded right face of a box, to darken it: the light comes from the upper left. */
export function rightShade(
  ctx: Ctx,
  gx: number,
  gy: number,
  w: number,
  d: number,
  h: number,
  lift: number,
  alpha: number,
) {
  poly(
    ctx,
    colors.shadow,
    [
      iso(gx + w, gy + d, lift),
      iso(gx + w, gy, lift),
      iso(gx + w, gy, lift + h),
      iso(gx + w, gy + d, lift + h),
    ],
    alpha,
  );
}

/** The lit left face of a box, painted again to cover what sank inside it. */
export function leftFace(
  ctx: Ctx,
  gx: number,
  gy: number,
  w: number,
  d: number,
  h: number,
  lift: number,
  color: string,
) {
  poly(ctx, color, [
    iso(gx, gy + d, lift),
    iso(gx + w, gy + d, lift),
    iso(gx + w, gy + d, lift + h),
    iso(gx, gy + d, lift + h),
  ]);
}
