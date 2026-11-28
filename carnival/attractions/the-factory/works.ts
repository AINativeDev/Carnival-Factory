/**
 * The factory's works the tour's scenes are built from: a belt running across
 * the slab, a lamp post for a gate that glows mint once a parcel is through, a
 * small workshop with a warm door and a snowy roof, and a chimney's slow
 * smoke. A belt that runs across the screen runs along the slab's long
 * diagonal, so its top is a flat band and only its front side shows.
 */
import { box, glow, iso, shadow } from '../../../src/northpole/diorama';
import { theme } from '../../../src/northpole/theme';
import { groundAt } from './props';

const { colors } = theme;

/** How wide a belt's top is, and how deep its front side. */
const BELT = { half: 1.4, side: 1.4 };

/** The parcel's height over the belt line `y`. */
export const ON_BELT = BELT.half * 0.4;

/** A belt from `x0` to `x1` along `y`, its rollers moved `shift` units on. */
export function belt(
  ctx: CanvasRenderingContext2D,
  x0: number,
  x1: number,
  y: number,
  shift: number,
) {
  const w = x1 - x0;
  const { half, side } = BELT;
  ctx.fillStyle = colors.shadow;
  ctx.globalAlpha = 0.25;
  ctx.fillRect(x0 + 1, y + half + side, w, 1.8);
  ctx.globalAlpha = 1;
  ctx.fillStyle = colors.cocoa;
  for (let x = x0 + 2; x < x1; x += 12) ctx.fillRect(x, y + half + side - 0.2, 0.8, 1.6);
  ctx.fillStyle = colors.night;
  ctx.fillRect(x0, y + half, w, side);
  ctx.fillStyle = colors.surface;
  ctx.fillRect(x0, y - half, w, half * 2);
  ctx.fillStyle = colors.mountainFar;
  ctx.fillRect(x0, y - half, w, 0.35);
  ctx.strokeStyle = colors.mountain;
  ctx.lineWidth = 0.3;
  const gap = 2.4;
  for (let x = x0 + (((shift % gap) + gap) % gap); x < x1; x += gap) {
    ctx.beginPath();
    ctx.moveTo(x, y - half + 0.5);
    ctx.lineTo(x, y + half - 0.2);
    ctx.stroke();
  }
}

/** A gate's lamp post standing on `x`, `y`, `h` tall: dim until `on` (from 0 to 1) lights it mint. */
export function lamp(ctx: CanvasRenderingContext2D, x: number, y: number, h: number, on: number) {
  shadow(ctx, x, y, 3);
  ctx.fillStyle = colors.cocoa;
  ctx.fillRect(x - 0.35, y - h, 0.7, h);
  ctx.fillRect(x - 1.1, y - h - 0.3, 2.2, 0.6);
  if (on > 0) {
    glow(ctx, x, y - h - 1.4, 7, on);
    ctx.fillStyle = colors.mint;
    ctx.globalAlpha = 0.3 * on;
    ctx.beginPath();
    ctx.arc(x, y - h - 1.4, 3.2, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
  ctx.fillStyle = on > 0.5 ? colors.mint : colors.slabShade;
  ctx.beginPath();
  ctx.arc(x, y - h - 1.4, 1.1, 0, Math.PI * 2);
  ctx.fill();
}

/**
 * A path round a patch of a box's side: from `gx`, `gy`, `u` along the side
 * (along gx when `alongX`, the lit left side, else along gy, the shaded right
 * side) and `w` wide, from `z` up and `h` high.
 */
export function patch(
  ctx: CanvasRenderingContext2D,
  gx: number,
  gy: number,
  alongX: boolean,
  u: number,
  w: number,
  z: number,
  h: number,
) {
  ctx.beginPath();
  for (const [du, dz] of [
    [0, 0],
    [w, 0],
    [w, h],
    [0, h],
  ] as const) {
    const along = u + du;
    const p = alongX ? iso(gx + along, gy, z + dz) : iso(gx, gy + along, z + dz);
    if (du || dz) ctx.lineTo(p.x, p.y);
    else ctx.moveTo(p.x, p.y);
  }
  ctx.closePath();
}

/**
 * A small workshop whose nearest corner stands on `x`, `y`: `s` across, `h`
 * high, a strip of `roof` colour under its snowy top, and a warm door and
 * window on its lit side, glowing by `warm` from 0 to 1.
 */
export function hut(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  s: number,
  h: number,
  roof: string,
  warm = 1,
) {
  const { gx, gy } = groundAt(x, y);
  shadow(ctx, x + s * 0.4, y - s * 0.3, s * 2.4);
  box(ctx, gx - s, gy - s, s, s, h, colors.snowLit, colors.gingerbread, colors.cocoa);
  ctx.fillStyle = roof;
  patch(ctx, gx - s, gy, true, 0, s, h - 1.1, 1.1);
  ctx.fill();
  const door = iso(gx - s * 0.45, gy, h * 0.3);
  glow(ctx, door.x, door.y, s * 1.6, warm);
  ctx.fillStyle = colors.lantern;
  ctx.globalAlpha = 0.55 + 0.45 * warm;
  patch(ctx, gx - s, gy, true, s * 0.3, s * 0.32, 0, h * 0.55);
  ctx.fill();
  ctx.fillStyle = colors.glow;
  patch(ctx, gx - s, gy, true, s * 0.72, s * 0.18, h * 0.45, h * 0.22);
  ctx.fill();
  ctx.globalAlpha = 1;
}

/** Slow puffs of smoke from a chimney top at `x`, `y`, rising and fading over a few seconds. */
export function smoke(ctx: CanvasRenderingContext2D, x: number, y: number, time: number) {
  ctx.fillStyle = colors.cloud;
  for (let n = 0; n < 3; n++) {
    const t = (time / 3_600 + n / 3) % 1;
    ctx.globalAlpha = 0.45 * (1 - t);
    ctx.beginPath();
    ctx.arc(x + t * 3 + Math.sin(t * 5) * 0.6, y - t * 7, 1 + t * 1.6, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
}
