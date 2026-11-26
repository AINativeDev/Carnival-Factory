/**
 * The teacher: a round snowy owl in gold spectacles and a red scarf, on a
 * pile of books by the board. It points its chalk stick at the card it is
 * looking at, hops with its wings up for a right answer, tilts its head at a
 * wrong one, and wears a mortarboard for the report card. What it says is
 * in bubble.ts.
 */
import { theme } from '../../../src/northpole/theme';
import { rounded } from './chalk';

const { colors } = theme;

/** What the owl is doing. */
export type Pose = 'point' | 'cheer' | 'ponder' | 'graduate';

/** A wing, hinged at the shoulder, raised by `lift` radians. */
function wing(ctx: CanvasRenderingContext2D, x: number, y: number, side: 1 | -1, lift: number) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(side * (0.25 - lift));
  ctx.fillStyle = colors.wood;
  ctx.beginPath();
  ctx.ellipse(side * 1.2, 3.4, 2, 4.4, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

/** The owl's eye: open with a glint, or a happy closed arc. */
function eye(ctx: CanvasRenderingContext2D, x: number, y: number, happy: boolean, look: number) {
  ctx.fillStyle = colors.snowLit;
  ctx.beginPath();
  ctx.arc(x, y, 2, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = colors.gold;
  ctx.lineWidth = 0.45;
  ctx.stroke();
  if (happy) {
    ctx.strokeStyle = colors.ink;
    ctx.lineWidth = 0.5;
    ctx.beginPath();
    ctx.arc(x, y + 0.5, 1, Math.PI * 1.1, Math.PI * 1.9);
    ctx.stroke();
    return;
  }
  ctx.fillStyle = colors.ink;
  ctx.beginPath();
  ctx.arc(x + look * 0.6, y + 0.2, 1, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = colors.snow;
  ctx.fillRect(x + look * 0.6 - 0.6, y - 0.5, 0.45, 0.45);
}

/** The mortarboard, its tassel swinging. */
function cap(ctx: CanvasRenderingContext2D, time: number) {
  ctx.fillStyle = colors.ink;
  ctx.fillRect(-3.4, -9.6, 6.8, 2);
  ctx.beginPath();
  ctx.moveTo(-6.5, -10);
  ctx.lineTo(0, -12.4);
  ctx.lineTo(6.5, -10);
  ctx.lineTo(0, -7.8);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = colors.gold;
  ctx.lineWidth = 0.4;
  const swing = Math.sin(time / 500) * 0.8;
  ctx.beginPath();
  ctx.moveTo(0, -10.2);
  ctx.lineTo(4.6, -9.6);
  ctx.lineTo(4.8 + swing, -6.4);
  ctx.stroke();
}

/**
 * The owl standing on `x`, `y`, doing `pose`, `since` ms into it, its stick
 * pointing at `target` when it points.
 */
export function owl(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  pose: Pose,
  since: number,
  time: number,
  target: { x: number; y: number },
) {
  const hop =
    pose === 'cheer' ? Math.abs(Math.sin(since / 170)) * 2.4 * Math.max(1 - since / 1_800, 0) : 0;
  const bob = Math.sin(time / 650) * 0.4;
  const blink = time % 4_200 < 140;
  ctx.fillStyle = colors.shadow;
  ctx.globalAlpha = 0.3;
  ctx.beginPath();
  ctx.ellipse(x + 0.6, y, 5.5, 1.2, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = 1;
  ctx.save();
  ctx.translate(x, y - hop + bob);
  const lift = pose === 'cheer' || pose === 'graduate' ? 1.4 + Math.sin(since / 160) * 0.25 : 0;
  // The stick in the right wing, pointed at the target.
  if (pose === 'point') {
    const angle = Math.atan2(target.y - (y - 9), target.x - (x + 4));
    ctx.save();
    ctx.translate(4, -9);
    ctx.rotate(angle);
    ctx.fillStyle = colors.wood;
    ctx.fillRect(0, -0.35, 13, 0.7);
    ctx.fillStyle = colors.snow;
    ctx.fillRect(12, -0.4, 1.6, 0.8);
    ctx.restore();
  }
  wing(ctx, -4.6, -10, -1, lift);
  wing(ctx, 4.6, -10, 1, pose === 'point' ? 0.9 : lift);
  ctx.fillStyle = colors.snowShade;
  ctx.beginPath();
  ctx.ellipse(0, -6.5, 5.4, 6.8, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = colors.snowLit;
  ctx.beginPath();
  ctx.ellipse(-0.6, -5.6, 3.6, 4.8, 0, 0, Math.PI * 2);
  ctx.fill();
  // A few speckles on its chest, and its feet.
  ctx.fillStyle = colors.slabShade;
  for (const [sx, sy] of [
    [-1.8, -5],
    [0.6, -3.8],
    [-0.4, -2],
    [1.6, -6],
  ] as const)
    ctx.fillRect(sx, sy, 0.9, 0.5);
  ctx.fillStyle = colors.gold;
  ctx.fillRect(-2.4, -0.6, 1.6, 0.8);
  ctx.fillRect(0.8, -0.6, 1.6, 0.8);
  ctx.save();
  ctx.translate(0, -13);
  if (pose === 'ponder') ctx.rotate(-0.2);
  ctx.fillStyle = colors.snowShade;
  ctx.beginPath();
  ctx.ellipse(0, 0, 5, 4.4, 0, 0, Math.PI * 2);
  ctx.moveTo(-4.4, -2);
  ctx.lineTo(-4.8, -5.4);
  ctx.lineTo(-2.4, -3.6);
  ctx.moveTo(4.4, -2);
  ctx.lineTo(4.8, -5.4);
  ctx.lineTo(2.4, -3.6);
  ctx.fill();
  const happy = pose === 'cheer' || pose === 'graduate';
  const look = pose === 'point' ? Math.sign(target.x - x) : 0;
  eye(ctx, -2.2, -0.3, happy || blink, look);
  eye(ctx, 2.2, -0.3, happy || blink, look);
  ctx.strokeStyle = colors.gold;
  ctx.lineWidth = 0.4;
  ctx.beginPath();
  ctx.moveTo(-0.2, -0.6);
  ctx.lineTo(0.2, -0.6);
  ctx.stroke();
  ctx.fillStyle = colors.gingerbread;
  ctx.beginPath();
  ctx.moveTo(-0.8, 1);
  ctx.lineTo(0.8, 1);
  ctx.lineTo(0, 2.6);
  ctx.fill();
  if (pose === 'graduate') {
    // Down onto the crown of the head, between the ear tufts.
    ctx.translate(0, 5.6);
    cap(ctx, time);
  }
  ctx.restore();
  ctx.fillStyle = colors.berry;
  rounded(ctx, -3.8, -9.2, 7.6, 1.5, 0.75);
  ctx.fill();
  // The scarf's end, hanging over one shoulder and stirring a little.
  const stir = Math.sin(time / 700) * 0.3;
  ctx.beginPath();
  ctx.moveTo(-3.4, -8.2);
  ctx.lineTo(-2, -8.2);
  ctx.lineTo(-2.6 + stir, -4.8);
  ctx.lineTo(-4 + stir, -5.1);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}
