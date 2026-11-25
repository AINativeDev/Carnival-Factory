/**
 * The food truck stall: a little truck with its body in the stall's roof
 * colour, a cab with a windscreen at the end we see, round wheels and a trim
 * stripe. Its serving hatch is the drawing on its side, with a ledge under it
 * and a short striped awning over the name board.
 */
import { quad } from './brushes';
import { band, onFace } from './faces';
import { stallFront } from './stall-front';
import { plotPoint, type StallParts } from './stall-plan';
import { prism } from './stall-volumes';
import { theme } from './theme';
import type { Tile } from './world';

const { colors } = theme;

/** How high the body rides over the snow, how far back it runs, and how tall the cab is. */
const RIDE = 10;
const BODY = 0.78;
const CAB = 66;

/** The food truck: cab, body and raised roof, the hatch with its awning, then the wheels in front. */
export function drawFoodTruck(ctx: CanvasRenderingContext2D, parts: StallParts) {
  const { face, deep, wall, roof, look, square, paint, owner } = parts;
  const at = (along: number, depth: number, lift = 0) =>
    plotPoint(face, deep, { along, depth }, lift);
  const box = (from: number, to: number, near: number, far: number) => [
    at(from, near),
    at(to, near),
    at(to, far),
    at(from, far),
  ];
  // The cab on the end we see: the right with the door facing left, the left with it facing right.
  const right = face.out.x < 0;
  const [cabFrom, cabTo] = right ? [1, 1.22] : [-0.22, 0];
  const nose = right ? cabTo : cabFrom;
  prism(ctx, box(0, 1, 0, BODY), wall - RIDE, colors.snowShade, look.roof, look.roof, RIDE, true);
  prism(
    ctx,
    box(cabFrom, cabTo, 0.04, BODY - 0.04),
    CAB - RIDE,
    look.roof,
    look.roof,
    look.roof,
    RIDE,
    true,
  );
  // The windscreen on the cab's nose, and its side window.
  ctx.fillStyle = colors.ice;
  quad(ctx, [
    at(nose, 0.14, CAB - 22),
    at(nose, 0.64, CAB - 22),
    at(nose, 0.6, CAB - 4),
    at(nose, 0.18, CAB - 4),
  ]);
  ctx.fill();
  quad(ctx, [
    at(cabFrom + 0.04, 0.04, CAB - 22),
    at(cabTo - 0.04, 0.04, CAB - 22),
    at(cabTo - 0.06, 0.04, CAB - 4),
    at(cabFrom + 0.06, 0.04, CAB - 4),
  ]);
  ctx.fill();
  prism(
    ctx,
    box(0.05, 0.95, 0.08, BODY - 0.08),
    roof,
    colors.snow,
    colors.snowShade,
    colors.slab,
    wall,
  );
  ctx.fillStyle = look.trim;
  band(ctx, face, 0, 1, RIDE + 4, RIDE + 8);
  ctx.fill();
  stallFront(ctx, face, square, paint, owner);
  ctx.fillStyle = colors.wood;
  quad(ctx, [
    onFace(face, 0.06, 15),
    onFace(face, 0.94, 15),
    onFace(face, 0.94, 15, 0.16),
    onFace(face, 0.06, 15, 0.16),
  ]);
  ctx.fill();
  awning(ctx, parts);
  for (const along of [0.2, 0.8, (cabFrom + cabTo) / 2]) {
    wheel(ctx, at(along, -0.02, 9));
  }
}

/** A short striped awning over the hatch, sloping out from the roof's edge, with a scalloped hem. */
function awning(ctx: CanvasRenderingContext2D, parts: StallParts) {
  const { face, wall, look } = parts;
  const stripes = 8;
  const width = Math.abs(face.b.x - face.a.x);
  for (let n = 0; n < stripes; n++) {
    const [from, to] = [0.04 + (0.92 * n) / stripes, 0.04 + (0.92 * (n + 1)) / stripes];
    ctx.fillStyle = n % 2 ? look.trim : look.roof;
    quad(ctx, [
      onFace(face, from, wall),
      onFace(face, to, wall),
      onFace(face, to, wall - 3, 0.25),
      onFace(face, from, wall - 3, 0.25),
    ]);
    ctx.fill();
    const hem = onFace(face, (from + to) / 2, wall - 3, 0.25);
    ctx.beginPath();
    ctx.ellipse(hem.x, hem.y, (width * 0.92) / stripes / 2, 3, 0, 0, Math.PI);
    ctx.fill();
  }
}

/** A round wheel with its hubcap, standing at `centre`. */
function wheel(ctx: CanvasRenderingContext2D, centre: Tile) {
  ctx.fillStyle = colors.ink;
  ctx.beginPath();
  ctx.ellipse(centre.x, centre.y, 8, 9, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = colors.slab;
  ctx.beginPath();
  ctx.ellipse(centre.x, centre.y, 3.5, 4, 0, 0, Math.PI * 2);
  ctx.fill();
}
