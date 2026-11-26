/**
 * The little lantern on a post beside the snowman: a warm glow and a flame
 * that flickers gently.
 */
import { glow } from '../../../src/northpole/diorama';
import { theme } from '../../../src/northpole/theme';
import { circle, type Ctx } from './brushes';

const { colors } = theme;

/** One full flicker, in milliseconds: slow enough to stay gentle. */
export const FLICKER_PERIOD = 2_400;

/** The flame at `time`: its height as a share of rest, and how brightly it glows (0.7 to 1). */
export function flameAt(time: number): { height: number; strength: number } {
  const turn = (time / FLICKER_PERIOD) * Math.PI * 2;
  const wobble = Math.sin(turn) * 0.6 + Math.sin(turn * 3 + 1) * 0.4;
  return { height: 1 + wobble * 0.15, strength: 0.85 + wobble * 0.15 };
}

/** The lantern, on its post on the floor just left of the snowman. */
export function drawLantern(ctx: Ctx, u: number, time: number) {
  const x = 86 * u;
  const feet = 98.5 * u;
  const top = feet - 11 * u;
  const { height, strength } = flameAt(time);

  // The post, with a small hook arm for the lantern.
  ctx.strokeStyle = colors.wood;
  ctx.lineWidth = 0.8 * u;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(x, feet);
  ctx.lineTo(x, top);
  ctx.stroke();

  // The light it throws, then the lantern's frame and its glass.
  glow(ctx, x, top + 2.4 * u, 7 * u, strength);
  ctx.fillStyle = colors.wood;
  ctx.fillRect(x - 1.6 * u, top + 0.2 * u, 3.2 * u, 0.5 * u);
  ctx.fillRect(x - 1.6 * u, top + 4.4 * u, 3.2 * u, 0.5 * u);
  ctx.globalAlpha = 0.55;
  ctx.fillStyle = colors.glow;
  ctx.fillRect(x - 1.2 * u, top + 0.7 * u, 2.4 * u, 3.7 * u);
  ctx.globalAlpha = 1;

  // The flame, a teardrop that rises and sinks.
  ctx.fillStyle = colors.gold;
  ctx.beginPath();
  ctx.moveTo(x, top + 4.2 * u - 2.6 * u * height);
  ctx.quadraticCurveTo(x + 1 * u, top + 3.2 * u, x, top + 4.2 * u);
  ctx.quadraticCurveTo(x - 1 * u, top + 3.2 * u, x, top + 4.2 * u - 2.6 * u * height);
  ctx.fill();
  ctx.fillStyle = colors.glow;
  circle(ctx, x, top + 3.5 * u, 0.5 * u);
}
