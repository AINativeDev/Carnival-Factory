/**
 * The little snowman beside the sleigh: a carrot nose, a red scarf, and one
 * stick arm that waves slowly back and forth.
 */
import { theme } from '../../../src/northpole/theme';
import { circle, type Ctx } from './brushes';

const { colors } = theme;

/** One slow wave, there and back, in milliseconds. */
export const WAVE_PERIOD = 3_200;
/** How far the arm swings either side of its rest, in radians. */
const SWING = 0.5;

/** The waving arm's turn at `time`: slow at both ends, repeating every period. */
export function armAngle(time: number): number {
  return Math.sin((time / WAVE_PERIOD) * Math.PI * 2) * SWING;
}

/** The snowman, standing on the floor right of the sleigh, waving its far arm. */
export function drawSnowman(ctx: Ctx, u: number, time: number) {
  const x = 93 * u;
  const feet = 98.5 * u;
  ctx.fillStyle = colors.snow;
  circle(ctx, x, feet - 3 * u, 3.4 * u);
  circle(ctx, x, feet - 8 * u, 2.5 * u);

  // The stick arm, raised from the left shoulder, swinging about its tip's rest.
  ctx.save();
  ctx.translate(x - 2 * u, feet - 8.6 * u);
  ctx.rotate(-2.3 + armAngle(time));
  ctx.strokeStyle = colors.wood;
  ctx.lineWidth = 0.6 * u;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(0, 4.5 * u);
  ctx.moveTo(0, 3 * u);
  ctx.lineTo(0.9 * u, 4 * u);
  ctx.stroke();
  ctx.restore();

  // The other arm stays down at its side.
  ctx.strokeStyle = colors.wood;
  ctx.lineWidth = 0.6 * u;
  ctx.beginPath();
  ctx.moveTo(x + 2 * u, feet - 6.8 * u);
  ctx.lineTo(x + 4.6 * u, feet - 5.4 * u);
  ctx.stroke();

  // The red scarf, with its tail hanging.
  ctx.fillStyle = colors.berry;
  ctx.fillRect(x - 2.4 * u, feet - 6 * u, 4.8 * u, 1.2 * u);
  ctx.fillRect(x + 1 * u, feet - 5 * u, 1.1 * u, 2.4 * u);

  // The carrot nose, coal eyes.
  ctx.fillStyle = colors.gingerbread;
  ctx.beginPath();
  ctx.moveTo(x + 0.4 * u, feet - 8.3 * u);
  ctx.lineTo(x + 3.4 * u, feet - 7.8 * u);
  ctx.lineTo(x + 0.4 * u, feet - 7.3 * u);
  ctx.fill();
  ctx.fillStyle = colors.ink;
  circle(ctx, x - 0.9 * u, feet - 9 * u, 0.35 * u);
  circle(ctx, x + 0.7 * u, feet - 9 * u, 0.35 * u);
}
