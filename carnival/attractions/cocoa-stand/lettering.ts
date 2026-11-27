/**
 * Lettering for the cocoa stand's boards, bubbles and card, in the scene's 0 to 100 units:
 * the theme's font scaled to a height, so it reads the same at every size.
 */
import { canvasFont, theme } from '../../../src/northpole/theme';

const { colors } = theme;

/** Where and how a line of words is written. */
export interface Words {
  x: number;
  y: number;
  /** How tall the letters are, in units. */
  height: number;
  colour: string;
  align?: CanvasTextAlign;
  /** Whether the words cast a soft dark shadow, for reading over the scene; on by default. */
  shade?: boolean;
}

/** Writes `text` centred on `y`, `height` units tall, with a soft dark shadow so it reads on anything. */
export function letter(ctx: CanvasRenderingContext2D, text: string, words: Words) {
  const { x, y, height, colour, align = 'center', shade = true } = words;
  const k = height / theme.font.title;
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(k, k);
  ctx.font = canvasFont('title', 'bold');
  ctx.textAlign = align;
  ctx.textBaseline = 'middle';
  if (shade) {
    ctx.fillStyle = colors.night;
    ctx.globalAlpha *= 0.6;
    ctx.fillText(text, 2, 2.5);
    ctx.globalAlpha /= 0.6;
  }
  ctx.fillStyle = colour;
  ctx.fillText(text, 0, 0);
  ctx.restore();
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
