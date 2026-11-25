/**
 * The depot's parcels, wrapped in violet paper with gold ribbon: the boxes that
 * stand on the stack and in the sleigh, and the flat ones in someone's hands.
 */
import { box, iso } from '../../../src/northpole/diorama';
import { theme } from '../../../src/northpole/theme';
import { circle, type Ctx, poly, rightShade } from './brush';

const { colors } = theme;

/** A parcel in violet paper with a gold ribbon and bow, standing on the ground at (gx, gy). */
export function parcel(ctx: Ctx, gx: number, gy: number, lift: number) {
  const w = 4;
  const d = 4;
  const h = 3.6;
  box(ctx, gx, gy, w, d, h, colors.violet, colors.violet, colors.violet, lift);
  rightShade(ctx, gx, gy, w, d, h, lift, 0.32);
  poly(
    ctx,
    colors.snowLit,
    [
      iso(gx, gy, lift + h),
      iso(gx + w, gy, lift + h),
      iso(gx + w, gy + d, lift + h),
      iso(gx, gy + d, lift + h),
    ],
    0.2,
  );
  const m = w / 2;
  const r = 0.45;
  // Ribbon over the top, down the lit side and down the shaded side.
  poly(ctx, colors.gold, [
    iso(gx + m - r, gy, lift + h),
    iso(gx + m + r, gy, lift + h),
    iso(gx + m + r, gy + d, lift + h),
    iso(gx + m - r, gy + d, lift + h),
  ]);
  poly(ctx, colors.gold, [
    iso(gx + m - r, gy + d, lift),
    iso(gx + m + r, gy + d, lift),
    iso(gx + m + r, gy + d, lift + h),
    iso(gx + m - r, gy + d, lift + h),
  ]);
  poly(ctx, colors.gold, [
    iso(gx + w, gy + m - r, lift),
    iso(gx + w, gy + m + r, lift),
    iso(gx + w, gy + m + r, lift + h),
    iso(gx + w, gy + m - r, lift + h),
  ]);
  rightShade(ctx, gx + w - 0.001, gy + m - r, 0.001, 2 * r, h, lift, 0.32);
  const bow = iso(gx + m, gy + m, lift + h);
  circle(ctx, bow.x - 0.5, bow.y - 0.4, 0.55, colors.gold);
  circle(ctx, bow.x + 0.5, bow.y - 0.4, 0.55, colors.gold);
}

/** A parcel carried or passed, seen from the front, `s` wide, with its centre at (x, y). */
export function flatParcel(ctx: Ctx, x: number, y: number, s: number) {
  ctx.fillStyle = colors.violet;
  ctx.fillRect(x - s / 2, y - s * 0.45, s, s * 0.9);
  ctx.fillStyle = colors.shadow;
  ctx.globalAlpha = 0.25;
  ctx.fillRect(x, y - s * 0.45, s / 2, s * 0.9);
  ctx.globalAlpha = 1;
  ctx.fillStyle = colors.gold;
  ctx.fillRect(x - s * 0.1, y - s * 0.45, s * 0.2, s * 0.9);
  ctx.fillRect(x - s / 2, y - s * 0.08, s, s * 0.16);
}
