/**
 * The people in the hall: attendees seen from behind in their seats, their
 * laptops glowing past their shoulders and their badges lighting up when a
 * cheer reaches them. The speaker on stage is in `speaker.ts`.
 */
import { glow } from '../../../src/northpole/diorama';
import { theme } from '../../../src/northpole/theme';
import { lookOf, type Pose, type Seat } from './crowd';
import { arm, dot, HAIR, pick, SHIRTS, SKIN } from './paint';

const { colors } = theme;

/** Where an attendee's hands are for `pose` at `time`, around their middle `x` and shoulders `y`. */
function hands(pose: Pose, x: number, y: number, s: number, time: number): [number, number][] {
  if (pose.hands === 'ask') return [[x + 4.2 * s, y - 13 * s + Math.sin(time / 300) * 0.4 * s]];
  if (pose.hands === 'up') {
    const wave = Math.sin(time / 180) * 0.8 * s;
    return [
      [x - 5 * s + wave, y - 12.5 * s],
      [x + 5 * s - wave, y - 12.5 * s],
    ];
  }
  if (pose.hands === 'clap') {
    const apart = (1.3 + Math.abs(Math.sin(time / 120)) * 1.4) * s;
    return [
      [x - apart, y - 9.5 * s],
      [x + apart, y - 9.5 * s],
    ];
  }
  return [];
}

/** One attendee in their seat, seen from behind, doing `pose` at `time`. */
export function attendee(ctx: CanvasRenderingContext2D, seat: Seat, pose: Pose, time: number) {
  const { s } = seat;
  const look = lookOf(seat);
  const x = seat.x;
  const y = seat.y - pose.lift;
  const shirt = pick(SHIRTS, look.shirt);
  const skin = pick(SKIN, seat.seed);
  if (look.laptop) {
    glow(ctx, x + 4 * s, y - 3 * s, 4 * s, 0.35);
    ctx.fillStyle = colors.ice;
    ctx.fillRect(x + 1.5 * s, y - 5 * s, 5.4 * s, 3.6 * s);
    ctx.fillStyle = colors.ink;
    ctx.globalAlpha = 0.5;
    for (let k = 0; k < 3; k++) {
      const w = (1.5 + ((seat.seed + k + Math.floor(time / 900)) % 4)) * s;
      ctx.fillRect(x + 4 * s, y - 4.3 * s + k * 1 * s, w * 0.6, 0.4 * s);
    }
    ctx.globalAlpha = 1;
  }
  ctx.fillStyle = shirt;
  ctx.beginPath();
  ctx.ellipse(x, y + 3 * s, 5 * s, 7 * s, 0, 0, Math.PI * 2);
  ctx.fill();
  for (const hand of hands(pose, x, y, s, time)) {
    arm(ctx, [hand[0] < x ? x - 3.2 * s : x + 3.2 * s, y - 2 * s], hand, s, shirt, skin);
  }
  // The lanyard round the back of their neck; when a cheer reaches them, their badge lights up.
  ctx.strokeStyle = colors.violet;
  ctx.lineWidth = 0.5 * s;
  ctx.beginPath();
  ctx.arc(x, y - 5.6 * s, 2 * s, 0.25 * Math.PI, 0.75 * Math.PI);
  ctx.stroke();
  if (pose.lit > 0) {
    glow(ctx, x - 4.6 * s, y + 0.8 * s, 5 * s, pose.lit);
    ctx.globalAlpha = Math.min(1, pose.lit * 2);
    ctx.fillStyle = colors.mint;
    ctx.fillRect(x - 5.8 * s, y - 0.4 * s, 1.8 * s, 2.4 * s);
    ctx.globalAlpha = 1;
  }
  ctx.fillStyle = colors.surface;
  ctx.beginPath();
  ctx.roundRect(x - 5 * s, y + 3 * s, 10 * s, 8 * s, 1.2 * s);
  ctx.fill();
  const hy = y - 7 * s + pose.nod;
  dot(ctx, x, hy, 3 * s, pick(HAIR, look.hair));
  // Rim light from the stage, along the top of the head.
  ctx.strokeStyle = colors.lantern;
  ctx.globalAlpha = 0.4;
  ctx.lineWidth = 0.4 * s;
  ctx.beginPath();
  ctx.arc(x, hy, 2.8 * s, Math.PI * 1.15, Math.PI * 1.85);
  ctx.stroke();
  ctx.globalAlpha = 1;
  headwear(ctx, look.hat, x, hy, s);
}

function headwear(ctx: CanvasRenderingContext2D, hat: string, x: number, y: number, s: number) {
  if (hat === 'elf') {
    ctx.fillStyle = colors.berry;
    ctx.beginPath();
    ctx.moveTo(x - 3 * s, y - 1 * s);
    ctx.quadraticCurveTo(x - 1 * s, y - 6 * s, x + 3.5 * s, y - 7 * s);
    ctx.lineTo(x + 3 * s, y - 1 * s);
    ctx.fill();
    dot(ctx, x + 3.5 * s, y - 7 * s, 0.9 * s, colors.snow);
    ctx.fillStyle = colors.snow;
    ctx.fillRect(x - 3.2 * s, y - 1.6 * s, 6.4 * s, 1.2 * s);
  } else if (hat === 'beanie') {
    ctx.fillStyle = colors.pine;
    ctx.beginPath();
    ctx.arc(x, y - 0.4 * s, 3.1 * s, Math.PI, 0);
    ctx.fill();
    dot(ctx, x, y - 3.6 * s, 0.9 * s, colors.gold);
  } else if (hat === 'headphones') {
    ctx.strokeStyle = colors.ink;
    ctx.lineWidth = 0.7 * s;
    ctx.beginPath();
    ctx.arc(x, y, 3.3 * s, Math.PI * 1.05, Math.PI * 1.95);
    ctx.stroke();
    ctx.fillStyle = colors.ink;
    ctx.fillRect(x - 3.9 * s, y - 0.6 * s, 1.4 * s, 2.4 * s);
    ctx.fillRect(x + 2.5 * s, y - 0.6 * s, 1.4 * s, 2.4 * s);
  }
}
