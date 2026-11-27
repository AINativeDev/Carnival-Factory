/**
 * The Hot Cocoa Stand itself, in scene units: a wooden hut on the snow with
 * its planked front facing the lower left, a lantern glowing in the serving
 * hatch, the counter out in front, the scalloped awning and the sign on the roof.
 */
import { box, glow, iso, shadow } from '../../../src/northpole/diorama';
import { theme } from '../../../src/northpole/theme';

const { colors } = theme;

/** How tall the hut's walls stand, in scene units. */
const WALL = 30;

/** Starts a path through `points`. */
function trace(ctx: CanvasRenderingContext2D, points: readonly { x: number; y: number }[]) {
  points.forEach((p, n) => {
    if (n) ctx.lineTo(p.x, p.y);
    else ctx.moveTo(p.x, p.y);
  });
}

/** A strip along the stall's front, from gx0 to gx1 at gy, from z0 up to z1. */
function front(
  ctx: CanvasRenderingContext2D,
  gx0: number,
  gx1: number,
  gy: number,
  z0: number,
  z1: number,
) {
  const points = [iso(gx0, gy, z0), iso(gx1, gy, z0), iso(gx1, gy, z1), iso(gx0, gy, z1)];
  ctx.beginPath();
  trace(ctx, points);
  ctx.closePath();
}

/** The hut and its counter, the lantern in the hatch glowing gently at `time`. */
export function hut(ctx: CanvasRenderingContext2D, time: number) {
  const c = iso(0, 0);
  shadow(ctx, c.x + 2, c.y + 4, 64);
  box(ctx, -15, -9, 30, 17, WALL, colors.snow, colors.wood, colors.cocoa);
  ctx.strokeStyle = colors.cocoa;
  ctx.lineWidth = 0.35;
  for (let z = 4; z < WALL; z += 4) {
    const a = iso(-15, 8, z);
    const b = iso(15, 8, z);
    ctx.beginPath();
    ctx.moveTo(a.x, a.y);
    ctx.lineTo(b.x, b.y);
    ctx.stroke();
  }
  ctx.fillStyle = colors.ink;
  front(ctx, -12, 12, 8, 12, 25);
  ctx.fill();
  const lamp = iso(0, 8, 21);
  glow(ctx, lamp.x, lamp.y, 10, 0.75 + 0.25 * Math.sin(time / 1_400));
  ctx.fillStyle = colors.lantern;
  ctx.beginPath();
  ctx.arc(lamp.x, lamp.y, 1.6, 0, Math.PI * 2);
  ctx.fill();
  box(ctx, -15, 8, 30, 4, 12, colors.snowShade, colors.gingerbread, colors.wood);
  awning(ctx);
}

/** The red and yellow scalloped awning over the counter, and the gold sign of three cocoa drops on the roof. */
function awning(ctx: CanvasRenderingContext2D) {
  const stripes = 8;
  for (let i = 0; i < stripes; i++) {
    const gx0 = -16 + (32 * i) / stripes;
    const gx1 = gx0 + 32 / stripes;
    ctx.fillStyle = i % 2 ? colors.lantern : colors.berry;
    const points = [
      iso(gx0, 8, WALL),
      iso(gx1, 8, WALL),
      iso(gx1, 13, WALL - 3),
      iso(gx0, 13, WALL - 3),
    ];
    ctx.beginPath();
    trace(ctx, points);
    ctx.fill();
    const mid = iso((gx0 + gx1) / 2, 13, WALL - 3);
    ctx.beginPath();
    ctx.ellipse(mid.x, mid.y, 2, 1.6, Math.atan2(1, 2), 0, Math.PI);
    ctx.fill();
  }
  ctx.fillStyle = colors.snow;
  front(ctx, -16, 16, 8, WALL, WALL + 1.5);
  ctx.fill();
  box(ctx, -9, -1, 18, 1.2, 8, colors.gold, colors.gold, colors.wood, WALL);
  ctx.fillStyle = colors.cocoa;
  for (let i = 0; i < 3; i++) {
    const p = iso(-5 + i * 5, 0.2, WALL + 4);
    ctx.beginPath();
    ctx.arc(p.x, p.y, 1.4, 0, Math.PI * 2);
    ctx.fill();
  }
}
