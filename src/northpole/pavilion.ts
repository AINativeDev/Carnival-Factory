/**
 * The North Pole's own attractions stand as pavilions: a stage, cream walls
 * with gold posts, the square's drawing on the front under its name board, and
 * a candy-striped roof with lights along its eaves. Only attractions are drawn
 * this way, unless one asks for a stall or a tower instead.
 */
import { block, bulb, corners, middle, quad, shadow, twinkle } from './brushes';
import { band, faceOf, onFace, paintOnFace, type PaintSquare } from './faces';
import { faceSign } from './name-board';
import { inTurn } from './rounds';
import type { NorthPoleSquare } from './square';
import { PAVILION, standing } from './stall-plan';
import { theme } from './theme';
import type { Box, Plot, Tile } from './world';

const { colors } = theme;

/** A striped roof's two colours. */
type RoofPair = readonly [string, string];

/** The roofs' stripes, a pair for each pavilion in turn round the town square. */
const ROOFS: readonly [RoofPair, ...RoofPair[]] = [
  [colors.berry, colors.snow],
  [colors.pine, colors.cream],
  [colors.violet, colors.cream],
  [colors.gingerbread, colors.snow],
];

/** One of the North Pole's attractions: a pavilion on a stage, its square on the front and a striped roof. */
export function drawAttraction(
  ctx: CanvasRenderingContext2D,
  plot: Plot,
  square: NorthPoleSquare,
  paint: PaintSquare,
  time: number,
): Box {
  const { x, y } = middle(plot);
  shadow(ctx, x, y + 8, 80);
  block(ctx, plot, PAVILION.stage, colors.snowShade, colors.surface, colors.night);
  const inner = { x: plot.x + 0.2, y: plot.y + 0.2, w: plot.w - 0.4, h: plot.h - 0.4 };
  const face = faceOf({ ...inner, door: plot.door });
  const width = Math.abs(face.b.x - face.a.x);
  block(ctx, inner, PAVILION.wall, colors.cream, colors.surface, colors.night);
  // Gold posts at the corners of the front.
  ctx.fillStyle = colors.gold;
  for (const along of [0, 1]) {
    const foot = onFace(face, along, 0);
    ctx.fillRect(foot.x - 3, foot.y - PAVILION.wall, 6, PAVILION.wall);
  }
  const art = width * 0.84;
  ctx.fillStyle = colors.gold;
  band(ctx, face, 0.05, 0.95, PAVILION.art - 4, PAVILION.art + art + 4);
  ctx.fill();
  paintOnFace(paint, square, face, 0.08, 0.92, PAVILION.art);
  faceSign(ctx, face, PAVILION.art + art + 8, PAVILION.wall - 4, square.name, '');
  const eaves = { x: inner.x - 0.25, y: inner.y - 0.25, w: inner.w + 0.5, h: inner.h + 0.5 };
  stripedRoof(ctx, eaves, PAVILION.wall, PAVILION.roof, inTurn(ROOFS, plot.number), time);
  return standing(plot, PAVILION.wall + PAVILION.roof + 20);
}

/** A pyramid roof in candy stripes over a box, from `height` up to its peak `rise` higher. */
function stripedRoof(
  ctx: CanvasRenderingContext2D,
  box: Box,
  height: number,
  rise: number,
  pair: RoofPair,
  time: number,
) {
  const c = corners(box);
  const { x, y } = middle(box);
  const peak = { x, y: y - height - rise };
  const lift = (p: Tile) => ({ x: p.x, y: p.y - height });
  const eaves = [
    [c.left, c.bottom],
    [c.bottom, c.right],
  ] as const;
  const stripes = 6;
  for (const [n, [from, to]] of eaves.entries()) {
    for (let k = 0; k < stripes; k++) {
      const p = (t: number) =>
        lift({ x: from.x + (to.x - from.x) * t, y: from.y + (to.y - from.y) * t });
      ctx.fillStyle = inTurn(pair, k);
      quad(ctx, [peak, p(k / stripes), p((k + 1) / stripes)]);
      ctx.fill();
    }
    if (n) {
      ctx.fillStyle = colors.night;
      ctx.globalAlpha = 0.18;
      quad(ctx, [peak, lift(from), lift(to)]);
      ctx.fill();
      ctx.globalAlpha = 1;
    }
  }
  // Lights along the eaves, and a pennant on top.
  for (const [from, to] of eaves)
    for (let k = 0; k <= 8; k++) {
      const at = lift({
        x: from.x + ((to.x - from.x) * k) / 8,
        y: from.y + ((to.y - from.y) * k) / 8,
      });
      bulb(ctx, at.x, at.y + 2, colors.lantern, twinkle(time, at.x + at.y));
    }
  ctx.fillStyle = colors.cocoa;
  ctx.fillRect(peak.x - 1, peak.y - 18, 2, 18);
  ctx.fillStyle = colors.gold;
  quad(ctx, [
    { x: peak.x + 1, y: peak.y - 18 },
    { x: peak.x + 14, y: peak.y - 14 + Math.sin(time / 400) * 2 },
    { x: peak.x + 1, y: peak.y - 10 },
  ]);
  ctx.fill();
}
