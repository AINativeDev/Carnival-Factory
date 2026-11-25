/**
 * The decorations a booth's owner earns in the advent calendar
 * (docs/advent.md), hung on their stall whatever its shape: ornaments under
 * the name board, a string of lights along its top, and over the stall a
 * glowing "24 of 24" sign and a star. Each moves from `time`, slowly.
 */
import { MAX_ORNAMENTS, type AdventDecorations } from './advent';
import { bulb, glow, twinkle } from './brushes';
import { onFace, type Face } from './faces';
import { inTurn } from './rounds';
import { STALL, stallSignLow } from './stall-plan';
import { canvasFont, theme } from './theme';
import type { Tile } from './world';

const { colors } = theme;

/** The glowing sign over a booth whose owner did all 24 challenges. */
export const ADVENT_SIGN = { w: 76, h: 20 };

/** How much higher than the stall its advent decorations reach: the glowing sign, then the star over it. */
export function adventCrown(decorations: AdventDecorations): number {
  return (decorations.sign ? ADVENT_SIGN.h + 6 : 0) + (decorations.star ? 22 : 0);
}

/**
 * A booth's advent decorations: ornaments hanging under its name board, a
 * string of lights along the board's top, and over the stall, from `crown`
 * up at `middle`, its glowing sign and its star.
 */
export function drawAdventDecorations(
  ctx: CanvasRenderingContext2D,
  face: Face,
  middle: Tile,
  crown: number,
  decorations: AdventDecorations,
  time: number,
) {
  for (let n = 0; n < decorations.ornaments; n++) ornament(ctx, face, n, time);
  if (decorations.lights) boardLights(ctx, face, time);
  let lift = crown;
  if (decorations.sign) {
    adventSign(ctx, middle, lift, time);
    lift += ADVENT_SIGN.h + 6;
  }
  if (decorations.star) star(ctx, middle.x, middle.y - lift - 11);
}

const BAUBLES = [
  colors.berry,
  colors.gold,
  colors.ice,
  colors.violet,
  colors.mint,
  colors.snow,
] as const;

/** The `n`th ornament, swaying on its thread under the name board. */
function ornament(ctx: CanvasRenderingContext2D, face: Face, n: number, time: number) {
  const along = 0.14 + (0.72 * n) / Math.max(1, MAX_ORNAMENTS - 1);
  const hook = onFace(face, along, stallSignLow(face), 0.08);
  const sway = Math.sin(time / 900 + n * 1.3) * 1.5;
  const drop = 7 + (n % 2) * 3;
  ctx.strokeStyle = colors.cocoa;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(hook.x, hook.y);
  ctx.lineTo(hook.x + sway, hook.y + drop);
  ctx.stroke();
  ctx.fillStyle = inTurn(BAUBLES, n);
  ctx.beginPath();
  ctx.arc(hook.x + sway, hook.y + drop + 3, 3.2, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = colors.snowLit;
  ctx.beginPath();
  ctx.arc(hook.x + sway - 1, hook.y + drop + 2, 1, 0, Math.PI * 2);
  ctx.fill();
}

/** A string of twinkling lights along the top of the name board. */
function boardLights(ctx: CanvasRenderingContext2D, face: Face, time: number) {
  const bulbs = 11;
  const hue = [colors.berry, colors.gold, colors.aurora, colors.ice] as const;
  const at = (n: number) =>
    onFace(face, 0.04 + (0.92 * n) / (bulbs - 1), STALL.wall - 1 - (n % 2 ? 3 : 0), 0.1);
  ctx.strokeStyle = colors.pineDark;
  ctx.lineWidth = 1;
  ctx.beginPath();
  for (let n = 0; n < bulbs; n++) {
    const p = at(n);
    if (n) ctx.lineTo(p.x, p.y);
    else ctx.moveTo(p.x, p.y);
  }
  ctx.stroke();
  for (let n = 0; n < bulbs; n++) {
    const p = at(n);
    bulb(ctx, p.x, p.y + 2, inTurn(hue, n), twinkle(time, n));
  }
}

/** The glowing "24 of 24" sign on a post, `lift` over `middle`. */
function adventSign(ctx: CanvasRenderingContext2D, middle: Tile, lift: number, time: number) {
  const { w, h } = ADVENT_SIGN;
  const y = middle.y - lift - h;
  glow(ctx, middle.x, y + h / 2, w * 0.7, 0.8 + 0.2 * Math.sin(time / 1400));
  ctx.fillStyle = colors.cocoa;
  ctx.fillRect(middle.x - 1, y + h, 2, 6);
  ctx.fillRect(middle.x - w / 2 - 2, y - 2, w + 4, h + 4);
  ctx.fillStyle = colors.glow;
  ctx.fillRect(middle.x - w / 2, y, w, h);
  ctx.fillStyle = colors.ink;
  ctx.font = canvasFont('small', 'bold');
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('24 of 24', middle.x, y + h / 2 + 1, w - 6);
  ctx.textBaseline = 'alphabetic';
}

/** The gold star at the top, centred on (`cx`, `cy`). */
function star(ctx: CanvasRenderingContext2D, cx: number, cy: number) {
  glow(ctx, cx, cy, 16, 0.9);
  ctx.fillStyle = colors.gold;
  ctx.strokeStyle = colors.cocoa;
  ctx.lineWidth = 1;
  ctx.beginPath();
  for (let k = 0; k < 10; k++) {
    const r = k % 2 ? 4 : 10;
    const angle = -Math.PI / 2 + (k * Math.PI) / 5;
    const x = cx + Math.cos(angle) * r;
    const y = cy + Math.sin(angle) * r;
    if (k) ctx.lineTo(x, y);
    else ctx.moveTo(x, y);
  }
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
}
