/**
 * The Recording Studio stands as a flat-roofed studio building: its square's
 * drawing on a big screen across the front under its name, a red ON AIR sign
 * over it glowing steadily with a slow pulse, a satellite dish on the roof and
 * a lattice antenna whose light breathes softly, as a mast's light does at
 * night. Nothing on it blinks (docs/style.md); the pulses take seconds (ADR 0042).
 */
import { block, bulb, corners, glow } from './brushes';
import { band, faceText, onFace, type Face } from './faces';
import { framedArt, frontOf, stage, type LandmarkDrawer } from './landmark-parts';
import { area, litWindow, sideOf, onSpot } from './landmark-kit';
import { SIGN_STYLES } from './sign-styles';
import { standing } from './stall-plan';
import { canvasFont, theme } from './theme';
import type { Tile } from './world';

const { colors } = theme;

const STUDIO = { stage: 10, wall: 146, sign: [120, 140] as const, mast: 96 };

/** How warmly the ON AIR sign glows at `time`: always lit, swelling and easing over about ten seconds. */
const onAir = (time: number) => 0.8 + 0.2 * Math.sin(time / 1600);

/** The ON AIR sign standing out from the wall, red and lit, its glow on the wall round it. */
function onAirSign(ctx: CanvasRenderingContext2D, face: Face, time: number) {
  const [low, high] = STUDIO.sign;
  const strength = onAir(time);
  const middle = onFace(face, 0.5, (low + high) / 2, 0.1);
  glow(ctx, middle.x, middle.y, 44, strength);
  ctx.fillStyle = colors.night;
  band(ctx, face, 0.22, 0.78, low - 2, high + 2, 0.1);
  ctx.fill();
  ctx.fillStyle = colors.berry;
  ctx.globalAlpha = strength;
  band(ctx, face, 0.24, 0.76, low, high, 0.1);
  ctx.fill();
  ctx.globalAlpha = 1;
  const width = Math.abs(face.b.x - face.a.x) * 0.48;
  faceText(
    ctx,
    face,
    'ON AIR',
    0.5,
    (low + high) / 2,
    width,
    canvasFont('small', 'bold'),
    colors.cream,
    0.1,
  );
}

/** The satellite dish on its stand at `foot`, tipped up to the sky, with its gold feed. */
function dish(ctx: CanvasRenderingContext2D, foot: Tile) {
  ctx.fillStyle = colors.night;
  ctx.fillRect(foot.x - 2, foot.y - 18, 4, 18);
  const centre = { x: foot.x, y: foot.y - 26 };
  ctx.fillStyle = colors.snowShade;
  ctx.beginPath();
  ctx.ellipse(centre.x, centre.y, 22, 13, -0.6, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = colors.snow;
  ctx.beginPath();
  ctx.ellipse(centre.x - 2, centre.y - 1, 17, 9, -0.6, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = colors.night;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(centre.x, centre.y);
  ctx.lineTo(centre.x - 9, centre.y - 15);
  ctx.stroke();
  ctx.lineWidth = 1;
  ctx.fillStyle = colors.gold;
  ctx.beginPath();
  ctx.arc(centre.x - 9, centre.y - 15, 3, 0, Math.PI * 2);
  ctx.fill();
}

/** The lattice mast from `foot`, braced across, with its soft red light on top. Gives its tip. */
function mast(ctx: CanvasRenderingContext2D, foot: Tile, time: number): Tile {
  const tip = { x: foot.x, y: foot.y - STUDIO.mast };
  ctx.strokeStyle = colors.slabShade;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  for (const side of [-1, 1]) {
    ctx.moveTo(foot.x + side * 8, foot.y);
    ctx.lineTo(tip.x, tip.y);
  }
  for (let n = 1; n < 6; n++) {
    const y = foot.y - (STUDIO.mast * n) / 6;
    const half = 8 * (1 - n / 6);
    ctx.moveTo(foot.x - half, y);
    ctx.lineTo(foot.x + half, y - STUDIO.mast / 12);
  }
  ctx.stroke();
  ctx.lineWidth = 1;
  bulb(ctx, tip.x, tip.y, colors.berry, 0.65 + 0.35 * Math.sin(time / 1300));
  return tip;
}

export const drawStudio: LandmarkDrawer = (ctx, plot, square, paint, time) => {
  stage(ctx, plot, 82);
  const body = area(plot, [0.08, 0.92], [0.1, 0.88]);
  const roof = STUDIO.stage + STUDIO.wall;
  block(ctx, body, STUDIO.wall, colors.slab, colors.mountain, colors.surface, STUDIO.stage);
  const front = frontOf(plot, body);
  const side = sideOf(plot, body);
  // A dark band at the foot and the roof's edge, and two rows of narrow lit windows down the side.
  ctx.fillStyle = colors.night;
  for (const face of [front, side])
    for (const [low, high] of [
      [STUDIO.stage, STUDIO.stage + 8],
      [roof - 8, roof],
    ] as const) {
      band(ctx, face, 0, 1, low, high);
      ctx.fill();
    }
  for (const lift of [64, 112])
    for (const along of [0.15, 0.32, 0.5, 0.68, 0.85])
      litWindow(ctx, onFace(side, along, lift), 7, 20, time);
  framedArt(ctx, front, square, paint, { from: 0.08, to: 0.92, low: 20 }, SIGN_STYLES.shed);
  onAirSign(ctx, front, time);
  // On the roof: the dish towards the back on the lit side, the mast towards the back on the other.
  dish(ctx, onSpot(plot, 0.3, 0.62, roof));
  const tip = mast(ctx, onSpot(plot, 0.72, 0.72, roof), time);
  return standing(plot, corners(plot).top.y - tip.y + 16);
};
