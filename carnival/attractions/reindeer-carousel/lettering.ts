/**
 * Lettering for the carousel's scoreboard and cards, in the scene's 0 to 100
 * units: the theme's font scaled to a height, so it reads the same on the
 * map's little stall front and full size inside.
 */
import { canvasFont, theme } from '../../../src/northpole/theme';

/** Where and how a line of lettering is written. */
export interface Words {
  x: number;
  y: number;
  /** How tall the letters are, in units. */
  height: number;
  colour: string;
  /** The widest the words may be, in units. */
  width: number;
}

/** Writes `text` centred on `x`, `y`, `height` units tall, squeezed to fit `width`. */
export function letter(ctx: CanvasRenderingContext2D, text: string, words: Words) {
  const { x, y, height, colour, width } = words;
  const k = height / theme.font.title;
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(k, k);
  ctx.font = canvasFont('title', 'bold');
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = colour;
  ctx.fillText(text, 0, 0, width / k);
  ctx.restore();
}

/** A rounded panel's path, ready to fill. */
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
