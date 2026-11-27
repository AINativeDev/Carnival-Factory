/**
 * Lettering for the booth's scoreboard, wind sign and cards, in the square's 0 to 100
 * units: the theme's font scaled to a height, so it reads the same on the
 * map's little stall front and full size inside.
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
  /** The widest the words may be, in units. */
  width?: number;
}

/** Writes `text` in bold, centred on `y`, `height` units tall. */
export function letter(ctx: CanvasRenderingContext2D, text: string, words: Words) {
  const { x, y, height, colour, align = 'center', width } = words;
  const k = height / theme.font.title;
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(k, k);
  ctx.font = canvasFont('title', 'bold');
  ctx.textAlign = align;
  ctx.textBaseline = 'middle';
  ctx.fillStyle = colour;
  if (width === undefined) ctx.fillText(text, 0, 0);
  else ctx.fillText(text, 0, 0, width / k);
  ctx.restore();
}

/** A rounded rectangle's path, ready to fill. */
function rounded(
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

/** A panel: an ink rim round a dusk-blue board. */
export function panel(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number) {
  ctx.fillStyle = colors.ink;
  rounded(ctx, x - 0.6, y - 0.6, w + 1.2, h + 1.2, 2.6);
  ctx.fill();
  ctx.fillStyle = colors.surface;
  rounded(ctx, x, y, w, h, 2.2);
  ctx.fill();
}
