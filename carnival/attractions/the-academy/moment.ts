/**
 * What every scene gets to draw from: the visit, how long its beat has been
 * up, the clock and where the pointer is; plus the speech bubble the
 * stations' helpers talk in.
 */
import { theme } from '../../../src/northpole/theme';
import { easeIn, letters, rounded, TYPE } from './kit';
import type { Visit } from './state';

const { colors } = theme;

/** The moment a scene draws. */
export interface Moment {
  visit: Visit;
  /** How long the beat has been up, in ms. */
  since: number;
  time: number;
  /** Where the pointer is, in the square's 0 to 100 units, or undefined off the square. */
  pointer: { x: number; y: number } | undefined;
}

/**
 * A speech bubble with `text` over `x`, `y`, its tail pointing down there,
 * easing in `since` ms after it was said; nothing for no words.
 */
export function say(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  since: number,
) {
  if (!text) return;
  const { alpha, rise } = easeIn(since);
  letters(ctx, TYPE.body);
  const w = ctx.measureText(text).width + 4;
  const left = Math.min(Math.max(x - w / 2, 4), 96 - w);
  const top = y - 7.2 + rise;
  ctx.globalAlpha = alpha * 0.4;
  ctx.fillStyle = colors.shadow;
  rounded(ctx, left, top + 0.6, w, 5.6, 2.2);
  ctx.fill();
  ctx.globalAlpha = alpha;
  ctx.fillStyle = colors.snowLit;
  rounded(ctx, left, top, w, 5.6, 2.2);
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(x - 1.2, top + 5.5);
  ctx.lineTo(x, top + 7.2);
  ctx.lineTo(x + 1.4, top + 5.5);
  ctx.fill();
  ctx.fillStyle = colors.night;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, left + w / 2, top + 2.9);
  ctx.globalAlpha = 1;
}
