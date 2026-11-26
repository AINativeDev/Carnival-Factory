/**
 * The Academy stands as a red schoolhouse: white trim, rows of lit windows
 * down its side, a slate roof with its gable to the door, and a bell tower on
 * the ridge whose bell swings slowly, as if calling the class in. Its square's
 * drawing hangs over the door like the school's crest, under its name
 * (ADR 0042).
 */
import { block, corners, quad } from './brushes';
import { band, onFace, type Face } from './faces';
import { framedArt, frontOf, stage, type LandmarkDrawer } from './landmark-parts';
import { area, gabledRoof, litWindow, pennant, sideOf, onSpot } from './landmark-kit';
import { SIGN_STYLES } from './sign-styles';
import { standing } from './stall-plan';
import { peakedRoof } from './stall-volumes';
import { theme } from './theme';
import type { Tile } from './world';

const { colors } = theme;

const SCHOOL = { stage: 10, wall: 118, rise: 62, belfry: 46, cap: 30, swing: 2200 };

/** White corner boards and a band under the eaves on a wall. */
function trim(ctx: CanvasRenderingContext2D, face: Face, high: number) {
  ctx.fillStyle = colors.cream;
  for (const [from, to] of [
    [0, 0.04],
    [0.96, 1],
  ] as const) {
    band(ctx, face, from, to, SCHOOL.stage, high);
    ctx.fill();
  }
  band(ctx, face, 0, 1, high - 6, high);
  ctx.fill();
}

/** The bell, hanging from `pin` and swinging slowly to and fro. */
function bell(ctx: CanvasRenderingContext2D, pin: Tile, time: number) {
  ctx.save();
  ctx.translate(pin.x, pin.y);
  ctx.rotate(Math.sin(time / SCHOOL.swing) * 0.35);
  ctx.fillStyle = colors.gold;
  quad(ctx, [
    { x: -4, y: 2 },
    { x: 4, y: 2 },
    { x: 9, y: 17 },
    { x: -9, y: 17 },
  ]);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(0, 4, 4.5, Math.PI, 0);
  ctx.fill();
  ctx.fillStyle = colors.cocoa;
  ctx.beginPath();
  ctx.arc(0, 18, 2.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

export const drawSchoolhouse: LandmarkDrawer = (ctx, plot, square, paint, time) => {
  stage(ctx, plot, 82);
  const body = area(plot, [0.1, 0.9], [0.06, 0.9]);
  const eaves = SCHOOL.stage + SCHOOL.wall;
  block(ctx, body, SCHOOL.wall, colors.berry, colors.berry, colors.berry, SCHOOL.stage);
  const front = frontOf(plot, body);
  const side = sideOf(plot, body);
  // The right of the house is in the dusk's shade, whichever face it is.
  const c = corners(body);
  ctx.fillStyle = colors.night;
  ctx.globalAlpha = 0.3;
  quad(ctx, [
    c.bottom,
    c.right,
    { x: c.right.x, y: c.right.y - eaves },
    { x: c.bottom.x, y: c.bottom.y - eaves },
  ]);
  ctx.fill();
  ctx.globalAlpha = 1;
  trim(ctx, front, eaves);
  trim(ctx, side, eaves);
  // Two rows of tall lit windows down the side.
  for (const lift of [48, 96])
    for (const along of [0.16, 0.38, 0.62, 0.84]) {
      const at = onFace(side, along, lift);
      ctx.fillStyle = colors.cream;
      ctx.fillRect(at.x - 7, at.y - 12, 14, 24);
      litWindow(ctx, at, 9, 18, time);
    }
  // The door with its lit fanlight, and the steps up to it.
  ctx.fillStyle = colors.cream;
  band(ctx, front, 0.38, 0.62, SCHOOL.stage, 58, 0.02);
  ctx.fill();
  ctx.fillStyle = colors.cocoa;
  band(ctx, front, 0.42, 0.58, SCHOOL.stage, 46, 0.02);
  ctx.fill();
  ctx.fillStyle = colors.glow;
  band(ctx, front, 0.42, 0.58, 48, 55, 0.02);
  ctx.fill();
  gabledRoof(ctx, plot, [0.04, 0.96], [0.0, 0.94], { eaves, rise: SCHOOL.rise, end: colors.berry });
  framedArt(ctx, front, square, paint, { from: 0.17, to: 0.83, low: 64 }, SIGN_STYLES.pavilion);
  // The bell tower astride the ridge near the front: an open belfry under a pointed cap.
  const tower = area(plot, [0.4, 0.6], [0.16, 0.32]);
  const foot = eaves + SCHOOL.rise - 22;
  block(ctx, tower, SCHOOL.belfry, colors.cream, colors.cream, colors.snowShade, foot);
  const belfry = frontOf(plot, tower);
  ctx.fillStyle = colors.night;
  band(ctx, belfry, 0.18, 0.82, foot + 10, foot + SCHOOL.belfry - 8);
  ctx.fill();
  bell(ctx, onFace(belfry, 0.5, foot + SCHOOL.belfry - 10), time);
  const top = foot + SCHOOL.belfry;
  const cap = area(plot, [0.37, 0.63], [0.13, 0.35]);
  const capCorners = corners(cap);
  peakedRoof(
    ctx,
    [capCorners.top, capCorners.right, capCorners.bottom, capCorners.left],
    top,
    SCHOOL.cap,
    [colors.surface, colors.night],
  );
  const peak = onSpot(plot, 0.5, 0.24, top + SCHOOL.cap);
  pennant(ctx, peak, 18, colors.gold, time);
  return standing(plot, corners(plot).top.y - peak.y + 30);
};
