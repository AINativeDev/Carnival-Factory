/**
 * Santa's red sleigh and its two elf riders, drawn tilted with the track:
 * their hands go up on the drops and in the air, and rest on the rim the rest
 * of the ride. Puffs of snow fly from its runners while it's pushed, and the
 * snowdrift it tumbles into catches it with a soft burst of snow.
 */
import { glow } from '../../../src/northpole/diorama';
import { theme } from '../../../src/northpole/theme';
import type { Pose } from './pose';

const { colors } = theme;

/** Where the two riders sit along the sleigh, and the colour of each one's hat. */
const RIDERS = [
  { x: -3.5, hat: colors.pine },
  { x: 1.5, hat: colors.berry },
] as const;

/** One elf rider at `x` in the sleigh, its arms up on the drop or down on the rim. */
function drawRider(ctx: CanvasRenderingContext2D, x: number, hat: string, up: boolean) {
  ctx.strokeStyle = colors.pine;
  ctx.lineWidth = 0.9;
  ctx.lineCap = 'round';
  ctx.beginPath();
  for (const side of [-1, 1]) {
    ctx.moveTo(x + side * 0.8, -10);
    if (up) ctx.lineTo(x + side * 1.8, -15.5);
    else ctx.lineTo(x + side * 2.2, -8.6);
  }
  ctx.stroke();
  ctx.fillStyle = colors.pine;
  ctx.fillRect(x - 1.1, -11, 2.2, 2.4);
  ctx.fillStyle = colors.cream;
  ctx.beginPath();
  ctx.arc(x, -12.4, 1.4, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = hat;
  ctx.beginPath();
  ctx.moveTo(x - 1.5, -13);
  ctx.lineTo(x + 1.5, -13);
  ctx.lineTo(x + 0.6, -16);
  ctx.closePath();
  ctx.fill();
}

/** The sleigh at `pose`, with a sack of presents behind the riders and a lantern ahead. */
export function drawSleigh(ctx: CanvasRenderingContext2D, pose: Pose) {
  const { up } = pose;
  ctx.save();
  ctx.translate(pose.x, pose.y);
  ctx.rotate(pose.angle);
  ctx.scale(0.8, 0.8);
  glow(ctx, 6, -8, 10, 0.8);
  ctx.fillStyle = colors.wood;
  ctx.beginPath();
  ctx.arc(-6, -10.5, 2.6, 0, Math.PI * 2);
  ctx.fill();
  for (const rider of RIDERS) drawRider(ctx, rider.x, rider.hat, up);
  ctx.fillStyle = colors.gold;
  ctx.fillRect(-7, -1.5, 14, 1.5);
  ctx.fillStyle = colors.berry;
  ctx.beginPath();
  ctx.moveTo(-7, -2);
  ctx.lineTo(6, -2);
  ctx.quadraticCurveTo(9, -6, 6, -9);
  ctx.lineTo(-5, -9);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = colors.shadow;
  ctx.globalAlpha = 0.3;
  ctx.fillRect(-7, -5, 15, 3);
  ctx.globalAlpha = 1;
  ctx.restore();
}

/** Puffs of snow kicked up behind the runners while the sleigh is pushed, drifting back as they fade. */
export function drawPuffs(ctx: CanvasRenderingContext2D, pose: Pose, time: number) {
  ctx.save();
  ctx.translate(pose.x, pose.y);
  ctx.rotate(pose.angle);
  ctx.fillStyle = colors.snowLit;
  for (let k = 0; k < 4; k++) {
    const age = (time / 260 + k / 4) % 1;
    ctx.globalAlpha = (1 - age) * 0.75;
    ctx.beginPath();
    ctx.arc(-6 - age * 9, -1 - age * 2.5 - (k % 2) * 1.2, 0.8 + age * 1.8, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

/** The snowdrift at `at`, and the burst of snow as the tumbling sleigh lands in it, `t` from 0 to 1 through the tumble. */
export function drawDrift(ctx: CanvasRenderingContext2D, at: { x: number; y: number }, t: number) {
  ctx.fillStyle = colors.snowShade;
  ctx.beginPath();
  ctx.ellipse(at.x + 0.8, at.y + 0.8, 11, 6.6, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = colors.snowLit;
  ctx.beginPath();
  ctx.ellipse(at.x - 0.6, at.y - 0.2, 9.6, 5.8, 0, 0, Math.PI * 2);
  ctx.fill();
  if (t < 0.7) return;
  // The burst: a ring of snow thrown up as it lands, settling as the card comes up.
  const burst = (t - 0.7) / 0.3;
  ctx.fillStyle = colors.snow;
  ctx.globalAlpha = 1 - burst * 0.7;
  for (let k = 0; k < 7; k++) {
    const a = Math.PI * (1.05 + (k / 6) * 0.9);
    const r = 3 + burst * 7;
    ctx.beginPath();
    ctx.arc(
      at.x + Math.cos(a) * r,
      at.y - 1 + Math.sin(a) * r * 0.7,
      1.4 - burst * 0.5,
      0,
      Math.PI * 2,
    );
    ctx.fill();
  }
  ctx.globalAlpha = 1;
}
