/**
 * The check lamp and the "toys today" sign by the door: what they show at
 * `time`, and drawing them on the back wall.
 */
import { theme } from '../../../src/northpole/theme';
import { circle, words, type Ctx } from './brushes';
import { lettersAt } from './letters';
import { ease, wrap } from './motion';

const { colors } = theme;

/** The toys the sign already counts when the page opens. */
export const TOYS_AT_DAWN = 120;

/** The sign counts one more toy every `TALLY` milliseconds. */
export const TALLY = 3_000;

/** How long the number bounces after it ticks up, in milliseconds. */
export const BOUNCE = 500;

/** How many toys the sign shows at `time`: one more every `TALLY`. */
export function toysMade(time: number): number {
  return TOYS_AT_DAWN + Math.floor(Math.max(0, time) / TALLY);
}

/** How high the number hops, 0 to 1, `since` ms after it last ticked: up fast, then settling. */
export function bounceOf(since: number): number {
  if (since < 0 || since >= BOUNCE) return 0;
  const t = since / BOUNCE;
  return Math.abs(Math.sin(t * Math.PI * 2)) * (1 - t);
}

/** How green the check lamp is: 0 amber, 1 green while a toy has passed its check. */
export function lampAt(time: number): number {
  let green = 0;
  for (const letter of lettersAt(time)) {
    if (!letter.toy) continue;
    // Passed at 6.8 s, and back to amber once the toy has gone into the sack.
    const on = ease((letter.age - 6_800) / 300) * (1 - ease((letter.age - 8_000) / 300));
    green = Math.max(green, on);
  }
  return green;
}

/** The check lamp on the wall, amber until a toy passes. */
export function drawCheckLamp(ctx: Ctx, u: number, time: number) {
  ctx.fillStyle = colors.cocoa;
  ctx.fillRect(66.4 * u, 27 * u, 1.2 * u, 4 * u);
  const green = lampAt(time);
  ctx.fillStyle = colors.gold;
  circle(ctx, 67 * u, 32 * u, 2.4 * u);
  ctx.globalAlpha = green;
  ctx.fillStyle = colors.aurora;
  circle(ctx, 67 * u, 32 * u, 2.4 * u);
  ctx.globalAlpha = 1;
}

/** The wooden sign by the door, counting the toys made today. */
export function drawToySign(ctx: Ctx, u: number, time: number) {
  const hop = bounceOf(wrap(time, TALLY)) * 1.8;
  ctx.fillStyle = colors.cocoa;
  ctx.fillRect(65 * u, 34.5 * u, 0.7 * u, 2 * u);
  ctx.fillRect(76.3 * u, 34.5 * u, 0.7 * u, 2 * u);
  ctx.fillStyle = colors.wood;
  ctx.fillRect(63 * u, 36 * u, 16 * u, 10 * u);
  ctx.strokeStyle = colors.gold;
  ctx.lineWidth = 0.5 * u;
  ctx.strokeRect(63.8 * u, 36.8 * u, 14.4 * u, 8.4 * u);
  ctx.fillStyle = colors.cream;
  words(ctx, 'toys today', 71 * u, 39 * u, 2.4 * u, 12 * u);
  ctx.fillStyle = colors.glow;
  words(ctx, String(toysMade(time)), 71 * u, (42.6 - hop) * u, 3.8 * u, 12 * u);
}
