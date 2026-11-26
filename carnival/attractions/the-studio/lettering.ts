/**
 * Lettering for the studio's signs, screen and bubbles, in the square's 0 to
 * 100 units: the theme's font scaled to a height, so it reads the same on the
 * map's little screen and full size inside.
 */
import { canvasFont, theme } from '../../../src/northpole/theme';

export interface Words {
  x: number;
  y: number;
  /** How tall the letters are, in units. */
  height: number;
  colour: string;
  bold?: boolean;
  align?: CanvasTextAlign;
  /** The widest the words may be, in units. */
  width?: number;
}

/** Writes `text` centred on `y`, `height` units tall. */
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

/** How wide `text` is at `height` units tall. */
export function measure(ctx: CanvasRenderingContext2D, text: string, height: number): number {
  ctx.save();
  ctx.font = canvasFont('title', 'bold');
  const width = ctx.measureText(text).width * (height / theme.font.title);
  ctx.restore();
  return width;
}

/** A rounded rectangle's path, ready to fill or stroke. */
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
