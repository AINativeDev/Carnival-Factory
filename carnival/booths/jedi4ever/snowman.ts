/**
 * The small snowman beside the sleigh: a carrot nose, a red scarf and one
 * stick arm that waves slowly, worked out from `time` alone.
 */
import { theme } from '../../../src/northpole/theme';
import { circle, type Ctx } from './brushes';

const { colors } = theme;

/** One slow wave, there and back, in milliseconds. */
export const WAVE_PERIOD = 3_200;
/** How far the stick arm swings from its resting angle, in radians. */
export const WAVE_REACH = 0.5;

/** The arm's swing at `time`, from -WAVE_REACH to WAVE_REACH. */
export function waveOf(time: number): number {
  return Math.sin((time / WAVE_PERIOD) * Math.PI * 2) * WAVE_REACH;
}

/** The snowman standing at x 90 with its feet on the floor line, y 95. */
export function drawSnowman(ctx: Ctx, u: number, time: number) {
  ctx.fillStyle = colors.snow;
  circle(ctx, 90 * u, 92.6 * u, 3 * u);
  circle(ctx, 90 * u, 88.4 * u, 2.2 * u);
  circle(ctx, 90 * u, 85 * u, 1.6 * u);

  // The stick arm on the left, raised and swinging from the shoulder.
  ctx.save();
  ctx.translate(88 * u, 88 * u);
  ctx.rotate(-2.2 + waveOf(time));
  ctx.strokeStyle = colors.cocoa;
  ctx.lineWidth = 0.4 * u;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(4 * u, 0);
  ctx.moveTo(2.6 * u, 0);
  ctx.lineTo(3.4 * u, -1 * u);
  ctx.stroke();
  ctx.restore();

  // The red scarf at the neck, its tail hanging down.
  ctx.strokeStyle = colors.berry;
  ctx.lineWidth = 0.9 * u;
  ctx.beginPath();
  ctx.moveTo(88.5 * u, 86.4 * u);
  ctx.lineTo(91.5 * u, 86.4 * u);
  ctx.stroke();
  ctx.fillStyle = colors.berry;
  ctx.fillRect(90.8 * u, 86.4 * u, 0.9 * u, 2.2 * u);

  // The carrot nose, pointing right, and two coal eyes.
  ctx.fillStyle = colors.gingerbread;
  ctx.beginPath();
  ctx.moveTo(90.6 * u, 84.9 * u);
  ctx.lineTo(93 * u, 85.3 * u);
  ctx.lineTo(90.6 * u, 85.6 * u);
  ctx.fill();
  ctx.fillStyle = colors.cocoa;
  circle(ctx, 89.4 * u, 84.4 * u, 0.2 * u);
  circle(ctx, 90.6 * u, 84.4 * u, 0.2 * u);
}
