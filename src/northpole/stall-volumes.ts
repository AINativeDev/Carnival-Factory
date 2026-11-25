/**
 * The solid parts of a stall that isn't a plain block: upright walls round any
 * ground outline, and a pointed roof over one. The shed, the tent and the kiosk
 * build from these, each in its own outline from the stall's plan.
 */
import { quad } from './brushes';
import { inTurn, sidesOf } from './rounds';
import { theme } from './theme';
import type { Tile } from './world';

const { colors } = theme;

/** A side's colour: one for every side, or one for side `n` of the outline. */
type SideColor = string | ((n: number) => string);

/**
 * Upright walls round a ground outline, `height` high from `lift`: the sides
 * we see, lit on the left and shaded on the right, then the top. With `dim`,
 * the shaded sides are their own colour under the dusk's shadow.
 */
export function prism(
  ctx: CanvasRenderingContext2D,
  ground: Tile[],
  height: number,
  top: string | undefined,
  lit: SideColor,
  shaded: SideColor,
  lift = 0,
  dim = false,
) {
  const colorOf = (color: SideColor, n: number) => (typeof color === 'string' ? color : color(n));
  const centre = {
    x: ground.reduce((sum, p) => sum + p.x, 0) / ground.length,
    y: ground.reduce((sum, p) => sum + p.y, 0) / ground.length,
  };
  for (const { p, q, n } of sidesOf(ground)) {
    // The side's outward normal on screen: one facing down the screen faces us.
    let normal = { x: q.y - p.y, y: p.x - q.x };
    const mid = { x: (p.x + q.x) / 2 - centre.x, y: (p.y + q.y) / 2 - centre.y };
    if (normal.x * mid.x + normal.y * mid.y < 0) normal = { x: -normal.x, y: -normal.y };
    if (normal.y <= 0) continue;
    const isLit = normal.x < 0;
    ctx.fillStyle = colorOf(isLit ? lit : shaded, n);
    quad(ctx, [
      { x: p.x, y: p.y - lift },
      { x: q.x, y: q.y - lift },
      { x: q.x, y: q.y - lift - height },
      { x: p.x, y: p.y - lift - height },
    ]);
    ctx.fill();
    if (dim && !isLit) {
      ctx.fillStyle = colors.night;
      ctx.globalAlpha = 0.22;
      ctx.fill();
      ctx.globalAlpha = 1;
    }
  }
  if (!top) return;
  ctx.fillStyle = top;
  quad(
    ctx,
    ground.map((p) => ({ x: p.x, y: p.y - lift - height })),
  );
  ctx.fill();
}

/** A pointed roof over a ground outline, from `height` up to a peak `rise` higher, its slopes in `pair` by turns. */
export function peakedRoof(
  ctx: CanvasRenderingContext2D,
  ground: Tile[],
  height: number,
  rise: number,
  pair: readonly [string, ...string[]],
) {
  const centre = {
    x: ground.reduce((sum, p) => sum + p.x, 0) / ground.length,
    y: ground.reduce((sum, p) => sum + p.y, 0) / ground.length,
  };
  const peak = { x: centre.x, y: centre.y - height - rise };
  const slopes = sidesOf(ground);
  // Back to front, so the slopes facing us cover the ones behind.
  slopes.sort((a, b) => a.p.y + a.q.y - (b.p.y + b.q.y));
  for (const { p, q, n } of slopes) {
    ctx.fillStyle = inTurn(pair, n);
    quad(ctx, [peak, { x: p.x, y: p.y - height }, { x: q.x, y: q.y - height }]);
    ctx.fill();
    if ((p.x + q.x) / 2 > centre.x) {
      ctx.fillStyle = colors.night;
      ctx.globalAlpha = 0.2;
      ctx.fill();
      ctx.globalAlpha = 1;
    }
  }
}
