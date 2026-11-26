/**
 * Words on the drawing, at a size in the attraction's 0 to 100 units: the
 * theme's sign lettering drawn large and scaled down, so text stays crisp at
 * any size the square is drawn. Every word is the attraction's own.
 */
import { signFont, type SignFamily } from '../../../src/northpole/theme';

/** How a line of words is set: its size in units, colour, alignment, weight, family and widest. */
export interface Setting {
  size: number;
  color: string;
  align?: CanvasTextAlign;
  bold?: boolean;
  family?: SignFamily;
  max?: number;
}

/** The size the lettering is set at before it's scaled to `size` units. */
const SET_AT = 40;

/** Draws `text` with its middle at `y`, aligned on `x`. */
export function words(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  o: Setting,
) {
  const k = o.size / SET_AT;
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(k, k);
  ctx.font = signFont(o.family ?? 'sans', SET_AT, o.bold ?? true);
  ctx.fillStyle = o.color;
  ctx.textAlign = o.align ?? 'center';
  ctx.textBaseline = 'middle';
  if (o.max === undefined) ctx.fillText(text, 0, 0);
  else ctx.fillText(text, 0, 0, o.max / k);
  ctx.restore();
}
