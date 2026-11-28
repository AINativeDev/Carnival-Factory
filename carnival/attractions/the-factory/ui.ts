/**
 * The Factory's surfaces and buttons, in the language every Tessl place shares:
 * soft night panels with a shadow and no outline, one gold primary that
 * breathes, quiet snow secondaries, and underlined text for the rest. Each
 * button is drawn from its `Button` in buttons.ts, so what a tap hits and what
 * the eye sees are the same box. All of it is in the drawing's 0 to 100 units.
 */
import { theme } from '../../../src/northpole/theme';
import type { Button } from './buttons';
import type { Box } from './rules';
import { words } from './text';

const { colors } = theme;

/** How round every panel and button is. */
const RADIUS = 2.2;

/** How long a new line of text takes to ease in, in ms. */
const EASE_IN = 300;

/** How far text `since` ms old has eased in, from 0 to 1. */
export const easeIn = (since: number) => Math.min(1, Math.max(0, since / EASE_IN));

/**
 * How big a thing that appeared `since` ms ago is drawn, `delay` ms behind the
 * first: from nothing, a little past full size, then settling (an ease out with
 * overshoot, over 450 ms).
 */
export function popScale(since: number, delay = 0): number {
  const t = Math.min(1, Math.max(0, (since - delay) / 450));
  const back = 1.70158;
  const u = t - 1;
  return 1 + (back + 1) * u * u * u + back * u * u;
}

/** Draws `paint` scaled by `popScale` round its foot at `x`, `y`, so it pops up from the ground. */
export function popIn(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  since: number,
  delay: number,
  paint: () => void,
) {
  const k = popScale(since, delay);
  if (k <= 0.01) return;
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(k, k);
  ctx.translate(-x, -y);
  paint();
  ctx.restore();
}

/** A rounded box filled with `fill` at `alpha`, a soft cool shadow under it and no outline. */
export function panel(
  ctx: CanvasRenderingContext2D,
  box: Box,
  alpha = 0.85,
  fill: string = colors.night,
) {
  // Kept within whatever fade the caller has set, such as the end card rising in.
  const outer = ctx.globalAlpha;
  ctx.globalAlpha = outer * alpha * 0.35;
  ctx.fillStyle = colors.shadow;
  ctx.beginPath();
  ctx.roundRect(box.x, box.y + 0.6, box.w, box.h, RADIUS);
  ctx.fill();
  ctx.globalAlpha = outer * alpha;
  ctx.fillStyle = fill;
  ctx.beginPath();
  ctx.roundRect(box.x, box.y, box.w, box.h, RADIUS);
  ctx.fill();
  ctx.globalAlpha = outer;
}

/** How far the primary's glow has breathed out at `time`, from 0 to 1 and back every 2 s. */
export const breath = (time: number) => (1 - Math.cos((time / 2_000) * Math.PI * 2)) / 2;

/** The one primary on a screen: night words on gold, breathing a soft glow. */
export function primary(ctx: CanvasRenderingContext2D, target: Button, time: number, under = '') {
  const { box } = target;
  const outer = ctx.globalAlpha;
  // Three soft layers, wider and fainter outwards, so the glow fades rather than edges the button.
  ctx.fillStyle = colors.lantern;
  for (const layer of [1, 2, 3]) {
    const spread = layer * (0.5 + breath(time) * 0.5);
    ctx.globalAlpha = outer * (0.04 + breath(time) * 0.05);
    ctx.beginPath();
    ctx.roundRect(
      box.x - spread,
      box.y - spread,
      box.w + spread * 2,
      box.h + spread * 2,
      RADIUS + spread,
    );
    ctx.fill();
  }
  ctx.globalAlpha = outer;
  panel(ctx, box, 1, colors.gold);
  const middle = box.y + box.h / 2;
  const room = box.w - 4;
  if (!under) {
    words(ctx, target.label, box.x + box.w / 2, middle + 0.2, 3.6, colors.night, 'center', room);
    return;
  }
  words(ctx, target.label, box.x + box.w / 2, middle - 1.6, 3.6, colors.night, 'center', room);
  ctx.globalAlpha = outer * 0.75;
  words(ctx, under, box.x + box.w / 2, middle + 2.8, 3, colors.night, 'center', room);
  ctx.globalAlpha = outer;
}

/** A secondary: night words on snow, no glow. */
export function secondary(ctx: CanvasRenderingContext2D, target: Button) {
  const { box } = target;
  panel(ctx, box, 0.92, colors.snowLit);
  const middle = box.y + box.h / 2 + 0.2;
  words(ctx, target.label, box.x + box.w / 2, middle, 3, colors.night, 'center', box.w - 2);
}

/** A tertiary: plain underlined words in the middle of its box, gold for a link out. */
export function tertiary(
  ctx: CanvasRenderingContext2D,
  target: Button,
  color: string = colors.snowLit,
) {
  const { box } = target;
  const x = box.x + box.w / 2;
  const y = box.y + box.h / 2;
  const wide = words(ctx, target.label, x, y, 3, color, 'center', box.w);
  ctx.fillStyle = color;
  ctx.fillRect(x - wide / 2, y + 2, wide, 0.3);
}
