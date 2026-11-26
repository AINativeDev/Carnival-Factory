/** The teacher's speech bubble: a cream bubble with a tail, over the owl's head. */
import { theme } from '../../../src/northpole/theme';
import { letters, rounded } from './chalk';

const { colors } = theme;

/** A speech bubble with `text`, its tail pointing down to `x`, `y`; nothing for no words. */
export function bubble(ctx: CanvasRenderingContext2D, text: string, x: number, y: number) {
  if (!text) return;
  letters(ctx, 3.2);
  const w = ctx.measureText(text).width + 3;
  const left = Math.max(x - w / 2, 0.8);
  ctx.fillStyle = colors.cream;
  rounded(ctx, left, y - 6.5, w, 5, 1.6);
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(x - 1, y - 1.6);
  ctx.lineTo(x, y);
  ctx.lineTo(x + 1.2, y - 1.6);
  ctx.fill();
  ctx.fillStyle = colors.ink;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, left + w / 2, y - 3.9);
}
