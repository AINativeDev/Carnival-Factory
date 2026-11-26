/**
 * The vehicles on the road. The delivery van is seen from behind, with its
 * roof rack of parcels; the traffic is seen coming towards you, each with its
 * headlights lit. Every drawing is in units of `w`, the vehicle's width on the
 * square, so it scales with the distance.
 */
import { glow } from '../../../src/northpole/diorama';
import type { TrafficKind } from './game';
import { circle, colors, polygon, slab, type Ctx } from './brushes';

/** Two round headlights and the warm light they throw ahead. */
function headlights(ctx: Ctx, w: number, y: number, spread: number) {
  for (const side of [-1, 1]) {
    glow(ctx, side * spread * w, y, w * 0.35, 0.8);
    ctx.fillStyle = colors.glow;
    circle(ctx, side * spread * w, y, w * 0.06);
  }
}

/** A pair of dark wheels poking out below a body. */
function wheels(ctx: Ctx, w: number, y: number, spread: number) {
  ctx.fillStyle = colors.ink;
  for (const side of [-1, 1])
    slab(ctx, side * spread * w - w * 0.07, y, w * 0.14, w * 0.16, colors.ink);
}

/** The player's van, from behind at (`x`, `y`), leaning into a turn and sliding its tail out. */
export function drawDeliveryVan(
  ctx: Ctx,
  x: number,
  y: number,
  w: number,
  lean: number,
  slide: number,
) {
  ctx.save();
  ctx.translate(x + slide * w * 0.4, y);
  ctx.rotate(slide * 0.5);
  ctx.transform(1, 0, lean * 0.12, 1, 0, 0);
  ctx.fillStyle = colors.shadow;
  ctx.globalAlpha = 0.4;
  ctx.beginPath();
  ctx.ellipse(0, 0, w * 0.6, w * 0.1, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = 1;
  wheels(ctx, w, -w * 0.12, 0.38);
  slab(ctx, -w * 0.5, -w * 0.95, w, w * 0.85, colors.berry);
  slab(ctx, -w * 0.38, -w * 0.85, w * 0.76, w * 0.3, colors.night);
  ctx.globalAlpha = 0.35;
  slab(ctx, -w * 0.36, -w * 0.83, w * 0.3, w * 0.12, colors.horizon);
  ctx.globalAlpha = 1;
  for (const side of [-1, 1])
    slab(ctx, side * w * 0.38 - w * 0.06, -w * 0.4, w * 0.12, w * 0.07, colors.gold);
  ctx.fillStyle = colors.wood;
  ctx.fillRect(-w * 0.45, -w * 1.0, w * 0.9, w * 0.05);
  slab(ctx, -w * 0.4, -w * 1.3, w * 0.34, w * 0.3, colors.gold);
  slab(ctx, -w * 0.02, -w * 1.22, w * 0.26, w * 0.22, colors.mint);
  slab(ctx, -w * 0.18, -w * 1.5, w * 0.28, w * 0.22, colors.violet);
  ctx.fillStyle = colors.berry;
  ctx.fillRect(-w * 0.03, -w * 1.3, w * 0.06, w * 0.3);
  ctx.restore();
}

/** Oncoming horse-drawn sleigh: a red sleigh behind two small horses. */
function sleigh(ctx: Ctx, w: number) {
  wheels(ctx, w, -w * 0.1, 0.4);
  slab(ctx, -w * 0.45, -w * 0.6, w * 0.9, w * 0.5, colors.berry);
  slab(ctx, -w * 0.5, -w * 0.18, w, w * 0.08, colors.gold);
  for (const side of [-1, 1]) {
    slab(ctx, side * w * 0.22 - w * 0.12, -w * 0.95, w * 0.24, w * 0.5, colors.cocoa);
    slab(ctx, side * w * 0.22 - w * 0.07, -w * 1.1, w * 0.14, w * 0.2, colors.wood);
  }
}

/** Oncoming plough: a big orange cab with a broad blade throwing snow. */
function plough(ctx: Ctx, w: number) {
  wheels(ctx, w, -w * 0.12, 0.42);
  slab(ctx, -w * 0.45, -w * 0.95, w * 0.9, w * 0.8, colors.gingerbread);
  slab(ctx, -w * 0.35, -w * 0.85, w * 0.7, w * 0.3, colors.night);
  polygon(
    ctx,
    [
      [-w * 0.6, -w * 0.05],
      [w * 0.6, -w * 0.05],
      [w * 0.5, -w * 0.4],
      [-w * 0.5, -w * 0.4],
    ],
    colors.gold,
  );
  ctx.fillStyle = colors.snow;
  for (const side of [-1, 1]) circle(ctx, side * w * 0.65, -w * 0.3, w * 0.12);
  slab(ctx, -w * 0.12, -w * 1.1, w * 0.24, w * 0.15, colors.gold);
}

/** Another van, or the little bus when `tall`: a plain front with a windscreen. */
function boxy(ctx: Ctx, w: number, tall: boolean) {
  const body = tall ? w * 1.15 : w * 0.85;
  wheels(ctx, w, -w * 0.12, 0.38);
  slab(ctx, -w * 0.5, -body, w, body - w * 0.1, tall ? colors.mint : colors.violet);
  slab(ctx, -w * 0.4, -body + w * 0.1, w * 0.8, w * 0.35, colors.night);
  if (tall) slab(ctx, -w * 0.4, -body * 0.5, w * 0.8, w * 0.2, colors.cream);
}

/** A piece of oncoming traffic, its front to the camera, headlights lit. */
export function drawTraffic(ctx: Ctx, kind: TrafficKind, x: number, y: number, w: number) {
  ctx.save();
  ctx.translate(x, y);
  ctx.fillStyle = colors.shadow;
  ctx.globalAlpha = 0.4;
  ctx.beginPath();
  ctx.ellipse(0, 0, w * 0.6, w * 0.1, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = 1;
  if (kind === 'sleigh') sleigh(ctx, w);
  else if (kind === 'plough') plough(ctx, w);
  else boxy(ctx, w, kind === 'bus');
  headlights(ctx, w, -w * 0.25, 0.35);
  ctx.restore();
}

/** A glowing parcel on the road with its ribbon, bobbing a little. */
export function drawParcel(ctx: Ctx, x: number, y: number, w: number, bob: number) {
  glow(ctx, x, y - w * 0.5, w * 0.9);
  slab(ctx, x - w / 2, y - w * (1 + bob), w, w * 0.8, colors.gold);
  ctx.fillStyle = colors.berry;
  ctx.fillRect(x - w * 0.07, y - w * (1 + bob), w * 0.14, w * 0.8);
}
