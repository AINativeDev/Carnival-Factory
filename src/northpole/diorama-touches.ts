/**
 * The small touches that make a diorama feel like the North Pole at dusk: cool
 * shadows on the snow, warm pools of light, string lights that shimmer slowly
 * and little snowy pines. Kept apart from the ground and the round shapes
 * because squares sprinkle these over everything they build. Like the rest of
 * the diorama, it imports nothing but `./theme`, since every booth may import it.
 */
import type { Point } from './diorama-ground';
import { theme } from './theme';

const { colors } = theme;

/** A cool, soft shadow on the snow, cast a little to the lower right. */
export function shadow(ctx: CanvasRenderingContext2D, x: number, y: number, width: number) {
  ctx.fillStyle = colors.shadow;
  ctx.globalAlpha = 0.28;
  ctx.beginPath();
  ctx.ellipse(x + width * 0.08, y, width / 2, width / 5, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = 1;
}

/** A warm pool of light, as a lamp, a window or a fire throws, at `strength` from 0 to 1. */
export function glow(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  radius: number,
  strength = 1,
) {
  ctx.fillStyle = colors.lantern;
  for (const r of [radius, radius * 0.65, radius * 0.35]) {
    ctx.globalAlpha = 0.13 * strength;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
}

/** How bright string light `n` is at `time`: a slow, gentle shimmer, never a flash. */
function shimmer(time: number, n: number) {
  return 0.8 + 0.2 * Math.sin(time / 900 + n * 1.9);
}

/** String lights hung at `points`, warm bulbs in `colours`, shimmering slowly. */
export function stringLights(
  ctx: CanvasRenderingContext2D,
  points: readonly Point[],
  colours: readonly string[],
  time: number,
) {
  ctx.strokeStyle = colors.ink;
  ctx.globalAlpha = 0.5;
  ctx.lineWidth = 0.3;
  ctx.beginPath();
  points.forEach((p, n) => {
    if (n) ctx.lineTo(p.x, p.y);
    else ctx.moveTo(p.x, p.y);
  });
  ctx.stroke();
  points.forEach((p, n) => {
    const strength = shimmer(time, n);
    ctx.fillStyle = colors.glow;
    ctx.globalAlpha = 0.3 * strength;
    ctx.beginPath();
    ctx.arc(p.x, p.y, 1.8, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = strength;
    // With no colours given, the bulb keeps the glow's colour.
    const bulb = colours.at(n % colours.length);
    if (bulb !== undefined) ctx.fillStyle = bulb;
    ctx.beginPath();
    ctx.arc(p.x, p.y, 0.75, 0, Math.PI * 2);
    ctx.fill();
  });
  ctx.globalAlpha = 1;
}

/** A pine's three tiers, as fractions of its height: where each starts, how wide it is, and its tip. */
const TIERS: readonly (readonly [base: number, width: number, top: number])[] = [
  [0.15, 0.32, 0.55],
  [0.4, 0.26, 0.78],
  [0.62, 0.18, 1],
];

/** A little snowy pine standing on (x, y), `h` tall. */
export function pine(ctx: CanvasRenderingContext2D, x: number, y: number, h: number) {
  shadow(ctx, x, y, h * 0.6);
  ctx.fillStyle = colors.wood;
  ctx.fillRect(x - h * 0.04, y - h * 0.15, h * 0.08, h * 0.15);
  for (const [base, width, top] of TIERS) {
    ctx.fillStyle = colors.pine;
    ctx.beginPath();
    ctx.moveTo(x - width * h, y - base * h);
    ctx.lineTo(x, y - top * h);
    ctx.lineTo(x, y - base * h);
    ctx.fill();
    ctx.fillStyle = colors.pineDark;
    ctx.beginPath();
    ctx.moveTo(x + width * h, y - base * h);
    ctx.lineTo(x, y - top * h);
    ctx.lineTo(x, y - base * h);
    ctx.fill();
    ctx.fillStyle = colors.snow;
    ctx.beginPath();
    ctx.moveTo(x - width * h * 0.45, y - (top - (top - base) * 0.55) * h);
    ctx.lineTo(x, y - top * h);
    ctx.lineTo(x + width * h * 0.3, y - (top - (top - base) * 0.6) * h);
    ctx.fill();
  }
}
