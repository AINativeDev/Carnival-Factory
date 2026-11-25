import { box, iso, shadow } from '../../../src/northpole/diorama';
import { theme } from '../../../src/northpole/theme';
import { gleam } from './motion';
import { quad } from './quad';

const { colors } = theme;

type Ctx = CanvasRenderingContext2D;

// The cliff's lit face is the one at gy = CLIFF.gy + CLIFF.d.
const CLIFF = { gx: -19, gy: -19, w: 22, d: 10, h: 34 };
const FACE = CLIFF.gy + CLIFF.d;

// Rock ledges on the lit face, as [left, right, height]: typed as triples so strict indexing knows each is there.
const LEDGES: readonly (readonly [number, number, number])[] = [
  [-18, -14, 24],
  [-3, 1, 20],
  [-17, -13, 9],
  [-2, 1, 8],
];

// The frozen ribbons down the falls, as [left, right] at the lip, and the darker streaks between them.
const RIBBONS: readonly (readonly [number, number])[] = [
  [-13, -11.5],
  [-9.5, -8.5],
  [-6.5, -5.5],
];
const RIBBON_SHADOWS: readonly (readonly [number, number])[] = [
  [-11, -10],
  [-8, -7.2],
];

/** The rock cliff at the back with the frozen falls down its lit face, the gleam sliding down the ice and icicles on the lip. */
export function cliff(ctx: Ctx, time: number) {
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
  for (const [x0, x1, z] of LEDGES) {
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
  for (const [a, b] of RIBBONS) {
    quad(ctx, iso(a, FACE, top), iso(b, FACE, top), iso(b - 0.8, FACE, 2), iso(a - 0.8, FACE, 2));
  }
  ctx.fillStyle = colors.mountain;
  ctx.globalAlpha = 0.3;
  for (const [a, b] of RIBBON_SHADOWS) {
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
  const lipLeft = iso(-14, FACE, top);
  ctx.moveTo(lipLeft.x, lipLeft.y);
  for (const corner of [iso(-4, FACE, top), iso(-2.5, FACE, 0), iso(-15.5, FACE, 0)]) {
    ctx.lineTo(corner.x, corner.y);
  }
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

/** A frozen pool at the foot of the falls, with a few cracks in its ice. */
export function pool(ctx: Ctx) {
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
