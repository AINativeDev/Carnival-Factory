/**
 * The chalet stall: an alpine chalet on a stone footing, plank walls, and a
 * steep roof whose ridge runs along the front, its eaves hanging far out and
 * its slope deep in snow. The gable is on the side we see, with a lit window
 * and a balcony whose carved rail runs under it.
 */
import { glow, quad } from './brushes';
import { band } from './faces';
import { stallFront } from './stall-front';
import { plotPoint, type StallParts } from './stall-plan';
import { prism } from './stall-volumes';
import { theme } from './theme';
import type { Tile } from './world';

const { colors } = theme;

/** A point on the chalet's plot, `along` its front, `depth` back from it and `lift` up. */
type ChaletPoint = (along: number, depth: number, lift: number) => Tile;

/** How far the eaves hang past the gables and out over the front and back, as shares of the plot. */
const SIDE = 0.24;
const FRONT = 0.22;
/** How tall the stone footing is, and how high over the walls the eaves stand, clear of the name board. */
const FOOTING = 16;
const EAVE = 8;
/** How far the balcony stands out from the gable, and how high its floor is. */
const BALCONY = 0.16;
const FLOOR = 10;

/** The chalet: footing and plank walls, the front, the gable we see with its balcony, then the roof. */
export function drawChalet(ctx: CanvasRenderingContext2D, parts: StallParts) {
  const { face, deep, ground, wall, roof, look, square, paint, owner } = parts;
  const at: ChaletPoint = (along, depth, lift) => plotPoint(face, deep, { along, depth }, lift);
  prism(ctx, ground, FOOTING, undefined, colors.slab, colors.slabShade);
  prism(ctx, ground, wall - FOOTING, undefined, colors.wood, colors.cocoa, FOOTING);
  ctx.fillStyle = colors.cocoa;
  for (let k = 1; k < 7; k++) {
    const lift = FOOTING + ((wall - FOOTING) * k) / 7;
    band(ctx, face, 0, 1, lift, lift + 1);
    ctx.fill();
  }
  stallFront(ctx, face, square, paint, owner);
  // The gable we see: on the right with the door facing left, on the left with it facing right.
  const right = face.out.x < 0;
  const end = right ? 1 : 0;
  const outward = right ? 1 : -1;
  slope(ctx, at, 1 + FRONT, wall, roof, look.roof, true);
  gable(ctx, at, end, outward, wall, roof, look.trim);
  slope(ctx, at, -FRONT, wall, roof, look.roof, !right);
  // A carved bargeboard along the gable's eaves.
  ctx.fillStyle = look.trim;
  const tip = end + outward * SIDE;
  for (const depth of [-FRONT, 1 + FRONT]) {
    quad(ctx, [
      at(tip, depth, wall + EAVE),
      at(tip, 0.5, wall + roof),
      at(tip, 0.5, wall + roof - 5),
      at(tip, depth, wall + EAVE - 5),
    ]);
    ctx.fill();
  }
}

/** A flat piece of the chalet, from `low` to `high` up, between two points of its plot. */
function upright(
  ctx: CanvasRenderingContext2D,
  at: ChaletPoint,
  from: [number, number],
  to: [number, number],
  low: number,
  high: number,
) {
  quad(ctx, [at(...from, low), at(...to, low), at(...to, high), at(...from, high)]);
  ctx.fill();
}

/** The gable at `end` of the front: boards, a lit window, and the balcony standing out before it. */
function gable(
  ctx: CanvasRenderingContext2D,
  at: ChaletPoint,
  end: number,
  outward: number,
  wall: number,
  rise: number,
  trim: string,
) {
  ctx.fillStyle = colors.wood;
  quad(ctx, [at(end, 0, wall), at(end, 1, wall), at(end, 0.5, wall + rise)]);
  ctx.fill();
  ctx.fillStyle = colors.cocoa;
  for (const depth of [0.2, 0.32, 0.68, 0.8]) {
    const top = wall + rise * (1 - Math.abs(depth - 0.5) * 2);
    upright(ctx, at, [end, depth], [end, depth + 0.012], wall, top);
  }
  const [sill, head] = [wall + FLOOR + 8, wall + rise * 0.62];
  const window = at(end, 0.5, (sill + head) / 2);
  glow(ctx, window.x, window.y, 20, 0.8);
  ctx.fillStyle = colors.lantern;
  upright(ctx, at, [end, 0.4], [end, 0.6], sill, head);
  // The balcony: its floor out from the gable, its front edge, balusters and the rail along their tops.
  const rail = end + outward * BALCONY;
  const floor = wall + FLOOR;
  ctx.fillStyle = colors.cocoa;
  quad(ctx, [
    at(end, 0.08, floor),
    at(end, 0.92, floor),
    at(rail, 0.92, floor),
    at(rail, 0.08, floor),
  ]);
  ctx.fill();
  ctx.fillStyle = colors.wood;
  upright(ctx, at, [rail, 0.08], [rail, 0.92], floor - 4, floor);
  ctx.fillStyle = trim;
  for (let n = 0; n <= 10; n++) {
    const depth = 0.1 + (0.8 * n) / 10;
    upright(ctx, at, [rail, depth - 0.012], [rail, depth + 0.012], floor, floor + 14);
  }
  upright(ctx, at, [rail, 0.08], [rail, 0.92], floor + 13, floor + 17);
}

/**
 * One slope, from the ridge down to its eave at `depth` (out over the front,
 * or past the back), deep in snow but for its edge, dimmed when it turns from
 * the light.
 */
function slope(
  ctx: CanvasRenderingContext2D,
  at: ChaletPoint,
  depth: number,
  wall: number,
  rise: number,
  color: string,
  dim: boolean,
) {
  const down = (t: number) => ({
    depth: 0.5 + (depth - 0.5) * t,
    lift: wall + rise + (EAVE - rise) * t,
  });
  const strip = (from: number, to: number) => {
    const [p, q] = [down(from), down(to)];
    quad(ctx, [
      at(-SIDE, p.depth, p.lift),
      at(1 + SIDE, p.depth, p.lift),
      at(1 + SIDE, q.depth, q.lift),
      at(-SIDE, q.depth, q.lift),
    ]);
  };
  ctx.fillStyle = color;
  strip(0, 1);
  ctx.fill();
  ctx.fillStyle = colors.snow;
  strip(0, 0.5);
  ctx.fill();
  if (!dim) return;
  ctx.fillStyle = colors.night;
  ctx.globalAlpha = 0.18;
  strip(0, 1);
  ctx.fill();
  ctx.globalAlpha = 1;
}
