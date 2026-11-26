/**
 * The cabin stall: log walls with round log ends at the front corners, and a
 * pitched roof whose ridge runs back from the front, a gable over the name
 * board and snow on its slopes. It has more parts than the other shapes, so it
 * keeps a file of its own beside `stall-shapes.ts`.
 */
import { block, quad } from './brushes';
import type { Face } from './faces';
import { stallFront } from './stall-front';
import { spotPoint, type StallParts } from './stall-plan';
import { theme } from './theme';
import type { Tile } from './world';

const { colors } = theme;

/** A point on the cabin's spot, `along` its front, `depth` back from it and `lift` up. */
type CabinPoint = (along: number, depth: number, lift: number) => Tile;

/** How far the roof hangs over the walls, front and back and either side, as a share of the spot. */
const OVER = 0.08;

/** The cabin stall: log walls, the front, and the pitched roof over them. */
export function drawCabinStall(ctx: CanvasRenderingContext2D, parts: StallParts) {
  const { spot, face, deep, wall, roof, look, square, paint, owner } = parts;
  block(ctx, spot, wall, colors.snowShade, colors.wood, colors.cocoa);
  // Logs along the walls, a round end on each at the front corners.
  const sides: [Tile, Tile][] = [
    [face.a, face.b],
    [face.b, spotPoint(face, deep, { along: 1, depth: 1 })],
  ];
  for (let k = 0; k < 8; k++) {
    const lift = (wall * (k + 0.5)) / 8;
    ctx.fillStyle = colors.cocoa;
    for (const [from, to] of sides) {
      quad(ctx, [
        { x: from.x, y: from.y - lift },
        { x: to.x, y: to.y - lift },
        { x: to.x, y: to.y - lift - 1.5 },
        { x: from.x, y: from.y - lift - 1.5 },
      ]);
      ctx.fill();
    }
    ctx.fillStyle = colors.gingerbread;
    for (const end of [face.a, face.b]) {
      ctx.beginPath();
      ctx.arc(end.x, end.y - lift, 3, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  stallFront(ctx, face, square, paint, owner);
  cabinRoof(ctx, face, deep, wall, roof, look.roof);
}

/**
 * The cabin's pitched roof: its ridge running back from the front, a gable
 * over the name board, and the slopes in `color` under a coat of snow.
 */
function cabinRoof(
  ctx: CanvasRenderingContext2D,
  face: Face,
  deep: number,
  wall: number,
  rise: number,
  color: string,
) {
  const at: CabinPoint = (along, depth, lift) => spotPoint(face, deep, { along, depth }, lift);
  // The far slope first, then the gable end in logs over it, then the near slope.
  const near = face.out.x > 0 ? 0 : 1;
  cabinSlope(ctx, at, near === 0 ? 1 : 0, wall, rise, color);
  ctx.fillStyle = colors.wood;
  quad(ctx, [at(0, 0, wall), at(1, 0, wall), at(0.5, 0, wall + rise)]);
  ctx.fill();
  ctx.fillStyle = colors.cocoa;
  for (let k = 1; k < 4; k++) {
    const lift = wall + (rise * k) / 4;
    const half = 0.5 * (1 - k / 4);
    quad(ctx, [
      at(0.5 - half, 0, lift),
      at(0.5 + half, 0, lift),
      at(0.5 + half, 0, lift + 1.5),
      at(0.5 - half, 0, lift + 1.5),
    ]);
    ctx.fill();
  }
  cabinSlope(ctx, at, near, wall, rise, color);
}

/** One slope, from the ridge down to the eave on side `side` of the front, with snow on its upper part. */
function cabinSlope(
  ctx: CanvasRenderingContext2D,
  at: CabinPoint,
  side: 0 | 1,
  wall: number,
  rise: number,
  color: string,
) {
  const eave = wall - 6;
  const edge = side ? 1 + OVER : -OVER;
  const down = (t: number) => ({
    along: 0.5 + (edge - 0.5) * t,
    lift: wall + rise + (eave - wall - rise) * t,
  });
  const strip = (from: number, to: number) => {
    const [p, q] = [down(from), down(to)];
    quad(ctx, [
      at(p.along, -OVER, p.lift),
      at(p.along, 1 + OVER, p.lift),
      at(q.along, 1 + OVER, q.lift),
      at(q.along, -OVER, q.lift),
    ]);
  };
  ctx.fillStyle = color;
  strip(0, 1);
  ctx.fill();
  ctx.fillStyle = colors.snow;
  strip(0, 0.45);
  ctx.fill();
  if (!side) return;
  // The slope facing right is in the dusk's shadow.
  ctx.fillStyle = colors.night;
  ctx.globalAlpha = 0.18;
  strip(0, 1);
  ctx.fill();
  ctx.globalAlpha = 1;
}
