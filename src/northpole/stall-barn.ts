/**
 * The barn stall: red board walls with white corner trim, a gambrel roof in
 * the stall's roof colour whose ridge runs back from the front, snow on its
 * slopes, a hay loft door in the gable over the name board, and big X-braced
 * doors on the side we see.
 */
import { quad } from './brushes';
import { band } from './faces';
import { stallFront } from './stall-front';
import { plotPoint, type StallParts } from './stall-plan';
import { prism } from './stall-volumes';
import { theme } from './theme';
import type { Tile } from './world';

const { colors } = theme;

/** A point on the barn's plot, `along` its front, `depth` back from it and `lift` up. */
type BarnPoint = (along: number, depth: number, lift: number) => Tile;

/** How far the roof hangs past the walls, and where the gambrel's knee is, from the ridge. */
const OVER = 0.07;
const KNEE = { along: 0.32, rise: 0.62 };

/** The barn: walls and trim, its side doors, the front, then the roof and its gable. */
export function drawBarn(ctx: CanvasRenderingContext2D, parts: StallParts) {
  const { face, deep, ground, wall, roof, look, square, paint, owner } = parts;
  const at: BarnPoint = (along, depth, lift) => plotPoint(face, deep, { along, depth }, lift);
  prism(ctx, ground, wall, undefined, colors.berry, colors.berry, 0, true);
  ctx.fillStyle = colors.night;
  ctx.globalAlpha = 0.18;
  for (let k = 1; k < 12; k++) {
    band(ctx, face, k / 12, k / 12 + 0.008, 0, wall);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
  ctx.fillStyle = look.trim;
  for (const [from, to] of [
    [0, 0.035],
    [0.965, 1],
  ] as const) {
    band(ctx, face, from, to, 0, wall);
    ctx.fill();
  }
  const side = face.out.x < 0 ? 1 : 0;
  const far = side ? 0 : 1;
  sideDoors(ctx, at, side, look.trim);
  stallFront(ctx, face, square, paint, owner);
  // The far slope first, then the gable over it, then the near slope.
  slope(ctx, at, far, wall, roof, look.roof);
  gable(ctx, at, wall, roof, look.trim);
  slope(ctx, at, side, wall, roof, look.roof);
}

/** A corner of the gambrel's outline: how far `along` the front it is, and how high. */
interface Corner {
  along: number;
  lift: number;
}

/** The gambrel's outline across the front: its eaves, its knees and its ridge, `over` past the walls. */
function profile(wall: number, rise: number, over: number) {
  const knee = wall + rise * KNEE.rise;
  const drop = ((knee - wall) * over) / (0.5 - KNEE.along);
  const ridge: Corner = { along: 0.5, lift: wall + rise };
  return {
    left: [{ along: -over, lift: wall - drop }, { along: 0.5 - KNEE.along, lift: knee }, ridge],
    right: [{ along: 1 + over, lift: wall - drop }, { along: 0.5 + KNEE.along, lift: knee }, ridge],
  } satisfies Record<string, [Corner, Corner, Corner]>;
}

/** The gable over the front: red boards, white trim along its edges, and the hay loft door. */
function gable(
  ctx: CanvasRenderingContext2D,
  at: BarnPoint,
  wall: number,
  rise: number,
  trim: string,
) {
  ctx.fillStyle = colors.berry;
  const { left, right } = profile(wall, rise, 0);
  quad(
    ctx,
    [...left, ...right.slice(0, 2).reverse()].map((p) => at(p.along, 0, p.lift)),
  );
  ctx.fill();
  const [sill, head] = [wall + 6, wall + rise * 0.62];
  const door = (from: number, to: number, low: number, high: number) => {
    quad(ctx, [at(from, 0, low), at(to, 0, low), at(to, 0, high), at(from, 0, high)]);
  };
  ctx.fillStyle = trim;
  door(0.37, 0.63, sill, head);
  ctx.fill();
  ctx.fillStyle = colors.cocoa;
  door(0.4, 0.6, sill + 3, head - 3);
  ctx.fill();
  // Hay spilling over the loft's sill.
  ctx.fillStyle = colors.gold;
  quad(ctx, [
    at(0.4, 0, sill + 3),
    at(0.6, 0, sill + 3),
    at(0.55, 0, sill + 10),
    at(0.47, 0, sill + 12),
  ]);
  ctx.fill();
}

/** One side of the roof, from the ridge down over the knee to the eave on side `side`, with snow on it. */
function slope(
  ctx: CanvasRenderingContext2D,
  at: BarnPoint,
  side: 0 | 1,
  wall: number,
  rise: number,
  color: string,
) {
  const outline = profile(wall, rise, OVER);
  const [eave, knee, ridge] = side ? outline.right : outline.left;
  const strip = (p: Corner, q: Corner) => {
    quad(ctx, [
      at(p.along, -OVER, p.lift),
      at(p.along, 1 + OVER, p.lift),
      at(q.along, 1 + OVER, q.lift),
      at(q.along, -OVER, q.lift),
    ]);
  };
  for (const [p, q] of [
    [eave, knee],
    [knee, ridge],
  ] as const) {
    ctx.fillStyle = color;
    strip(p, q);
    ctx.fill();
  }
  ctx.fillStyle = colors.snow;
  strip(knee, ridge);
  ctx.fill();
  ctx.fillStyle = colors.night;
  ctx.globalAlpha = side ? 0.2 : 0.06;
  strip(eave, ridge);
  ctx.fill();
  ctx.globalAlpha = 1;
}

/** Big double doors on the side we see, framed in trim and braced with an X on each leaf. */
function sideDoors(ctx: CanvasRenderingContext2D, at: BarnPoint, side: number, trim: string) {
  const high = 62;
  const leaf = (from: number, to: number, low: number, top: number) => {
    quad(ctx, [at(side, from, low), at(side, to, low), at(side, to, top), at(side, from, top)]);
  };
  ctx.fillStyle = trim;
  leaf(0.24, 0.76, 0, high + 4);
  ctx.fill();
  ctx.fillStyle = colors.berry;
  for (const [from, to] of [
    [0.27, 0.495],
    [0.505, 0.73],
  ] as const) {
    leaf(from, to, 0, high);
    ctx.fill();
    ctx.fillStyle = trim;
    for (const [a, b] of [
      [from, to],
      [to, from],
    ] as const) {
      quad(ctx, [
        at(side, a, 0),
        at(side, a + 0.03 * Math.sign(b - a), 0),
        at(side, b, high),
        at(side, b - 0.03 * Math.sign(b - a), high),
      ]);
      ctx.fill();
    }
    ctx.fillStyle = colors.berry;
  }
  // The right side is in the dusk's shadow.
  if (!side) return;
  ctx.fillStyle = colors.night;
  ctx.globalAlpha = 0.22;
  leaf(0.24, 0.76, 0, high + 4);
  ctx.fill();
  ctx.globalAlpha = 1;
}
