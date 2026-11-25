/**
 * Santa's red sleigh and its two elf riders, drawn tilted with the track:
 * their hands go up on the drop, and rest on the rim the rest of the ride.
 */
import { glow } from '../../../src/northpole/diorama';
import { theme } from '../../../src/northpole/theme';

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
export function drawSleigh(
  ctx: CanvasRenderingContext2D,
  pose: { x: number; y: number; angle: number },
  up: boolean,
) {
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
