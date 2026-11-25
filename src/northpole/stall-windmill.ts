/**
 * The windmill stall: a whitewashed eight-sided mill that tapers to a cap in
 * the stall's roof colour, and four lattice sails on the side we see,
 * turning slowly from the map's clock (one turn in 24 seconds). The drawing
 * stands on a board before the mill, as on the kiosk.
 */
import { quad } from './brushes';
import { band } from './faces';
import { sidesOf } from './rounds';
import { stallFront } from './stall-front';
import { plotPoint, STALL, type StallParts } from './stall-plan';
import { peakedRoof } from './stall-volumes';
import { theme } from './theme';
import type { Tile } from './world';

const { colors } = theme;

/** How long the sails take to turn once, in milliseconds: slow and calm. */
const TURN = 24_000;
/** How narrow the mill is at its top, as a share of its foot. */
const TAPER = 0.68;
/** How long a sail is, on screen, and how wide its lattice. */
const SAIL = 54;
const LATTICE = 11;
/** About how many screen pixels one plot's depth runs across. */
const DEPTH_PX = 72;

/** The windmill: its tapering body, its cap, the board with the drawing, then the sails. */
export function drawWindmill(ctx: CanvasRenderingContext2D, parts: StallParts) {
  const { face, deep, ground, wall, roof, look, square, paint, owner, time } = parts;
  const centre = plotPoint(face, deep, { along: 0.5, depth: 0.5 });
  // Each corner at the foot with the corner over it at the top, drawn in towards the middle.
  const corners = ground.map((foot) => ({
    foot,
    head: {
      x: centre.x + (foot.x - centre.x) * TAPER,
      y: centre.y + (foot.y - centre.y) * TAPER - wall,
    },
  }));
  for (const { p, q } of sidesOf(corners)) {
    // Only the sides that face down the screen show; the far ones are behind.
    if (p.foot.y + q.foot.y <= centre.y * 2) continue;
    ctx.fillStyle = p.foot.x + q.foot.x < centre.x * 2 ? colors.cream : colors.slab;
    quad(ctx, [p.foot, q.foot, q.head, p.head]);
    ctx.fill();
  }
  peakedRoof(ctx, shrunk(ground, centre, TAPER * 1.15), wall, roof, [look.roof]);
  ctx.fillStyle = colors.cocoa;
  band(ctx, face, 0.03, 0.97, 0, STALL.wall);
  ctx.fill();
  stallFront(ctx, face, square, paint, owner);
  sails(ctx, parts, (time / TURN) * Math.PI * 2);
}

/** An outline drawn in towards `centre` by `scale`. */
function shrunk(points: Tile[], centre: Tile, scale: number): Tile[] {
  return points.map((p) => ({
    x: centre.x + (p.x - centre.x) * scale,
    y: centre.y + (p.y - centre.y) * scale,
  }));
}

/**
 * Four sails on the side we see, turned by `turn`: each a spar with a lattice
 * of cream sailcloth along one edge, round a hub under the cap.
 */
function sails(ctx: CanvasRenderingContext2D, parts: StallParts, turn: number) {
  const { face, deep, wall } = parts;
  const side = face.out.x < 0 ? 0.92 : 0.08;
  const hub = wall + 18;
  // A point on the plane of the sails, `out` along a sail at `angle` and `across` it.
  const onSails = (angle: number, out: number, across: number) => {
    const depth = Math.cos(angle) * out - Math.sin(angle) * across;
    const lift = Math.sin(angle) * out + Math.cos(angle) * across;
    return plotPoint(face, deep, { along: side, depth: 0.66 + depth / DEPTH_PX }, hub + lift);
  };
  for (let k = 0; k < 4; k++) {
    const angle = turn + (k * Math.PI) / 2;
    ctx.fillStyle = colors.cream;
    ctx.globalAlpha = 0.85;
    quad(ctx, [
      onSails(angle, 12, 0),
      onSails(angle, SAIL, 0),
      onSails(angle, SAIL, LATTICE),
      onSails(angle, 12, LATTICE),
    ]);
    ctx.fill();
    ctx.globalAlpha = 1;
    ctx.fillStyle = colors.wood;
    for (let n = 0; n <= 4; n++) {
      const out = 12 + ((SAIL - 12) * n) / 4;
      quad(ctx, [
        onSails(angle, out, 0),
        onSails(angle, out + 1.2, 0),
        onSails(angle, out + 1.2, LATTICE),
        onSails(angle, out, LATTICE),
      ]);
      ctx.fill();
    }
    quad(ctx, [
      onSails(angle, 12, LATTICE - 1),
      onSails(angle, SAIL, LATTICE - 1),
      onSails(angle, SAIL, LATTICE),
      onSails(angle, 12, LATTICE),
    ]);
    ctx.fill();
    ctx.fillStyle = colors.cocoa;
    quad(ctx, [
      onSails(angle, 0, -1.5),
      onSails(angle, SAIL + 2, -1.5),
      onSails(angle, SAIL + 2, 1.5),
      onSails(angle, 0, 1.5),
    ]);
    ctx.fill();
  }
  const centre = onSails(0, 0, 0);
  ctx.fillStyle = colors.gold;
  ctx.beginPath();
  ctx.arc(centre.x, centre.y, 4, 0, Math.PI * 2);
  ctx.fill();
}
