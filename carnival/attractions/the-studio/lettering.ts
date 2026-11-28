/**
 * Lettering for the studio, in the square's 0 to 100 units: the theme's font
 * scaled to a size, so it reads the same on the map's little screen and full
 * size inside. The sizes are the Tessl places' one type scale; nothing a
 * visitor reads is drawn smaller than `TYPE.micro`.
 */
import { canvasFont, theme } from '../../../src/northpole/theme';

/** The type scale, in units: a title, a lead line, body or caption, and micro labels. */
export const TYPE = { title: 6.5, lead: 3.6, body: 3, micro: 2.4 } as const;

export interface Words {
  x: number;
  y: number;
  /** The font's size, in units. */
  height: number;
  colour: string;
  bold?: boolean;
  align?: CanvasTextAlign;
  /** The widest the words may be, in units. */
  width?: number;
}

/** Writes `text` centred on `y`, its font `height` units. */
export function letter(ctx: CanvasRenderingContext2D, text: string, words: Words) {
  const { x, y, height, colour, bold = true, align = 'center', width } = words;
  const k = height / theme.font.title;
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(k, k);
  ctx.font = canvasFont('title', bold ? 'bold' : 'normal');
  ctx.textAlign = align;
  ctx.textBaseline = 'middle';
  ctx.fillStyle = colour;
  if (width === undefined) ctx.fillText(text, 0, 0);
  else ctx.fillText(text, 0, 0, width / k);
  ctx.restore();
}

/** How wide `text` is with its font `height` units. */
export function measure(ctx: CanvasRenderingContext2D, text: string, height: number, bold = true) {
  ctx.save();
  ctx.font = canvasFont('title', bold ? 'bold' : 'normal');
  const width = ctx.measureText(text).width * (height / theme.font.title);
  ctx.restore();
  return width;
}

/** The gap between a micro label's letters, as a share of its size. */
const TRACKING = 0.14;

/** A micro label: caps at the smallest size, letter-spaced, from `x` to the right. */
export function caps(ctx: CanvasRenderingContext2D, text: string, at: Words) {
  const gap = at.height * TRACKING;
  // Labels are plain capitals and digits, so splitting them letter by letter is safe.
  const letters = text.split('');
  const width = letters.reduce((sum, c) => sum + measure(ctx, c, at.height) + gap, -gap);
  let x = at.align === 'right' ? at.x - width : at.align === 'center' ? at.x - width / 2 : at.x;
  const { y, height, colour } = at;
  for (const c of letters) {
    letter(ctx, c, { x, y, height, colour, align: 'left' });
    x += measure(ctx, c, height) + gap;
  }
}

/** A rounded rectangle's path, ready to fill. */
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
