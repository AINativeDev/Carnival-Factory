/**
 * The cup being built on the counter: the cocoa poured in, each topping
 * dropping in on top of the last, steam once there's cocoa in it, and the cup
 * tipped over in a puddle when a wrong topping spills it.
 */
import { drum, glow } from '../../../src/northpole/diorama';
import { theme } from '../../../src/northpole/theme';
import { icon } from './icons';
import { SPILL } from './rush';

const { colors } = theme;

/** The cup's size in scene units: how round, and how tall. */
const RX = 3.8;
const HEIGHT = 6.4;
/** How long a topping takes to drop in, in ms. */
const DROP = 260;

/** The cup's body standing at (x, y): its handle, its stripes and its dark inside. */
function body(ctx: CanvasRenderingContext2D, x: number, y: number) {
  ctx.strokeStyle = colors.berry;
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.arc(x + RX + 0.3, y - HEIGHT / 2, 1.9, -Math.PI / 2, Math.PI / 2);
  ctx.stroke();
  drum(ctx, x, y, RX, HEIGHT, [colors.berry, colors.cream], 3, 0.3, colors.ink);
}

/**
 * The cup on the counter at (x, y) with `made` in it so far, the newest
 * dropping in since `newest`. With nothing in it, it stands empty.
 */
export function cup(
  ctx: CanvasRenderingContext2D,
  at: { x: number; y: number },
  made: readonly number[],
  newest: number,
  time: number,
) {
  const { x, y } = at;
  const brim = y - HEIGHT;
  const fresh = Math.max(0, 1 - (time - newest) / DROP);
  if (made.length === 1 && fresh > 0) {
    // The cocoa pouring in from the hatch above.
    ctx.fillStyle = colors.cocoa;
    ctx.fillRect(x - 0.6, brim - 14, 1.2, 14);
  }
  body(ctx, x, y);
  if (made.length > 0) {
    ctx.fillStyle = colors.cocoa;
    ctx.beginPath();
    ctx.ellipse(x, brim + fresh * 3, RX - 0.5, (RX - 0.5) / 2, 0, 0, Math.PI * 2);
    ctx.fill();
    steam(ctx, x, brim, time);
  }
  made.slice(1).forEach((item, n) => {
    const lift = n === made.length - 2 ? fresh * 10 : 0;
    icon(ctx, item, x, brim - 1.5 - n * 1.6 - lift, 0.65);
  });
}

/** Steam curling up from the cocoa at (x, y), three wisps rising in turn. */
function steam(ctx: CanvasRenderingContext2D, x: number, y: number, time: number) {
  glow(ctx, x, y - 2, 8, 0.3);
  ctx.fillStyle = colors.snowLit;
  for (let wisp = 0; wisp < 3; wisp++) {
    const rise = (((time / 2_400 + wisp * 0.37) % 1) + 1) % 1;
    ctx.globalAlpha = 0.45 * (1 - rise);
    ctx.beginPath();
    ctx.arc(x + Math.sin(rise * 6 + wisp) * 2, y - 4 - rise * 14, 1 + rise * 2, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
}

/** The spilled cup at (x, y) `since` ms after a wrong topping: tipped over, cocoa spreading, then wiped away. */
export function spill(ctx: CanvasRenderingContext2D, at: { x: number; y: number }, since: number) {
  const t = Math.min(1, since / 180);
  const fade = since < SPILL * 0.7 ? 1 : Math.max(0, 1 - (since - SPILL * 0.7) / (SPILL * 0.3));
  ctx.globalAlpha = fade;
  ctx.fillStyle = colors.cocoa;
  ctx.beginPath();
  ctx.ellipse(at.x + 4, at.y - 0.5, 3 + t * 6, 1 + t * 2, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.save();
  ctx.translate(at.x, at.y);
  ctx.rotate(t * 1.35);
  body(ctx, 0, 0);
  ctx.restore();
  ctx.globalAlpha = 1;
}
