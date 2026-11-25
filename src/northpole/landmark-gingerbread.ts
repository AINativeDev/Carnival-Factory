/**
 * The Gingerbread Fun House stands as a gingerbread house that's not quite
 * straight: a chocolate roof whose ridge leans and whose front sags, a crooked
 * chimney, icing dripping from its eaves and piped down its corners, and
 * gumdrops along its ridge and its foot. A fun house should look a little
 * wrong. Its square's drawing is its big front window, under a gold board
 * (ADR 0042).
 */
import { block, corners } from './brushes';
import { onFace, type Face } from './faces';
import { framedArt, frontOf, stage, type LandmarkDrawer } from './landmark-parts';
import { area, gabledRoof, litWindow, sideOf, spot, type Span } from './landmark-kit';
import { inTurn } from './rounds';
import { SIGN_STYLES } from './sign-styles';
import { standing } from './stall-plan';
import { theme } from './theme';
import type { Tile } from './world';

const { colors } = theme;

const HOUSE = { stage: 10, wall: 106, rise: 74, lean: 0.1, sag: 22 };
const ALONG: Span = [0.12, 0.88];
const DEEP: Span = [0.12, 0.86];
const GUMDROPS = [colors.berry, colors.mint, colors.violet, colors.gold] as const;

/** One gumdrop: a dome with a glint of light on its left. */
function gumdrop(ctx: CanvasRenderingContext2D, at: Tile, r: number, color: string) {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(at.x, at.y, r, Math.PI, 0);
  ctx.fill();
  ctx.fillStyle = colors.snowLit;
  ctx.globalAlpha = 0.6;
  ctx.fillRect(at.x - r * 0.55, at.y - r * 0.7, r * 0.35, r * 0.35);
  ctx.globalAlpha = 1;
}

/** Icing on a wall: drips hanging from its top edge, piping down its corners, gumdrops along its foot. */
function icing(ctx: CanvasRenderingContext2D, face: Face, low: number, high: number, seed: number) {
  ctx.fillStyle = colors.snow;
  for (let n = 0; n < 10; n++) {
    const at = onFace(face, (n + 0.5) / 10, high);
    const drip = 5 + ((n * 7 + seed) % 4) * 2.5;
    ctx.beginPath();
    ctx.arc(at.x, at.y + drip - 3, 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillRect(at.x - 3, at.y, 6, drip - 3);
  }
  for (const along of [0.01, 0.99]) {
    const foot = onFace(face, along, low);
    ctx.fillRect(foot.x - 2, foot.y - (high - low), 4, high - low);
  }
  for (let n = 0; n < 6; n++)
    gumdrop(ctx, onFace(face, (n + 0.5) / 6, low, 0.06), 4, inTurn(GUMDROPS, n + seed));
}

export const drawGingerbreadHouse: LandmarkDrawer = (ctx, plot, square, paint, time) => {
  stage(ctx, plot, 80);
  const body = area(plot, ALONG, DEEP);
  const eaves = HOUSE.stage + HOUSE.wall;
  block(ctx, body, HOUSE.wall, colors.gingerbread, colors.gingerbread, colors.wood, HOUSE.stage);
  const front = frontOf(plot, body);
  const side = sideOf(plot, body);
  // Round lit windows down the side, iced round, one a little higher than the other.
  for (const [along, lift] of [
    [0.3, 62],
    [0.7, 70],
  ] as const) {
    const at = onFace(side, along, lift);
    litWindow(ctx, at, 14, 18, time);
    ctx.strokeStyle = colors.snow;
    ctx.lineWidth = 2.5;
    ctx.strokeRect(at.x - 9, at.y - 11, 18, 22);
    ctx.lineWidth = 1;
  }
  icing(ctx, side, HOUSE.stage, eaves, 1);
  icing(ctx, front, HOUSE.stage, eaves, 0);
  framedArt(ctx, front, square, paint, { from: 0.14, to: 0.86, low: 22 }, SIGN_STYLES.kiosk);
  gabledRoof(ctx, plot, [0.06, 0.94], [0.06, 0.92], {
    eaves,
    rise: HOUSE.rise,
    end: colors.gingerbread,
    slopes: [colors.wood, colors.cocoa],
    lean: HOUSE.lean,
    sag: HOUSE.sag,
  });
  // A crooked chimney on the slope we see, leaning the other way to the roof.
  const slope = frontOf(plot).out.x < 0 ? 0.7 : 0.3;
  const stack = spot(plot, slope, 0.7, eaves + HOUSE.rise * 0.5);
  ctx.save();
  ctx.translate(stack.x, stack.y);
  ctx.rotate(0.18);
  // Striped like a candy cane, capped with icing.
  for (let n = 0; n < 5; n++) {
    ctx.fillStyle = inTurn([colors.berry, colors.cream], n);
    ctx.fillRect(-7, -12 * (n + 1), 14, 12);
  }
  ctx.fillStyle = colors.snow;
  ctx.fillRect(-9, -64, 18, 6);
  ctx.restore();
  // Icing piped along the gable's edges.
  const peak = spot(plot, 0.5 + HOUSE.lean, 0.06, eaves + HOUSE.rise - HOUSE.sag);
  ctx.strokeStyle = colors.snow;
  ctx.lineWidth = 4;
  ctx.beginPath();
  for (const p of [spot(plot, 0.06, 0.06, eaves), peak, spot(plot, 0.94, 0.06, eaves)])
    ctx.lineTo(p.x, p.y);
  ctx.stroke();
  ctx.lineWidth = 1;
  // A round attic window in the gable, and gumdrops along the crooked ridge.
  litWindow(ctx, spot(plot, 0.5 + HOUSE.lean * 0.4, 0.06, eaves + 26), 12, 12, time);
  for (let n = 0; n <= 6; n++) {
    const t = n / 6;
    const at = spot(
      plot,
      0.5 + HOUSE.lean * (1 - 2 * t),
      0.06 + 0.86 * t,
      eaves + HOUSE.rise - HOUSE.sag * (1 - t),
    );
    gumdrop(ctx, { x: at.x, y: at.y + 2 }, 5, inTurn(GUMDROPS, n));
  }
  const ridge = spot(plot, 0.5, 0.92, eaves + HOUSE.rise);
  return standing(plot, corners(plot).top.y - Math.min(ridge.y, stack.y - 64) + 20);
};
