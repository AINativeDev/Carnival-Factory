/**
 * The little people and animals of Santa's line, each drawn standing on a point
 * of the 0 to 100 diorama: kids in bright coats, the elf, the family dog and the
 * reindeer with its glowing red nose.
 */
import { shadow } from '../../../src/northpole/diorama';
import { theme } from '../../../src/northpole/theme';

const { colors } = theme;

/** Coats and hats the children take turns wearing. */
const COATS = [colors.aurora, colors.violet, colors.gold, colors.ice, colors.mint] as const;

/** A fill of `color` for the shape `path` draws. */
function filled(ctx: CanvasRenderingContext2D, color: string, path: () => void) {
  ctx.fillStyle = color;
  ctx.beginPath();
  path();
  ctx.fill();
}

/** A child standing on (x, y), `walk` driving the swing of their legs. */
export function drawChild(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  index: number,
  walk: number,
) {
  const coat = COATS[index % COATS.length] ?? colors.gold;
  const step = Math.sin(walk) * 1.2;
  shadow(ctx, x, y, 7);
  ctx.fillStyle = colors.ink;
  ctx.fillRect(x - 1.8 + step, y - 3, 1.4, 3);
  ctx.fillRect(x + 0.4 - step, y - 3, 1.4, 3);
  filled(ctx, coat, () => {
    ctx.roundRect(x - 2.6, y - 8.5, 5.2, 6, 1.5);
  });
  filled(ctx, colors.cream, () => {
    ctx.arc(x, y - 10.5, 2.2, 0, Math.PI * 2);
  });
  filled(ctx, colors.berry, () => {
    ctx.arc(x, y - 12, 2.3, Math.PI, Math.PI * 2);
  });
  filled(ctx, colors.snow, () => {
    ctx.arc(x, y - 14.4, 0.8, 0, Math.PI * 2);
  });
}

/** A child perched on Santa's lap, a little speech bubble of presents above them. */
export function drawChildOnLap(ctx: CanvasRenderingContext2D, x: number, y: number, index: number) {
  drawChild(ctx, x, y + 3, index, 0);
  filled(ctx, colors.cream, () => {
    ctx.ellipse(x - 9, y - 16, 6, 4, 0, 0, Math.PI * 2);
  });
  filled(ctx, colors.berry, () => {
    ctx.rect(x - 11, y - 18, 3.4, 3);
  });
  ctx.fillStyle = colors.gold;
  ctx.fillRect(x - 9.6, y - 18, 0.6, 3);
}

/** The family dog on (x, y): a brown pup wagging its tail. */
export function drawDog(ctx: CanvasRenderingContext2D, x: number, y: number, wag: number) {
  shadow(ctx, x, y, 7);
  filled(ctx, colors.gingerbread, () => {
    ctx.ellipse(x, y - 3, 3.6, 2, 0, 0, Math.PI * 2);
  });
  filled(ctx, colors.gingerbread, () => {
    ctx.arc(x + 3.4, y - 5, 1.8, 0, Math.PI * 2);
  });
  filled(ctx, colors.cocoa, () => {
    ctx.ellipse(x + 4.6, y - 6.4, 0.7, 1.3, 0.4, 0, Math.PI * 2);
  });
  ctx.strokeStyle = colors.gingerbread;
  ctx.lineWidth = 0.9;
  ctx.beginPath();
  ctx.moveTo(x - 3.4, y - 3.6);
  ctx.lineTo(x - 5.4, y - 5.4 + Math.sin(wag) * 1.4);
  ctx.stroke();
  ctx.fillStyle = colors.cocoa;
  ctx.fillRect(x - 2, y - 1.5, 0.9, 1.5);
  ctx.fillRect(x + 1.6, y - 1.5, 0.9, 1.5);
}

/** The elf on (x, y), facing right, arms out to lead a child by the hand when `leading`. */
export function drawElf(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  leading: boolean,
  walk: number,
) {
  const step = Math.sin(walk) * 1.3;
  shadow(ctx, x, y, 7);
  ctx.fillStyle = colors.berry;
  ctx.fillRect(x - 1.8 + step, y - 3, 1.4, 3);
  ctx.fillRect(x + 0.4 - step, y - 3, 1.4, 3);
  filled(ctx, colors.pine, () => {
    ctx.roundRect(x - 3, y - 9, 6, 6.5, 1.5);
  });
  filled(ctx, colors.gold, () => {
    ctx.rect(x - 3, y - 5.4, 6, 1);
  });
  ctx.strokeStyle = colors.pine;
  ctx.lineWidth = 1.1;
  ctx.beginPath();
  ctx.moveTo(x - 2.4, y - 7.5);
  ctx.lineTo(x - 4.6, y - (leading ? 6.6 : 4.4));
  ctx.stroke();
  filled(ctx, colors.cream, () => {
    ctx.arc(x, y - 11.4, 2.4, 0, Math.PI * 2);
  });
  filled(ctx, colors.cream, () => {
    ctx.moveTo(x + 2.2, y - 11.6);
    ctx.lineTo(x + 4.4, y - 12.8);
    ctx.lineTo(x + 2.2, y - 10.4);
  });
  filled(ctx, colors.pine, () => {
    ctx.moveTo(x - 2.6, y - 13);
    ctx.lineTo(x + 0.6, y - 19);
    ctx.lineTo(x + 2.8, y - 13);
  });
  filled(ctx, colors.berry, () => {
    ctx.arc(x + 0.6, y - 19, 0.9, 0, Math.PI * 2);
  });
}

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
