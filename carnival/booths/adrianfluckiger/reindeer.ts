/**
 * Santa's reindeer with its glowing red nose, and the carrot he hands it, each
 * drawn on a point of the 0 to 100 diorama.
 */
import { shadow } from '../../../src/northpole/diorama';
import { theme } from '../../../src/northpole/theme';
import { filled } from './figures';

const { colors } = theme;

/** The reindeer on (x, y) facing right, nose aglow, dipping its head to munch by `munch` from 0 to 1. */
export function drawReindeer(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  munch: number,
  time: number,
) {
  const dip = munch > 0 && munch < 1 ? 3 + Math.abs(Math.sin(munch * 9)) * 1.5 : 0;
  shadow(ctx, x, y, 16);
  ctx.fillStyle = colors.cocoa;
  for (const dx of [-5, -3, 3, 5]) ctx.fillRect(x + dx - 0.5, y - 6, 1.1, 6);
  filled(ctx, colors.gingerbread, () => {
    ctx.ellipse(x, y - 8, 7, 3.6, 0, 0, Math.PI * 2);
  });
  filled(ctx, colors.cream, () => {
    ctx.ellipse(x + 1, y - 6.2, 4, 1.4, 0, 0, Math.PI * 2);
  });
  ctx.strokeStyle = colors.gingerbread;
  ctx.lineWidth = 1.8;
  ctx.beginPath();
  ctx.moveTo(x + 5, y - 9);
  ctx.lineTo(x + 8, y - 15 + dip);
  ctx.stroke();
  filled(ctx, colors.gingerbread, () => {
    ctx.ellipse(x + 8.6, y - 15.5 + dip, 2.6, 2, 0, 0, Math.PI * 2);
  });
  ctx.strokeStyle = colors.cocoa;
  ctx.lineWidth = 0.7;
  ctx.beginPath();
  ctx.moveTo(x + 7.6, y - 17.2 + dip);
  ctx.lineTo(x + 6.2, y - 21 + dip);
  ctx.moveTo(x + 6.2, y - 21 + dip);
  ctx.lineTo(x + 4.8, y - 20 + dip);
  ctx.moveTo(x + 6.2, y - 21 + dip);
  ctx.lineTo(x + 7.4, y - 22.4 + dip);
  ctx.stroke();
  const pulse = 0.6 + 0.4 * Math.sin(time / 300);
  ctx.globalAlpha = 0.35 * pulse;
  filled(ctx, colors.berry, () => {
    ctx.arc(x + 10.8, y - 15.2 + dip, 3.2, 0, Math.PI * 2);
  });
  ctx.globalAlpha = 1;
  filled(ctx, colors.berry, () => {
    ctx.arc(x + 10.8, y - 15.2 + dip, 1.2, 0, Math.PI * 2);
  });
  filled(ctx, colors.ink, () => {
    ctx.arc(x + 9, y - 16.4 + dip, 0.4, 0, Math.PI * 2);
  });
}

/** A carrot flying through the air at (x, y), pointing right. */
export function drawCarrot(ctx: CanvasRenderingContext2D, x: number, y: number) {
  filled(ctx, colors.gold, () => {
    ctx.moveTo(x - 2, y - 0.8);
    ctx.lineTo(x + 2.4, y);
    ctx.lineTo(x - 2, y + 0.8);
  });
  filled(ctx, colors.pine, () => {
    ctx.ellipse(x - 2.6, y, 1, 0.7, 0, 0, Math.PI * 2);
  });
}
