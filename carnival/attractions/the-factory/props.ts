/**
 * The little folk and marks the tour's scenes are built from: a spot on the
 * snow found from where it is on screen, a person in a winter coat, the
 * factory's agent as a small lit robot, a tick for a check that passed, and a
 * quiet sign over a part of the scene.
 */
import { glow, shadow } from '../../../src/northpole/diorama';
import { theme } from '../../../src/northpole/theme';
import { eyebrow, words } from './text';
import { panel } from './ui';

const { colors } = theme;

/** The spot on the slab that is at `x`, `y` on screen: the inverse of `iso` on the ground. */
export function groundAt(x: number, y: number) {
  return { gx: (x - 50 + 2 * (y - 66)) / 2, gy: (2 * (y - 66) - (x - 50)) / 2 };
}

/** A person in a `coat` standing on `x`, `y`, with a bobble hat and a scarf. */
export function person(ctx: CanvasRenderingContext2D, x: number, y: number, coat: string) {
  shadow(ctx, x, y, 6);
  ctx.fillStyle = coat;
  ctx.beginPath();
  ctx.moveTo(x - 2.2, y);
  ctx.lineTo(x - 1.4, y - 6);
  ctx.lineTo(x + 1.4, y - 6);
  ctx.lineTo(x + 2.2, y);
  ctx.fill();
  // The coat's shaded right half, lit from the upper left.
  ctx.fillStyle = colors.shadow;
  ctx.globalAlpha = 0.25;
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x, y - 6);
  ctx.lineTo(x + 1.4, y - 6);
  ctx.lineTo(x + 2.2, y);
  ctx.fill();
  ctx.globalAlpha = 1;
  ctx.fillStyle = colors.gold;
  ctx.fillRect(x - 1.6, y - 6.4, 3.2, 0.9);
  ctx.fillStyle = colors.cream;
  ctx.beginPath();
  ctx.arc(x, y - 7.6, 1.8, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = colors.berry;
  ctx.beginPath();
  ctx.arc(x, y - 8.4, 1.8, Math.PI, 0);
  ctx.fill();
  ctx.fillStyle = colors.snow;
  ctx.beginPath();
  ctx.arc(x, y - 10.4, 0.7, 0, Math.PI * 2);
  ctx.fill();
}

/**
 * The factory's agent: a small robot on `x`, `y`, `k` times its full size,
 * its lit left side and shaded right, eyes glowing mint and a chest light in
 * `light`, bobbing gently at `time`.
 */
export function agent(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  time: number,
  k = 1,
  light: string = colors.gold,
) {
  shadow(ctx, x, y, 7 * k);
  ctx.save();
  ctx.translate(x, y + Math.sin(time / 500 + x) * 0.4 * k);
  ctx.scale(k, k);
  ctx.fillStyle = colors.slab;
  ctx.fillRect(-2.4, -5, 2.4, 5);
  ctx.fillStyle = colors.slabShade;
  ctx.fillRect(0, -5, 2.4, 5);
  ctx.fillStyle = light;
  ctx.beginPath();
  ctx.arc(-0.4, -3, 0.8, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = colors.ice;
  ctx.beginPath();
  ctx.roundRect(-2.8, -9.6, 5.6, 4.6, 1.2);
  ctx.fill();
  ctx.fillStyle = colors.mountainFar;
  ctx.globalAlpha = 0.35;
  ctx.fillRect(0.6, -9.2, 2, 3.8);
  ctx.globalAlpha = 1;
  ctx.fillStyle = colors.night;
  ctx.fillRect(-2, -8.6, 4, 2.4);
  ctx.fillStyle = colors.mint;
  ctx.fillRect(-1.5, -7.9, 0.9, 0.9);
  ctx.fillRect(0.6, -7.9, 0.9, 0.9);
  ctx.fillStyle = colors.cocoa;
  ctx.fillRect(-0.2, -11.2, 0.4, 1.6);
  ctx.fillStyle = colors.gold;
  ctx.beginPath();
  ctx.arc(0, -11.4, 0.6, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

/** A tick in a mint disc at `x`, `y`, `r` across, for a check that passed, shown at `strength` from 0 to 1. */
export function tick(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, strength = 1) {
  if (strength <= 0) return;
  glow(ctx, x, y, r * 3, strength);
  ctx.globalAlpha = strength;
  ctx.fillStyle = colors.mint;
  ctx.beginPath();
  ctx.arc(x, y, r * (0.8 + 0.2 * strength), 0, Math.PI * 2);
  ctx.fill();
  words(ctx, '✓', x, y + 0.1, r * 1.5, colors.night);
  ctx.globalAlpha = 1;
}

/** A quiet sign over part of the scene: `text` as a spaced-out capital label on a soft night pill. */
export function sign(ctx: CanvasRenderingContext2D, text: string, x: number, y: number) {
  const w = text.length * 1.85 + 2.4;
  panel(ctx, { x: x - w / 2, y: y - 2.4, w, h: 4.8 }, 0.85);
  eyebrow(ctx, text, x, y + 0.1, colors.snowLit, 'center', w - 2);
}
