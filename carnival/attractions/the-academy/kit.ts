/**
 * The small pieces every part of the Academy shares: the type scale the
 * Tessl places all use, lettering in it, letter-spaced eyebrows, text that
 * eases in, wrapping words, easing, a steady scatter for particles, and a
 * few outlines (a rounded card, a star, a tick). All in the square's 0 to
 * 100 units.
 */
import { signFont, theme } from '../../../src/northpole/theme';

const { colors } = theme;

/**
 * The one type scale, shared by the Factory, the Academy and the Studio: the
 * title, a lead line, body text (the smallest anything a visitor must read
 * may be: about 11 px on a phone) and micro labels for eyebrows only.
 */
export const TYPE = { title: 6.5, lead: 3.6, body: 3, micro: 2.4 } as const;

/** Lettering at `px` units, round like the rest of the North Pole's signs. */
export function letters(ctx: CanvasRenderingContext2D, px: number, bold = true) {
  ctx.font = signFont('rounded', px, bold);
}

/** How new text comes in, `since` ms after it appeared: its alpha, and how far it still has to rise. */
export function easeIn(since: number): { alpha: number; rise: number } {
  const t = smooth(since / 300);
  return { alpha: t, rise: 1 - t };
}

/**
 * An eyebrow: `text` in micro capitals, letter-spaced by hand (a canvas in a
 * worker may not know letterSpacing), starting at `x` on the line `y`.
 * Returns where it ends.
 */
export function eyebrow(ctx: CanvasRenderingContext2D, text: string, x: number, y: number) {
  letters(ctx, TYPE.micro);
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  let at = x;
  for (const char of text.toUpperCase()) {
    ctx.fillText(char, at, y);
    at += ctx.measureText(char).width + 0.28;
  }
  return at;
}

/** Splits `text` into lines no wider than `width`, as `measure` says; a word too long stays whole. */
export function wrap(text: string, width: number, measure: (line: string) => number): string[] {
  const lines: string[] = [];
  let line = '';
  for (const word of text.split(/\s+/).filter(Boolean)) {
    const tried = line ? `${line} ${word}` : word;
    if (line && measure(tried) > width) {
      lines.push(line);
      line = word;
    } else line = tried;
  }
  if (line) lines.push(line);
  return lines;
}

/** A steady scatter from 0 to 1 for particle `n`: the same every frame, so particles move from time alone. */
export function scatter(n: number): number {
  const s = Math.sin(n * 12.9898 + 78.233) * 43_758.5453;
  return s - Math.floor(s);
}

/** Eases 0 to 1 with a little overshoot at the end, for things that pop in. */
export function popIn(t: number): number {
  const k = Math.min(Math.max(t, 0), 1);
  // Never below 0, not even by a rounding error: an ellipse's radius can't be.
  return Math.max(0, 1 + 2.7 * (k - 1) ** 3 + 1.7 * (k - 1) ** 2);
}

/** Eases 0 to 1, slow at both ends. */
export function smooth(t: number): number {
  const k = Math.min(Math.max(t, 0), 1);
  return k * k * (3 - 2 * k);
}

/** A rounded rectangle's outline. */
export function rounded(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

/** A five-pointed star's outline round `x`, `y`, `r` to its points. */
function starPath(ctx: CanvasRenderingContext2D, x: number, y: number, r: number) {
  ctx.beginPath();
  for (let n = 0; n < 10; n++) {
    const a = -Math.PI / 2 + (n * Math.PI) / 5;
    const reach = n % 2 ? r * 0.45 : r;
    ctx.lineTo(x + Math.cos(a) * reach, y + Math.sin(a) * reach);
  }
  ctx.closePath();
}

/** A gold star, lit on its upper left. */
export function star(ctx: CanvasRenderingContext2D, x: number, y: number, r: number) {
  starPath(ctx, x, y, r);
  ctx.fillStyle = colors.gold;
  ctx.fill();
  ctx.fillStyle = colors.glow;
  starPath(ctx, x - r * 0.12, y - r * 0.12, r * 0.45);
  ctx.fill();
}

/** A tick, as a passed check is marked. */
export function tick(ctx: CanvasRenderingContext2D, x: number, y: number, r: number) {
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.beginPath();
  ctx.moveTo(x - r, y);
  ctx.lineTo(x - r * 0.3, y + r * 0.7);
  ctx.lineTo(x + r, y - r * 0.8);
  ctx.stroke();
}
