import { box, glow, iso, shadow, stringLights } from '../../../src/northpole/diorama';
import { theme } from '../../../src/northpole/theme';
import { rise } from './motion';
import { quad } from './quad';

const { colors } = theme;

type Ctx = CanvasRenderingContext2D;

// The hut stands at the front right: its lit face is at gy = HUT.gy + HUT.d.
const HUT = { gx: 5, gy: 3, w: 13, d: 10, h: 9 };
const HUT_FACE = HUT.gy + HUT.d;

function seller(ctx: Ctx) {
  const c = iso(9.5, HUT_FACE, 2.6);
  // Body in the hatch, a berry jumper and a cream hat.
  ctx.fillStyle = colors.berry;
  ctx.beginPath();
  ctx.ellipse(c.x, c.y + 1.2, 1.9, 1.6, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = colors.horizon;
  ctx.beginPath();
  ctx.arc(c.x, c.y - 1.3, 1.2, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = colors.cream;
  ctx.fillRect(c.x - 1.2, c.y - 3.3, 2.4, 1.3);
  ctx.beginPath();
  ctx.arc(c.x, c.y - 3.3, 1.2, Math.PI, 0);
  ctx.fill();
}

function waffle(ctx: Ctx, x: number, y: number) {
  ctx.fillStyle = colors.gold;
  ctx.beginPath();
  ctx.ellipse(x, y, 2.2, 1.1, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = colors.gingerbread;
  ctx.lineWidth = 0.2;
  ctx.beginPath();
  ctx.moveTo(x - 1.2, y - 0.9);
  ctx.lineTo(x + 1.2, y + 0.9);
  ctx.moveTo(x + 1.2, y - 0.9);
  ctx.lineTo(x - 1.2, y + 0.9);
  ctx.moveTo(x, y - 1.1);
  ctx.lineTo(x, y + 1.1);
  ctx.stroke();
}

/** The waffle hut at the front right: its lit hatch with the seller and a steaming waffle, the awning, the snowy roof, chimney smoke and string lights. */
export function hut(ctx: Ctx, time: number) {
  const c = iso(HUT.gx + HUT.w / 2, HUT.gy + HUT.d / 2);
  shadow(ctx, c.x + 3, c.y + 5, 28);
  box(ctx, HUT.gx, HUT.gy, HUT.w, HUT.d, HUT.h, colors.wood, colors.gingerbread, colors.cocoa);
  // Planks on the lit face.
  ctx.strokeStyle = colors.cocoa;
  ctx.globalAlpha = 0.35;
  ctx.lineWidth = 0.2;
  for (let z = 2; z < HUT.h; z += 2.2) {
    const a = iso(HUT.gx, HUT_FACE, z);
    const b = iso(HUT.gx + HUT.w, HUT_FACE, z);
    ctx.beginPath();
    ctx.moveTo(a.x, a.y);
    ctx.lineTo(b.x, b.y);
    ctx.stroke();
  }
  ctx.globalAlpha = 1;

  // The serving hatch, lit from inside.
  const lit = 0.85 + 0.15 * Math.sin(time / 1_100);
  ctx.fillStyle = colors.lantern;
  ctx.globalAlpha = lit;
  quad(
    ctx,
    iso(6.5, HUT_FACE, 7),
    iso(13, HUT_FACE, 7),
    iso(13, HUT_FACE, 1.8),
    iso(6.5, HUT_FACE, 1.8),
  );
  ctx.globalAlpha = 1;
  seller(ctx);
  // The counter, with a waffle on it, low enough to show the seller above it.
  box(ctx, 6.5, HUT_FACE, 6.5, 2.5, 1.8, colors.snow, colors.wood, colors.cocoa);
  const w = iso(9, HUT_FACE + 1.2, 2.4);
  waffle(ctx, w.x, w.y);

  // The striped awning over the hatch: short and high, so the seller's face shows under it.
  for (let k = 0; k < 4; k++) {
    const x0 = 6 + k * 1.75;
    const x1 = x0 + 1.75;
    ctx.fillStyle = k % 2 ? colors.cream : colors.berry;
    quad(
      ctx,
      iso(x0, HUT_FACE, HUT.h),
      iso(x1, HUT_FACE, HUT.h),
      iso(x1, HUT_FACE + 2, HUT.h - 1),
      iso(x0, HUT_FACE + 2, HUT.h - 1),
    );
  }

  // A snowy roof, a little wider than the walls.
  box(
    ctx,
    HUT.gx - 1,
    HUT.gy - 1,
    HUT.w + 2,
    HUT.d + 2,
    2,
    colors.snow,
    colors.snowShade,
    colors.slab,
    HUT.h,
  );
  // A chimney.
  box(ctx, 14, 4, 2.5, 2.5, 6, colors.snowShade, colors.cocoa, colors.night, HUT.h + 1);
  const mouth = iso(15.25, 5.25, HUT.h + 7);
  for (let n = 0; n < 3; n++) {
    const t = rise(time, n);
    ctx.fillStyle = colors.cloud;
    ctx.globalAlpha = 0.5 * (1 - t);
    ctx.beginPath();
    ctx.arc(
      mouth.x + t * 4 + Math.sin(t * 6 + n) * 0.8,
      mouth.y - t * 12,
      1 + t * 1.8,
      0,
      Math.PI * 2,
    );
    ctx.fill();
  }
  ctx.globalAlpha = 1;

  // Steam from the waffle iron, out of the hatch.
  for (let n = 0; n < 3; n++) {
    const t = rise(time, n + 1);
    ctx.fillStyle = colors.snowLit;
    ctx.globalAlpha = 0.45 * (1 - t);
    ctx.beginPath();
    ctx.arc(w.x - 1 + Math.sin(t * 7 + n) * 0.8, w.y - 2 - t * 6, 0.8 + t * 1.2, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;

  glow(ctx, iso(9.7, HUT_FACE, 5).x, iso(9.7, HUT_FACE, 5).y, 12, lit);
  // Lights along the roof's front edge.
  const edge = [4, 7.5, 11, 14.5, 18].map((gx) => iso(gx, HUT.gy + HUT.d + 1, HUT.h + 0.5));
  stringLights(ctx, edge, [colors.gold, colors.berry, colors.mint], time);
}
