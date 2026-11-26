/**
 * The ginger cat asleep on the crate by the mail slot: it twitches an ear and
 * flicks its tail once each time a letter lands on the pile, and its red
 * collar's gold bell glints at each flick, worked out from
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

/** How long the bell's glint lasts around the tail's peak, in milliseconds. */
const GLINT = 180;

/** The bell's glint, 0 to 1: one short flash at the peak of each tail flick. */
export function glintAt(time: number): number {
  const since = wrap(time - LANDING, SLOT);
  const off = Math.abs(since - TWITCH / 2);
  return off >= GLINT / 2 ? 0 : 1 - off / (GLINT / 2);
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

  // The small red collar round its neck, with a tiny gold bell that glints.
  ctx.strokeStyle = colors.berry;
  ctx.lineWidth = 0.5 * u;
  ctx.beginPath();
  ctx.moveTo(8.9 * u, 69 * u);
  ctx.quadraticCurveTo(9.5 * u, 70.4 * u, 8.9 * u, 71.7 * u);
  ctx.stroke();
  ctx.fillStyle = colors.gold;
  circle(ctx, 9.1 * u, 71.8 * u, 0.45 * u);
  const glint = glintAt(time);
  if (glint > 0) {
    ctx.strokeStyle = colors.snow;
    ctx.lineWidth = 0.2 * u;
    const reach = (0.6 + glint * 0.8) * u;
    ctx.beginPath();
    ctx.moveTo(9.1 * u - reach, 71.8 * u);
    ctx.lineTo(9.1 * u + reach, 71.8 * u);
    ctx.moveTo(9.1 * u, 71.8 * u - reach);
    ctx.lineTo(9.1 * u, 71.8 * u + reach);
    ctx.stroke();
  }

  // The closed eyes, two little curves.
  ctx.strokeStyle = colors.cocoa;
  ctx.lineWidth = 0.35 * u;
  ctx.beginPath();
  ctx.arc(6.8 * u, 70.4 * u, 0.5 * u, 0.2, Math.PI - 0.2);
  ctx.arc(8.1 * u, 70.4 * u, 0.5 * u, 0.2, Math.PI - 0.2);
  ctx.stroke();
}
