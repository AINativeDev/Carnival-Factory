/**
 * The ginger cat asleep on the crate by the mail slot: it twitches an ear and
 * flicks its tail each time a letter lands on the pile, worked out from `time`.
 */
import { theme } from '../../../src/northpole/theme';
import { circle, type Ctx } from './brushes';
import { wrap } from './motion';

const { colors } = theme;

/** How long the twitch lasts after a letter lands, in milliseconds. */
export const FLICK = 600;

/** A letter reaches the pile this long after it drops through the slot. */
const LANDS_AFTER = 800;
/** Letters drop evenly, four to a round, so the pile sees one every 3 seconds. */
const EVERY = 3_000;

/** How hard the ear and tail flick, 0 to 1, at `time`: a quick wave that fades. */
export function flickOf(time: number): number {
  const since = wrap(time - LANDS_AFTER, EVERY);
  if (since >= FLICK) return 0;
  const t = since / FLICK;
  return Math.sin(t * Math.PI * 2) ** 2 * (1 - t);
}

/** The cat curled on the crate's top edge, its breathing slow and its ear and tail flicking. */
export function drawCat(ctx: Ctx, u: number, time: number) {
  const flick = flickOf(time);
  const breath = Math.sin(time / 700) * 0.25;
  const x = 11.8;
  const y = 71.6;

  ctx.fillStyle = colors.gingerbread;
  ctx.beginPath();
  ctx.ellipse(
    x * u,
    (y - 1.6 - breath * 0.3) * u,
    3 * u,
    (1.8 + breath * 0.2) * u,
    0,
    0,
    Math.PI * 2,
  );
  ctx.fill();
  circle(ctx, (x - 2.2) * u, (y - 2) * u, 1.3 * u);

  // The ear on top of the head tips forward with each flick.
  ctx.beginPath();
  ctx.moveTo((x - 3.2) * u, (y - 3 + flick * 0.5) * u);
  ctx.lineTo((x - 3.1 - flick * 0.5) * u, (y - 4.6 + flick * 0.9) * u);
  ctx.lineTo((x - 2.1) * u, (y - 3.1) * u);
  ctx.fill();

  // The tail hangs over the crate's edge, and lifts once with the flick.
  ctx.strokeStyle = colors.gingerbread;
  ctx.lineWidth = 0.9 * u;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo((x + 2.8) * u, (y - 1.2) * u);
  ctx.quadraticCurveTo(
    (x + 4.6) * u,
    (y - 1 - flick * 3) * u,
    (x + 3.2) * u,
    (y + 1 - flick * 2.5) * u,
  );
  ctx.stroke();

  // Shut eye: a tiny line.
  ctx.strokeStyle = colors.cocoa;
  ctx.lineWidth = 0.3 * u;
  ctx.beginPath();
  ctx.moveTo((x - 2.9) * u, (y - 1.9) * u);
  ctx.lineTo((x - 2.2) * u, (y - 1.9) * u);
  ctx.stroke();
}
