/**
 * The Factory's lettering and little shapes it shares between its parts: words
 * at a height in the drawing's units, a sparkle burst, and a wrapped gift.
 */
import { canvasFont, theme } from '../../../src/northpole/theme';

const { colors } = theme;

/**
 * `text` drawn `height` units tall at `x`, `y` (its middle), in the theme's
 * bold title face, squeezed to `maxWidth` units if it would run wider, `spacing`
 * units between letters. Returns how wide it came out, for an underline.
 */
export function words(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  height: number,
  color: string,
  align: CanvasTextAlign = 'center',
  maxWidth = 100,
  spacing = 0,
): number {
  ctx.save();
  ctx.font = canvasFont('title', 'bold');
  const k = height / theme.font.title;
  ctx.translate(x, y);
  ctx.scale(k, k);
  // Letter-spacing is in the scaled font's pixels; a browser without it just draws the letters closer.
  if (spacing) ctx.letterSpacing = `${String(spacing / k)}px`;
  ctx.textAlign = align;
  ctx.textBaseline = 'middle';
  ctx.fillStyle = color;
  ctx.fillText(text, 0, 0, maxWidth / k);
  const wide = Math.min(maxWidth, ctx.measureText(text).width * k);
  ctx.restore();
  return wide;
}

/** A micro label, such as an eyebrow: `text` in capitals, 2.4 units tall and spaced out, the smallest type drawn. */
export function eyebrow(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  color: string,
  align: CanvasTextAlign = 'left',
  maxWidth = 100,
) {
  return words(ctx, text.toUpperCase(), x, y, 2.4, color, align, maxWidth, 0.35);
}

/** Where spark `n` of a burst is once it's `t` of the way out, from 0 to 1: spread round, slowing as it goes. */
export function sparkAt(n: number, count: number, t: number, reach: number) {
  const a = (n / count) * Math.PI * 2 + n * 0.7;
  const out = reach * (1 - (1 - t) * (1 - t)) * (0.7 + (n % 3) * 0.15);
  return { x: Math.cos(a) * out, y: Math.sin(a) * out * 0.75 - t * t * reach * 0.3 };
}

/** A burst of `count` sparks round `x`, `y`, `t` of the way through, fading as it spreads. */
export function sparks(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  t: number,
  count: number,
  reach: number,
  palette: readonly string[],
) {
  if (t < 0 || t >= 1) return;
  for (let n = 0; n < count; n++) {
    const p = sparkAt(n, count, t, reach);
    ctx.globalAlpha = (1 - t) * 0.9;
    ctx.fillStyle = palette.at(n % palette.length) ?? colors.glow;
    ctx.beginPath();
    ctx.arc(x + p.x, y + p.y, 0.55 * (1 - t * 0.5), 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
}

/** A little gift, `s` units across, standing on `x`, `y`: a berry box with a gold ribbon and bow. */
export function gift(ctx: CanvasRenderingContext2D, x: number, y: number, s: number, tilt = 0) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(tilt);
  ctx.fillStyle = colors.berry;
  ctx.fillRect(-s / 2, -s, s, s);
  ctx.fillStyle = colors.cocoa;
  ctx.globalAlpha = 0.35;
  ctx.fillRect(0, -s, s / 2, s);
  ctx.globalAlpha = 1;
  ctx.fillStyle = colors.gold;
  ctx.fillRect(-s * 0.08, -s, s * 0.16, s);
  ctx.fillRect(-s / 2, -s * 0.58, s, s * 0.16);
  ctx.beginPath();
  ctx.ellipse(-s * 0.18, -s * 1.08, s * 0.2, s * 0.12, -0.4, 0, Math.PI * 2);
  ctx.ellipse(s * 0.18, -s * 1.08, s * 0.2, s * 0.12, 0.4, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}
