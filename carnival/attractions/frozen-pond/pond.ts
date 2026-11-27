/**
 * Frozen Pond's still scene, in the square's 0 to 100 units: the pines and
 * the lamp round the back, the long oval of ice with a shine drifting over it,
 * and the curling sheet laid on it, with its hack, its lines and the house's
 * rings at the far end. Snow blown by the end's wind drifts across.
 */
import { box, glow, iso, pine } from '../../../src/northpole/diorama';
import { theme } from '../../../src/northpole/theme';
import { BACK, HOUSE, POND, SHEET, onScreen } from './sheet';

const { colors } = theme;

/** The pines round the back of the pond: where on the slab, and how tall. */
const PINES: readonly (readonly [number, number, number])[] = [
  [-21, -6, 14],
  [-20, -15, 19],
  [-13, -21, 15],
  [-5, -21, 13],
  [6, -21, 17],
];
/** The house's rings from the outside in, and the button. */
const RINGS = [colors.violet, colors.snowLit, colors.berry, colors.snowLit];

/** How much closer than the usual diorama the pond is seen, so the sheet reads well on a phone, and about where. */
export const ZOOM = { k: 1.14, x: 50, y: 64 };

/**
 * The slab of snow the pond lies in, seen a little closer than the usual
 * diorama (ZOOM, applied by the caller): lit sides, and its top warmest at the
 * back left where the light falls.
 */
export function slab(ctx: CanvasRenderingContext2D) {
  box(ctx, -22, -22, 44, 44, 6, colors.snow, colors.slab, colors.slabShade, -6);
  const top = ctx.createLinearGradient(6, 44, 72, 88);
  top.addColorStop(0, colors.snowLit);
  top.addColorStop(0.55, colors.snow);
  top.addColorStop(1, colors.snowShade);
  ctx.fillStyle = top;
  ctx.beginPath();
  for (const [gx, gy] of [
    [-22, -22],
    [22, -22],
    [22, 22],
    [-22, 22],
  ] as const) {
    const corner = iso(gx, gy);
    ctx.lineTo(corner.x, corner.y);
  }
  ctx.closePath();
  ctx.fill();
}

/** The pines, and the lamp on the snow by the hack, its warm pool spilling onto the ice. */
export function pinesAndLamp(ctx: CanvasRenderingContext2D) {
  for (const [gx, gy, h] of PINES) {
    const p = iso(gx, gy);
    pine(ctx, p.x, p.y, h);
  }
  const lamp = iso(-20, 0);
  glow(ctx, lamp.x + 3, lamp.y - 4, 16, 0.85);
  ctx.fillStyle = colors.ink;
  ctx.fillRect(lamp.x - 0.5, lamp.y - 16, 1, 16);
  ctx.fillStyle = colors.lantern;
  ctx.fillRect(lamp.x - 1.4, lamp.y - 19, 2.8, 3);
}

/** The ice sunk a little into the snow, with a shine that drifts slowly across it. */
export function ice(ctx: CanvasRenderingContext2D, time: number) {
  ctx.fillStyle = colors.slabShade;
  ctx.beginPath();
  ctx.ellipse(POND.x, POND.y, POND.across + 1.5, POND.down + 1, 0, 0, Math.PI * 2);
  ctx.fill();
  const shade = ctx.createLinearGradient(POND.x - 30, POND.y - 8, POND.x + 30, POND.y + 8);
  shade.addColorStop(0, colors.ice);
  shade.addColorStop(1, colors.mountainFar);
  ctx.fillStyle = shade;
  ctx.beginPath();
  ctx.ellipse(POND.x, POND.y + 0.6, POND.across, POND.down, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.save();
  ctx.clip();
  ctx.globalAlpha = 0.25;
  ctx.fillStyle = colors.snowLit;
  const shine = ((time / 70) % 140) - 20;
  ctx.beginPath();
  ctx.moveTo(shine, POND.y - 10);
  ctx.lineTo(shine + 6, POND.y - 10);
  ctx.lineTo(shine - 4, POND.y + 10);
  ctx.lineTo(shine - 10, POND.y + 10);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

/** A straight line across the sheet at `s`, from one side to the other. */
function across(ctx: CanvasRenderingContext2D, s: number) {
  const near = onScreen(s, SHEET.wide);
  const far = onScreen(s, -SHEET.wide);
  ctx.moveTo(far.x, far.y);
  ctx.lineTo(near.x, near.y);
}

/** The sheet: brighter ice between its side lines, the hack, the hog, tee and back lines, and the house. */
export function curlingSheet(ctx: CanvasRenderingContext2D) {
  const far = onScreen(0, -SHEET.wide);
  const near = onScreen(BACK + 2, SHEET.wide);
  ctx.save();
  ctx.beginPath();
  ctx.ellipse(POND.x, POND.y + 0.6, POND.across, POND.down, 0, 0, Math.PI * 2);
  ctx.clip();
  ctx.fillStyle = colors.snowLit;
  ctx.globalAlpha = 0.22;
  ctx.fillRect(far.x, far.y, near.x - far.x, near.y - far.y);
  ctx.globalAlpha = 0.7;
  ctx.strokeStyle = colors.snowLit;
  ctx.lineWidth = 0.35;
  ctx.beginPath();
  ctx.moveTo(far.x, far.y);
  ctx.lineTo(near.x, far.y);
  ctx.moveTo(far.x, near.y);
  ctx.lineTo(near.x, near.y);
  across(ctx, HOUSE.s - 17);
  across(ctx, BACK);
  ctx.stroke();
  ctx.restore();
  const button = onScreen(HOUSE.s, 0);
  [...HOUSE.rings].reverse().forEach((radius, n) => {
    ctx.fillStyle = RINGS.at(n) ?? colors.snowLit;
    ctx.globalAlpha = n === 0 ? 0.75 : 0.9;
    ctx.beginPath();
    ctx.ellipse(button.x, button.y, radius, radius / 2, 0, 0, Math.PI * 2);
    ctx.fill();
  });
  ctx.fillStyle = RINGS.at(3) ?? colors.snowLit;
  ctx.beginPath();
  ctx.ellipse(button.x, button.y, 1, 0.5, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = 0.5;
  ctx.strokeStyle = colors.ink;
  ctx.lineWidth = 0.25;
  ctx.beginPath();
  across(ctx, HOUSE.s);
  ctx.moveTo(button.x - 9, button.y);
  ctx.lineTo(button.x + 9, button.y);
  ctx.stroke();
  ctx.globalAlpha = 1;
  const hack = onScreen(0, 0);
  ctx.fillStyle = colors.ink;
  ctx.fillRect(hack.x - 1, hack.y - 1.4, 1.2, 0.9);
  ctx.fillRect(hack.x - 1, hack.y + 0.5, 1.2, 0.9);
}

/** A few flakes of snow blown across the pond by the wind, slowly: the way they drift shows the wind. */
export function blowingSnow(ctx: CanvasRenderingContext2D, wind: number, time: number) {
  ctx.fillStyle = colors.snowLit;
  for (let n = 0; n < 16; n++) {
    const s = (n * 37) % 72;
    const drift = ((time / 1000) * wind * 2.5 + n * 7.3) % 20;
    const w = ((drift + 20) % 20) - 10;
    const at = onScreen(s, w);
    ctx.globalAlpha = 0.5 * (1 - Math.abs(w) / 10);
    ctx.fillRect(at.x, at.y - 3, 0.8, 0.8);
  }
  ctx.globalAlpha = 1;
}
