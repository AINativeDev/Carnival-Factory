/**
 * The Gift Shop stands as a two-storey shop in pine green: a big display
 * window on the ground floor, a striped awning over its name board, lit
 * windows upstairs and presents stacked by the door. Its square's drawing is
 * the window display, so what's for sale is what the attraction shows
 * (ADR 0042).
 */
import { block, corners } from './brushes';
import { band, onFace, type Face } from './faces';
import { framedArt, frontOf, stage, type LandmarkDrawer } from './landmark-parts';
import { area, fillShape, litWindow, present, sideOf, onSpot } from './landmark-kit';
import { inTurn } from './rounds';
import { SIGN_STYLES } from './sign-styles';
import { standing } from './stall-plan';
import { theme } from './theme';

const { colors } = theme;

const SHOP = { stage: 10, wall: 184, awning: 144, drop: 16, reach: 0.38 };
/** The presents' wrapping and ribbons, by turns. */
const WRAPS: readonly [readonly [string, string], ...(readonly [string, string])[]] = [
  [colors.berry, colors.gold],
  [colors.violet, colors.snow],
  [colors.mint, colors.berry],
  [colors.gold, colors.pine],
];

/** The striped awning, from the wall out over the window, its stripes running out from the wall. */
function awning(ctx: CanvasRenderingContext2D, face: Face) {
  const stripes = 10;
  for (let n = 0; n < stripes; n++) {
    const [from, to] = [0.03 + (0.94 * n) / stripes, 0.03 + (0.94 * (n + 1)) / stripes];
    fillShape(
      ctx,
      [
        onFace(face, from, SHOP.awning),
        onFace(face, to, SHOP.awning),
        onFace(face, to, SHOP.awning - SHOP.drop, SHOP.reach),
        onFace(face, from, SHOP.awning - SHOP.drop, SHOP.reach),
      ],
      inTurn([colors.berry, colors.snow], n),
    );
    // Its scalloped edge.
    const lip = onFace(face, (from + to) / 2, SHOP.awning - SHOP.drop, SHOP.reach);
    ctx.beginPath();
    ctx.arc(lip.x, lip.y, 4, 0, Math.PI);
    ctx.fill();
  }
}

/** A row of lit windows across a face at `lift`. */
function windows(
  ctx: CanvasRenderingContext2D,
  face: Face,
  lift: number,
  across: number[],
  time: number,
) {
  for (const along of across) litWindow(ctx, onFace(face, along, lift), 10, 18, time);
}

export const drawShopfront: LandmarkDrawer = (ctx, plot, square, paint, time) => {
  stage(ctx, plot, 80);
  const body = area(plot, [0.1, 0.9], [0.16, 0.9]);
  block(ctx, body, SHOP.wall, colors.slab, colors.pine, colors.pineDark, SHOP.stage);
  const front = frontOf(plot, body);
  const side = sideOf(plot, body);
  // The cornice in cream round the top of the flat roof.
  ctx.fillStyle = colors.cream;
  for (const face of [front, side]) {
    band(ctx, face, 0, 1, SHOP.wall + SHOP.stage - 12, SHOP.wall + SHOP.stage - 4);
    ctx.fill();
  }
  windows(ctx, side, 60, [0.25, 0.5, 0.75], time);
  windows(ctx, side, 166, [0.25, 0.5, 0.75], time);
  windows(ctx, front, 166, [0.25, 0.5, 0.75], time);
  // The display window in a wooden frame, its name board over it, and the awning over both.
  ctx.fillStyle = colors.wood;
  band(ctx, front, 0.03, 0.97, SHOP.stage, SHOP.awning);
  ctx.fill();
  framedArt(ctx, front, square, paint, { from: 0.07, to: 0.93, low: 16 }, SIGN_STYLES.pavilion);
  awning(ctx, front);
  // Presents stacked by each front corner, two below and one on top.
  for (const [n, along] of [0.06, 0.94].entries()) {
    const stack = [
      { at: onSpot(plot, along - 0.05, 0.06, SHOP.stage), s: 16 },
      { at: onSpot(plot, along + 0.05, 0.04, SHOP.stage), s: 14 },
      { at: onSpot(plot, along, 0.05, SHOP.stage + 13), s: 11 },
    ];
    for (const [k, { at, s }] of stack.entries()) {
      const [wrap, ribbon] = inTurn(WRAPS, n * 3 + k);
      present(ctx, at, s, wrap, ribbon);
    }
  }
  return standing(plot, corners(plot).top.y - (corners(body).top.y - SHOP.wall - SHOP.stage) + 10);
};
