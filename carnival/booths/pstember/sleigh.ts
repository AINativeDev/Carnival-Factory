/**
 * The loading side of the depot: the stack of parcels the elf takes from, and
 * the sleigh the parcel is passed into. The sleigh's front faces are painted
 * last so a stowed parcel sinks out of sight inside it.
 */
import { box, iso, shadow } from '../../../src/northpole/diorama';
import { theme } from '../../../src/northpole/theme';
import { type Ctx, leftFace, line, poly, rightShade } from './brush';
import { flatParcel, parcel } from './parcels';
import { ease, handoffAt, stackAt } from './timing';

const { colors } = theme;

/** The parcel on top of the stack: the one taken and the one that drops back. */
const STACK_TOP = { gx: -20, gy: -4.5, lift: 3.6 };
/** Where the stack's parcels sit, bottom two first, so the stack shrinks from the top. */
const STACK_AT = [{ gx: -20, gy: -7, lift: 0 }, { gx: -20, gy: -2, lift: 0 }, STACK_TOP];
const SLEIGH = { gx: -14, gy: -18, w: 12, d: 7, h: 4, lift: 1 };

/** The stack of parcels at `t` through the round, with a new parcel dropping onto it. */
export function parcelStack(ctx: Ctx, t: number) {
  const stack = stackAt(t);
  STACK_AT.slice(0, stack.settled).forEach((p) => {
    parcel(ctx, p.gx, p.gy, p.lift);
  });
  if (stack.falling !== null) {
    parcel(
      ctx,
      STACK_TOP.gx,
      STACK_TOP.gy,
      STACK_TOP.lift + 26 * (1 - stack.falling * stack.falling),
    );
  }
}

/** The sleigh at `t` through the round, with its load and the parcel being passed in. */
export function sleigh(ctx: Ctx, t: number) {
  const s = SLEIGH;
  for (const gy of [s.gy + 0.8, s.gy + s.d - 0.8]) {
    const a = iso(s.gx - 1, gy);
    const b = iso(s.gx + s.w, gy);
    const c = iso(s.gx + s.w + 2.4, gy, 3.2);
    ctx.strokeStyle = colors.gold;
    ctx.lineWidth = 0.7;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(a.x, a.y);
    ctx.lineTo(b.x, b.y);
    ctx.quadraticCurveTo(b.x + 2.2, b.y, c.x, c.y);
    ctx.stroke();
  }
  shadow(ctx, iso(-8, -14).x + 2, iso(-8, -14).y + 3, 22);
  box(ctx, s.gx, s.gy, s.w, s.d, s.h, colors.cocoa, colors.berry, colors.berry, s.lift);
  parcel(ctx, -12.5, -16.5, 2.4);
  parcel(ctx, -8.5, -15.5, 2.4);
  const stowed = handoffAt(t);
  const rim = { x: iso(-8, -14).x, y: iso(-8, -14, s.lift + s.h).y - 1.6 };
  const hands = { x: iso(-10, -6).x + 3.4, y: iso(-10, -6).y - 8.6 };
  if (stowed?.stage === 'pass') {
    const k = ease(stowed.progress);
    flatParcel(
      ctx,
      hands.x + (rim.x - hands.x) * k,
      hands.y + (rim.y - 4 - hands.y) * k - Math.sin(k * Math.PI) * 2,
      3.4,
    );
  } else if (stowed) {
    const k = ease(stowed.progress);
    ctx.globalAlpha = 1 - ease((stowed.progress - 0.55) / 0.4);
    flatParcel(ctx, rim.x, rim.y - 4 + k * 8, 3.4);
    ctx.globalAlpha = 1;
  }
  // The sleigh's front faces cover whatever has sunk inside.
  leftFace(ctx, s.gx, s.gy, s.w, s.d, s.h, s.lift, colors.berry);
  poly(ctx, colors.berry, [
    iso(s.gx + s.w, s.gy + s.d, s.lift),
    iso(s.gx + s.w, s.gy, s.lift),
    iso(s.gx + s.w, s.gy, s.lift + s.h),
    iso(s.gx + s.w, s.gy + s.d, s.lift + s.h),
  ]);
  rightShade(ctx, s.gx, s.gy, s.w, s.d, s.h, s.lift, 0.3);
  const trimFrom = iso(s.gx, s.gy + s.d, s.lift + s.h - 0.8);
  const trimTo = iso(s.gx + s.w, s.gy + s.d, s.lift + s.h - 0.8);
  line(ctx, colors.gold, 0.5, [trimFrom.x, trimFrom.y], [trimTo.x, trimTo.y]);
}
