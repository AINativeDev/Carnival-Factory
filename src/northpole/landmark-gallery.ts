/**
 * The Year in Review stands as a small gallery: a cream museum with four
 * columns across its front under a pediment, '26 → '27 on the frieze, warm
 * lit windows down its side and a gold dome with a pennant on the roof. Its
 * square's drawing hangs between the middle columns, under its name, like the
 * poster for the show inside (ADR 0042, ADR 0047).
 */
import { block, corners, quad } from './brushes';
import { band, faceText, onFace } from './faces';
import { framedArt, frontOf, stage, type LandmarkDrawer } from './landmark-parts';
import { area, litWindow, pennant, sideOf, onSpot } from './landmark-kit';
import { SIGN_STYLES } from './sign-styles';
import { standing } from './stall-plan';
import { signFont, theme } from './theme';

const { colors } = theme;

const GALLERY = { stage: 10, wall: 104, frieze: 14, gable: 30, dome: 18 };

/** Where the columns stand across the front, as fractions of it. */
const COLUMNS = [0.07, 0.24, 0.76, 0.93];

export const drawGallery: LandmarkDrawer = (ctx, plot, square, paint, time) => {
  stage(ctx, plot, 82);
  const body = area(plot, [0.08, 0.92], [0.12, 0.9]);
  const eaves = GALLERY.stage + GALLERY.wall;
  block(ctx, body, GALLERY.wall, colors.snowShade, colors.cream, colors.cream, GALLERY.stage);
  const front = frontOf(plot, body);
  const side = sideOf(plot, body);
  // The side away from the light, in the dusk's shade.
  const c = corners(body);
  ctx.fillStyle = colors.night;
  ctx.globalAlpha = 0.25;
  quad(ctx, [
    c.bottom,
    c.right,
    { x: c.right.x, y: c.right.y - eaves },
    { x: c.bottom.x, y: c.bottom.y - eaves },
  ]);
  ctx.fill();
  ctx.globalAlpha = 1;
  for (const along of [0.2, 0.5, 0.8]) litWindow(ctx, onFace(side, along, 62), 10, 34, time);
  // The steps up to the door, and the door, lit from inside.
  ctx.fillStyle = colors.snow;
  band(ctx, front, 0.02, 0.98, GALLERY.stage, GALLERY.stage + 6, 0.2);
  ctx.fill();
  ctx.fillStyle = colors.glow;
  band(ctx, front, 0.42, 0.58, GALLERY.stage, 24);
  ctx.fill();
  framedArt(ctx, front, square, paint, { from: 0.3, to: 0.7, low: 28 }, SIGN_STYLES.pavilion);
  // The columns, standing out from the wall, each with a gold capital.
  for (const along of COLUMNS) {
    ctx.fillStyle = colors.snow;
    band(ctx, front, along - 0.035, along + 0.035, GALLERY.stage + 6, eaves, 0.15);
    ctx.fill();
    ctx.fillStyle = colors.gold;
    band(ctx, front, along - 0.05, along + 0.05, eaves - 5, eaves, 0.15);
    ctx.fill();
  }
  // The frieze across the columns, with the year turning on it.
  const frieze = eaves + GALLERY.frieze;
  ctx.fillStyle = colors.cream;
  band(ctx, front, 0, 1, eaves, frieze, 0.15);
  ctx.fill();
  const width = Math.abs(front.b.x - front.a.x) * 0.6;
  faceText(
    ctx,
    front,
    "'26 → '27",
    0.5,
    eaves + 7,
    width,
    signFont('serif', 12),
    colors.berry,
    0.15,
  );
  // The pediment over it.
  const left = onFace(front, 0, frieze, 0.15);
  const right = onFace(front, 1, frieze, 0.15);
  const peak = onFace(front, 0.5, frieze + GALLERY.gable, 0.15);
  ctx.fillStyle = colors.cream;
  quad(ctx, [left, right, peak]);
  ctx.fill();
  ctx.fillStyle = colors.snowShade;
  quad(ctx, [
    onFace(front, 0.15, frieze + 4, 0.15),
    onFace(front, 0.85, frieze + 4, 0.15),
    onFace(front, 0.5, frieze + GALLERY.gable - 8, 0.15),
  ]);
  ctx.fill();
  // The gold dome on the roof, and its pennant.
  const dome = onSpot(plot, 0.5, 0.6, eaves);
  ctx.fillStyle = colors.gold;
  ctx.beginPath();
  ctx.ellipse(dome.x, dome.y, 22, GALLERY.dome, 0, Math.PI, 0);
  ctx.fill();
  ctx.fillStyle = colors.lantern;
  ctx.beginPath();
  ctx.ellipse(dome.x - 7, dome.y - 8, 5, 8, 0, 0, Math.PI * 2);
  ctx.fill();
  const top = { x: dome.x, y: dome.y - GALLERY.dome };
  pennant(ctx, top, 20, colors.berry, time);
  return standing(plot, corners(plot).top.y - Math.min(top.y - 20, peak.y) + 16);
};
