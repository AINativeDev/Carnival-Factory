/**
 * The ginger cat asleep on the crate by the mail slot: it twitches an ear and
 * flicks its tail once each time a letter lands on the pile, worked out from
 * `time` alone so the drawing keeps no state.
 */
import { theme } from '../../../src/northpole/theme';
import { circle, type Ctx } from './brushes';
import { SLOT } from './letters';
import { wrap } from './motion';

const { colors } = theme;

/** When a letter reaches the pile, in milliseconds after it drops (its trip's 'carry' begins). */
export const LANDING = 800;
/** How long the ear and tail take to move and settle, in milliseconds. */
export const TWITCH = 700;

/** How far the cat's ear and tail are moved, 0 asleep to 1 at the peak of the twitch. */
export function twitchAt(time: number): number {
  const since = wrap(time - LANDING, SLOT);
  if (since >= TWITCH) return 0;
  return Math.sin((since / TWITCH) * Math.PI);
}

/** The cat curled up on the crate, whose top is at y 72, at `time`. */
export function drawCat(ctx: Ctx, u: number, time: number) {
  const twitch = twitchAt(time);
  const breath = Math.sin(time / 900) * 0.25;

  // The tail, curled round the front, its tip flicking up.
  ctx.strokeStyle = colors.gingerbread;
  ctx.lineWidth = 1.3 * u;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(14 * u, 71.4 * u);
  ctx.quadraticCurveTo(14.6 * u, (69.6 - twitch * 1.5) * u, 12.6 * u, (69.2 - twitch * 3) * u);
  ctx.stroke();

  // The curled body.
  ctx.fillStyle = colors.gingerbread;
  ctx.beginPath();
  ctx.ellipse(10.6 * u, 70.4 * u, 4 * u, (1.8 + breath * 0.3) * u, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = colors.gold;
  ctx.fillRect(8.6 * u, 69 * u, 0.5 * u, 1.4 * u);
  ctx.fillRect(10.2 * u, 68.8 * u, 0.5 * u, 1.6 * u);

  // The head, resting on its paws, and its ears.
  ctx.fillStyle = colors.gingerbread;
  circle(ctx, 7.4 * u, 70.6 * u, 1.7 * u);
  for (const [x, lift] of [
    [6.4, twitch],
    [8.4, 0],
  ] as const) {
    ctx.beginPath();
    ctx.moveTo((x - 0.7) * u, 69.5 * u);
    ctx.lineTo(x * u, (67.9 - lift * 0.8) * u);
    ctx.lineTo((x + 0.7) * u, 69.5 * u);
    ctx.fill();
  }

  // The closed eyes, two little curves.
  ctx.strokeStyle = colors.cocoa;
  ctx.lineWidth = 0.35 * u;
  ctx.beginPath();
  ctx.arc(6.8 * u, 70.4 * u, 0.5 * u, 0.2, Math.PI - 0.2);
  ctx.arc(8.1 * u, 70.4 * u, 0.5 * u, 0.2, Math.PI - 0.2);
  ctx.stroke();
}
