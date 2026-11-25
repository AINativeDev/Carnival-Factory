/**
 * The pagoda stall: cream walls between red corner pillars, then two tiers
 * of hipped roofs in the stall's roof colour whose eaves sweep up at the
 * corners, edged in its trim (gold unless the square names another), a small
 * upper storey between them, a gold spire on top, and paper lanterns swaying
 * gently from the lower eaves.
 */
import { glow } from './brushes';
import { band } from './faces';
import { sidesOf } from './rounds';
import { stallFront } from './stall-front';
import { plotPoint, type StallParts } from './stall-plan';
import { prism } from './stall-volumes';
import { theme } from './theme';
import type { Tile } from './world';

const { colors } = theme;

/** One tier of roof: how far its eaves reach and how far in its top, as scales of the plot, and its lifts. */
interface Tier {
  eaves: number;
  top: number;
  low: number;
  high: number;
}

/** How far each tier's corners sweep up over the middle of its eaves. */
const SWEEP = 9;

/** The pagoda: the walls and front, the lower roof, the upper storey and roof, the spire, then lanterns. */
export function drawPagoda(ctx: CanvasRenderingContext2D, parts: StallParts) {
  const { face, deep, ground, wall, roof, look, square, paint, owner, time } = parts;
  const centre = plotPoint(face, deep, { along: 0.5, depth: 0.5 });
  prism(ctx, ground, wall, undefined, colors.cream, colors.snowShade, 0, true);
  ctx.fillStyle = colors.berry;
  for (const [from, to] of [
    [0, 0.05],
    [0.95, 1],
  ] as const) {
    band(ctx, face, from, to, 0, wall);
    ctx.fill();
  }
  stallFront(ctx, face, square, paint, owner);
  const lower: Tier = { eaves: 1.26, top: 0.62, low: wall + 10, high: wall + roof * 0.32 };
  tier(ctx, ground, centre, lower, look.roof, look.trim);
  const upper = scaled(ground, centre, 0.62);
  prism(ctx, upper, roof * 0.26, undefined, colors.cream, colors.snowShade, lower.high, true);
  const top = lower.high + roof * 0.26;
  tier(
    ctx,
    ground,
    centre,
    { eaves: 1.0, top: 0.22, low: top, high: top + roof * 0.3 },
    look.roof,
    look.trim,
  );
  spire(ctx, { x: centre.x, y: centre.y - top - roof * 0.3 }, roof * 0.12 + 10);
  lanterns(ctx, scaled(ground, centre, lower.eaves), centre, lower.low + SWEEP, time);
}

/** An outline drawn in towards `centre`, or out from it, by `scale`. */
function scaled(points: Tile[], centre: Tile, scale: number): Tile[] {
  return points.map((p) => ({
    x: centre.x + (p.x - centre.x) * scale,
    y: centre.y + (p.y - centre.y) * scale,
  }));
}

/**
 * One hipped roof: each slope from the top of the tier down to eaves that
 * sag in the middle and sweep up at the corners, farthest first, edged in
 * `trim` and dimmed on the side turned from the light.
 */
function tier(
  ctx: CanvasRenderingContext2D,
  ground: Tile[],
  centre: Tile,
  { eaves, top, low, high }: Tier,
  color: string,
  trim: string,
) {
  // A ground corner drawn out (or in) from the middle by `scale`, `lift` up.
  const at = (p: Tile, scale: number, lift: number) => ({
    x: centre.x + (p.x - centre.x) * scale,
    y: centre.y + (p.y - centre.y) * scale - lift,
  });
  const slopes = sidesOf(ground)
    .map(({ p, q }) => ({
      edge: { p: at(p, eaves * 1.04, low + SWEEP), q: at(q, eaves * 1.04, low + SWEEP) },
      top: { p: at(p, top, high), q: at(q, top, high) },
    }))
    .sort((a, b) => a.edge.p.y + a.edge.q.y - (b.edge.p.y + b.edge.q.y));
  const centreLow = { x: centre.x, y: centre.y - low };
  for (const { edge, top: ridge } of slopes) {
    const middle = { x: (edge.p.x + edge.q.x) / 2, y: (edge.p.y + edge.q.y) / 2 + SWEEP * 1.6 };
    // The sag pulls the eaves' middle a little in towards the tier, so the corners sweep out and up.
    const sag = { x: middle.x + (centreLow.x - middle.x) * 0.08, y: middle.y };
    ctx.beginPath();
    ctx.moveTo(ridge.p.x, ridge.p.y);
    ctx.lineTo(ridge.q.x, ridge.q.y);
    ctx.lineTo(edge.q.x, edge.q.y);
    ctx.quadraticCurveTo(sag.x, sag.y, edge.p.x, edge.p.y);
    ctx.closePath();
    ctx.fillStyle = color;
    ctx.fill();
    if (edge.p.x + edge.q.x > centre.x * 2) {
      ctx.fillStyle = colors.night;
      ctx.globalAlpha = 0.2;
      ctx.fill();
      ctx.globalAlpha = 1;
    }
    // The trim's own line width, put back after so nothing drawn later inherits it.
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(edge.q.x, edge.q.y);
    ctx.quadraticCurveTo(sag.x, sag.y, edge.p.x, edge.p.y);
    ctx.strokeStyle = trim;
    ctx.lineWidth = 2.5;
    ctx.stroke();
    ctx.restore();
  }
}

/** The gold spire on the top roof: a mast with rings round it and a ball at its tip. */
function spire(ctx: CanvasRenderingContext2D, foot: Tile, height: number) {
  ctx.fillStyle = colors.gold;
  ctx.fillRect(foot.x - 1, foot.y - height, 2, height);
  for (let k = 1; k < 4; k++) {
    ctx.beginPath();
    ctx.ellipse(foot.x, foot.y - (height * k) / 4, 4 - k * 0.6, 1.6, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.beginPath();
  ctx.arc(foot.x, foot.y - height - 2, 2.5, 0, Math.PI * 2);
  ctx.fill();
}

/** Red paper lanterns hanging from the lower eaves' front corners, swaying slowly, each with its glow. */
function lanterns(
  ctx: CanvasRenderingContext2D,
  corners: Tile[],
  centre: Tile,
  lift: number,
  time: number,
) {
  corners
    .filter((corner) => corner.y >= centre.y - 1)
    .forEach((corner, n) => {
      const sway = Math.sin(time / 1500 + n) * 1.5;
      const hook = { x: corner.x, y: corner.y - lift };
      const lamp = { x: hook.x + sway, y: hook.y + 12 };
      ctx.fillStyle = colors.ink;
      ctx.fillRect(hook.x - 0.5, hook.y, 1, 8);
      glow(ctx, lamp.x, lamp.y, 12, 0.8);
      ctx.fillStyle = colors.berry;
      ctx.beginPath();
      ctx.ellipse(lamp.x, lamp.y, 4, 5, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = colors.gold;
      ctx.fillRect(lamp.x - 2.5, lamp.y - 6, 5, 1.5);
      ctx.fillRect(lamp.x - 2.5, lamp.y + 4.5, 5, 1.5);
    });
}
