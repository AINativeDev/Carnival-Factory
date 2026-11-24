import { box, glow, iso, pine, scene, shadow, stringLights } from '../../northpole/diorama';
import type { Point } from '../../northpole/diorama';
import type { NorthPoleSquare } from '../../northpole/square';
import { theme } from '../../northpole/theme';

const { colors } = theme;

type Ctx = CanvasRenderingContext2D;

/** How long a puff of steam takes to rise and fade, in milliseconds. */
export const PUFF = 3_200;

/** How far through its rise steam puff `n` is at `time`: 0 at the iron, 1 gone. */
export function rise(time: number, n: number): number {
  const t = (time / PUFF + n / 3) % 1;
  return t < 0 ? t + 1 : t;
}

/** Where the slow gleam on the frozen falls is, 0 to 1 from the top down, repeating every 6 seconds. */
export function gleam(time: number): number {
  const t = (time / 6_000) % 1;
  return t < 0 ? t + 1 : t;
}

function quad(ctx: Ctx, a: Point, b: Point, c: Point, d: Point) {
  ctx.beginPath();
  ctx.moveTo(a.x, a.y);
  ctx.lineTo(b.x, b.y);
  ctx.lineTo(c.x, c.y);
  ctx.lineTo(d.x, d.y);
  ctx.closePath();
  ctx.fill();
}

// The cliff's lit face is the one at gy = CLIFF.gy + CLIFF.d.
const CLIFF = { gx: -19, gy: -19, w: 22, d: 10, h: 34 };
const FACE = CLIFF.gy + CLIFF.d;

function cliff(ctx: Ctx, time: number) {
  shadow(ctx, iso(-6, -6).x + 4, iso(-6, -6).y + 6, 40);
  box(
    ctx,
    CLIFF.gx,
    CLIFF.gy,
    CLIFF.w,
    CLIFF.d,
    CLIFF.h,
    colors.snow,
    colors.mountain,
    colors.dusk,
  );
  // Rock ledges on the lit face.
  ctx.fillStyle = colors.mountainFar;
  ctx.globalAlpha = 0.5;
  for (const [x0, x1, z] of [
    [-18, -14, 24],
    [-3, 1, 20],
    [-17, -13, 9],
    [-2, 1, 8],
  ]) {
    quad(ctx, iso(x0, FACE, z + 1.5), iso(x1, FACE, z + 1.5), iso(x1, FACE, z), iso(x0, FACE, z));
  }
  ctx.globalAlpha = 1;

  // The frozen falls: a sheet of ice from the lip to the pool, a little wider at the foot.
  const top = CLIFF.h - 1;
  ctx.fillStyle = colors.ice;
  quad(ctx, iso(-14, FACE, top), iso(-4, FACE, top), iso(-2.5, FACE, 0), iso(-15.5, FACE, 0));
  // Frozen ribbons of water, lit on the left.
  ctx.fillStyle = colors.snowLit;
  ctx.globalAlpha = 0.55;
  for (const [a, b] of [
    [-13, -11.5],
    [-9.5, -8.5],
    [-6.5, -5.5],
  ]) {
    quad(ctx, iso(a, FACE, top), iso(b, FACE, top), iso(b - 0.8, FACE, 2), iso(a - 0.8, FACE, 2));
  }
  ctx.fillStyle = colors.mountain;
  ctx.globalAlpha = 0.3;
  for (const [a, b] of [
    [-11, -10],
    [-8, -7.2],
  ]) {
    quad(
      ctx,
      iso(a, FACE, top - 3),
      iso(b, FACE, top - 3),
      iso(b - 0.6, FACE, 3),
      iso(a - 0.6, FACE, 3),
    );
  }
  ctx.globalAlpha = 1;

  // The gleam: a soft band of light slides slowly down the ice.
  const g = gleam(time);
  const z = top * (1 - g);
  ctx.save();
  ctx.beginPath();
  const p = [iso(-14, FACE, top), iso(-4, FACE, top), iso(-2.5, FACE, 0), iso(-15.5, FACE, 0)];
  p.forEach((q, n) => (n ? ctx.lineTo(q.x, q.y) : ctx.moveTo(q.x, q.y)));
  ctx.closePath();
  ctx.clip();
  ctx.fillStyle = colors.glow;
  ctx.globalAlpha = 0.4 * Math.sin(g * Math.PI);
  quad(
    ctx,
    iso(-16, FACE, z + 3),
    iso(-2, FACE, z + 3),
    iso(-2, FACE, z - 1),
    iso(-16, FACE, z - 1),
  );
  ctx.restore();
  ctx.globalAlpha = 1;

  // Icicles hanging from the lip.
  ctx.fillStyle = colors.snow;
  for (const gx of [-13.5, -11.5, -9, -6.5, -4.5]) {
    const a = iso(gx, FACE, top);
    const len = 3 + ((gx * 7) % 3);
    ctx.beginPath();
    ctx.moveTo(a.x - 0.7, a.y);
    ctx.lineTo(a.x + 0.7, a.y);
    ctx.lineTo(a.x, a.y + Math.abs(len));
    ctx.fill();
  }
}

/** A frozen pool at the foot of the falls. */
function pool(ctx: Ctx) {
  const c = iso(-9, -4);
  ctx.fillStyle = colors.ice;
  ctx.beginPath();
  ctx.ellipse(c.x, c.y, 15, 5.5, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = colors.snowLit;
  ctx.globalAlpha = 0.5;
  ctx.beginPath();
  ctx.ellipse(c.x - 3, c.y - 0.8, 8, 2.4, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = 1;
  // A few cracks.
  ctx.strokeStyle = colors.mountainFar;
  ctx.globalAlpha = 0.6;
  ctx.lineWidth = 0.25;
  ctx.beginPath();
  ctx.moveTo(c.x + 2, c.y - 1);
  ctx.lineTo(c.x + 6, c.y + 1);
  ctx.lineTo(c.x + 9, c.y);
  ctx.moveTo(c.x + 6, c.y + 1);
  ctx.lineTo(c.x + 7, c.y + 3);
  ctx.stroke();
  ctx.globalAlpha = 1;
}

// The hut stands at the front right: its lit face is at gy = HUT.gy + HUT.d.
const HUT = { gx: 5, gy: 3, w: 13, d: 10, h: 9 };
const HUT_FACE = HUT.gy + HUT.d;

function seller(ctx: Ctx) {
  const c = iso(9.5, HUT_FACE, 3.2);
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

function hut(ctx: Ctx, time: number) {
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
    iso(13, HUT_FACE, 2.5),
    iso(6.5, HUT_FACE, 2.5),
  );
  ctx.globalAlpha = 1;
  seller(ctx);
  // The counter, with a waffle on it.
  box(ctx, 6.5, HUT_FACE, 6.5, 2.5, 2.5, colors.snow, colors.wood, colors.cocoa);
  const w = iso(9, HUT_FACE + 1.2, 3.1);
  waffle(ctx, w.x, w.y);

  // The striped awning over the hatch.
  const colours = [colors.berry, colors.cream];
  for (let k = 0; k < 4; k++) {
    const x0 = 6 + k * 1.75;
    const x1 = x0 + 1.75;
    ctx.fillStyle = colours[k % 2];
    quad(
      ctx,
      iso(x0, HUT_FACE, 8),
      iso(x1, HUT_FACE, 8),
      iso(x1, HUT_FACE + 3, 6),
      iso(x0, HUT_FACE + 3, 6),
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

function draw(ctx: Ctx, size: number, time: number) {
  scene(ctx, size, time, (c, t) => {
    cliff(c, t);
    pool(c);
    for (const [gx, gy, h] of [
      [-19, 8, 16],
      [-13, 14, 12],
      [19, -10, 14],
    ]) {
      const p = iso(gx, gy);
      pine(c, p.x, p.y, h);
    }
    hut(c, t);
  });
}

const booth: NorthPoleSquare = {
  id: 'chandler767',
  name: 'Frozen Falls Waffles',
  description: 'A frozen waterfall, and a hut where someone sells hot Belgian waffles.',
  draw,
};

export default booth;
