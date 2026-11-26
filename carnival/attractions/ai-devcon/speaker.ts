/**
 * The elf speaker at the lectern, stage left: a speaker of their own for each
 * talk, who walks on when the talk starts and points at the slides now and
 * then, in a pool of warm light.
 */
import { glow } from '../../../src/northpole/diorama';
import { theme } from '../../../src/northpole/theme';
import { arm, dot, pick, SHIRTS } from './paint';

const { colors } = theme;

/** The speaker's hat for each talk, so each talk has a speaker of its own. */
const SPEAKER_HATS = [
  colors.berry,
  colors.pine,
  colors.violet,
  colors.gold,
  colors.mint,
  colors.gingerbread,
];

/** The speaker for talk `talk`, behind the lectern at `x`, walking on when the talk starts at `since`. */
export function speaker(
  ctx: CanvasRenderingContext2D,
  x: number,
  talk: number,
  since: number,
  time: number,
) {
  const on = Math.min(1, Math.max(0, (time - since) / 700));
  const at = x - (1 - on) * 24;
  const bob = on < 1 ? Math.abs(Math.sin(time / 120)) * 0.6 : 0;
  const hat = pick(SPEAKER_HATS, talk);
  glow(ctx, at, 36, 9, 0.6);
  ctx.fillStyle = pick(SHIRTS, talk + 2);
  ctx.beginPath();
  ctx.ellipse(at, 41 - bob, 3.4, 5, 0, 0, Math.PI * 2);
  ctx.fill();
  // Pointing at the slides, now and then.
  const point = on < 1 ? 0 : Math.max(0, Math.sin(time / 1_300));
  arm(
    ctx,
    [at + 2.4, 38.5 - bob],
    [at + 4 + point * 2.4, 39 - point * 4 - bob],
    1,
    pick(SHIRTS, talk + 2),
    colors.cream,
  );
  const hy = 33.6 - bob;
  ctx.fillStyle = colors.cream;
  for (const side of [-1, 1]) {
    ctx.beginPath();
    ctx.moveTo(at + side * 2, hy - 0.6);
    ctx.lineTo(at + side * 4, hy - 1.8);
    ctx.lineTo(at + side * 2, hy + 0.8);
    ctx.fill();
  }
  dot(ctx, at, hy, 2.4, colors.cream);
  dot(ctx, at - 0.8, hy - 0.2, 0.3, colors.ink);
  dot(ctx, at + 0.8, hy - 0.2, 0.3, colors.ink);
  ctx.strokeStyle = colors.ink;
  ctx.lineWidth = 0.25;
  ctx.beginPath();
  ctx.arc(at, hy + 0.5, 0.9, 0.2, Math.PI - 0.2);
  ctx.stroke();
  ctx.fillStyle = hat;
  ctx.beginPath();
  ctx.moveTo(at - 2.6, hy - 1.2);
  ctx.quadraticCurveTo(at, hy - 6, at + 3.4, hy - 6.4);
  ctx.lineTo(at + 2.6, hy - 1.2);
  ctx.fill();
  dot(ctx, at + 3.4, hy - 6.4, 0.7, colors.snow);
  // Their headset mic.
  ctx.strokeStyle = colors.ink;
  ctx.beginPath();
  ctx.moveTo(at - 2.3, hy);
  ctx.quadraticCurveTo(at - 2.2, hy + 1.8, at - 0.8, hy + 1.6);
  ctx.stroke();
  lectern(ctx, x);
}

function lectern(ctx: CanvasRenderingContext2D, x: number) {
  ctx.fillStyle = colors.cocoa;
  ctx.beginPath();
  ctx.moveTo(x - 4.6, 38.6);
  ctx.lineTo(x + 4.6, 38.6);
  ctx.lineTo(x + 3.4, 47);
  ctx.lineTo(x - 3.4, 47);
  ctx.fill();
  ctx.fillStyle = colors.wood;
  ctx.fillRect(x - 5, 37.8, 10, 1.4);
  ctx.fillStyle = colors.violet;
  ctx.fillRect(x - 3.2, 41, 6.4, 2.4);
  ctx.fillStyle = colors.mint;
  ctx.fillRect(x - 3.2, 43, 6.4, 0.4);
}
