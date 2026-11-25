/**
 * Santa by the depot's gate, waving to visitors with one hand and holding a
 * parcel in the other.
 */
import { shadow } from '../../../src/northpole/diorama';
import { theme } from '../../../src/northpole/theme';
import { circle, type Ctx, ellipse, line, poly } from './brush';
import { flatParcel } from './parcels';

const { colors } = theme;

/** Santa in his red coat, waving with his left arm at `wave` radians up from his side and holding a parcel in the other. */
export function santa(ctx: Ctx, x: number, y: number, wave: number) {
  shadow(ctx, x, y + 0.4, 9);
  line(ctx, colors.ink, 1.6, [x - 1.2, y - 3.5], [x - 1.3, y]);
  line(ctx, colors.ink, 1.6, [x + 1.2, y - 3.5], [x + 1.3, y]);
  poly(ctx, colors.berry, [
    { x: x - 3.3, y: y - 3.6 },
    { x: x + 3.3, y: y - 3.6 },
    { x: x + 2.4, y: y - 11 },
    { x: x - 2.4, y: y - 11 },
  ]);
  poly(
    ctx,
    colors.shadow,
    [
      { x: x + 0.6, y: y - 3.6 },
      { x: x + 3.3, y: y - 3.6 },
      { x: x + 2.4, y: y - 11 },
      { x: x + 0.6, y: y - 11 },
    ],
    0.3,
  );
  ctx.fillStyle = colors.snow;
  ctx.fillRect(x - 3.4, y - 4.2, 6.8, 0.9);
  ctx.fillStyle = colors.ink;
  ctx.fillRect(x - 3, y - 7.2, 6, 0.9);
  ctx.fillStyle = colors.gold;
  ctx.fillRect(x - 0.6, y - 7.3, 1.2, 1.1);
  // The waving arm, from the shoulder, and the one with the parcel.
  const sx = x - 2.4;
  const sy = y - 10;
  const ex = sx - Math.sin(wave) * 4.6;
  const ey = sy + Math.cos(wave) * 4.6;
  line(ctx, colors.berry, 1.3, [sx, sy], [ex, ey]);
  circle(ctx, ex, ey, 0.9, colors.snow);
  line(ctx, colors.berry, 1.3, [x + 2.4, y - 10], [x + 3.6, y - 7.4]);
  flatParcel(ctx, x + 3.4, y - 6.4, 3.4);
  circle(ctx, x + 3.4, y - 7.3, 0.8, colors.snow);
  // Head, beard, cap.
  circle(ctx, x, y - 13, 2.3, colors.horizon);
  ellipse(ctx, x, y - 11.6, 2.4, 1.9, colors.snow);
  circle(ctx, x - 0.8, y - 13.3, 0.25, colors.ink);
  circle(ctx, x + 0.8, y - 13.3, 0.25, colors.ink);
  circle(ctx, x, y - 12.5, 0.4, colors.berry);
  poly(ctx, colors.berry, [
    { x: x - 2.5, y: y - 14.2 },
    { x: x + 2.5, y: y - 14.2 },
    { x: x + 1.4, y: y - 18.4 },
  ]);
  ctx.fillStyle = colors.snow;
  ctx.fillRect(x - 2.7, y - 15, 5.4, 1);
  circle(ctx, x + 1.5, y - 18.6, 0.8, colors.snow);
}
