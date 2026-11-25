/**
 * What the map draws over a plot to mark it: sparkles round a booth that just
 * landed, the glow round the plot you stand at, and the ring of lights and the
 * beam with its arrow over a picked one. None of them flash
 * (docs/specs/checks-and-tests.md), and each fades with its `strength`.
 */
import { bulb, corners, diamond, glow, middle, quad } from './brushes';
import { LIGHTS } from './island';
import { FREE_SPOT_SIGN } from './open-plot';
import { inTurn } from './rounds';
import { PAVILION, STALL } from './stall-plan';
import { theme } from './theme';
import { hash, type Plot } from './world';

const { colors } = theme;

/** How long a new booth's sparkles last, in milliseconds. */
export const SPARKLE_TIME = 2600;

/**
 * A short burst of gentle sparkles rising round a booth that just landed,
 * `age` milliseconds in. Each one fades in and out smoothly, so nothing flashes.
 */
export function drawSparkles(ctx: CanvasRenderingContext2D, plot: Plot, age: number) {
  if (age < 0 || age >= SPARKLE_TIME) return;
  const { x, y } = middle(plot);
  const along = age / SPARKLE_TIME;
  const fade = Math.sin(Math.PI * along);
  const tints = [colors.gold, colors.glow, colors.snow] as const;
  ctx.save();
  for (let n = 0; n < 14; n++) {
    const seed = hash(plot.number, n, 9);
    const angle = seed * Math.PI * 2;
    const reach = 30 + 40 * hash(n, plot.number, 10);
    const at = {
      x: x + Math.cos(angle) * reach * (0.6 + 0.4 * along),
      y: y - 30 - along * (60 + 50 * seed) + Math.sin(angle) * reach * 0.3,
    };
    const r = 3 + 3 * hash(n, 11);
    ctx.globalAlpha = 0.75 * fade;
    ctx.fillStyle = inTurn(tints, n);
    ctx.beginPath();
    ctx.moveTo(at.x, at.y - r * 1.8);
    ctx.lineTo(at.x + r * 0.45, at.y);
    ctx.lineTo(at.x, at.y + r * 1.8);
    ctx.lineTo(at.x - r * 0.45, at.y);
    ctx.closePath();
    ctx.moveTo(at.x - r * 1.8, at.y);
    ctx.lineTo(at.x, at.y + r * 0.45);
    ctx.lineTo(at.x + r * 1.8, at.y);
    ctx.lineTo(at.x, at.y - r * 0.45);
    ctx.closePath();
    ctx.fill();
  }
  ctx.restore();
}

/** A glow round a plot, for the one you are standing at or the one a link opened on. */
export function drawPlotGlow(ctx: CanvasRenderingContext2D, plot: Plot, strength: number) {
  const c = corners(plot);
  ctx.save();
  ctx.globalAlpha = 0.6 * strength;
  ctx.strokeStyle = colors.gold;
  ctx.lineWidth = 4;
  ctx.lineJoin = 'round';
  diamond(ctx, c, 0);
  ctx.stroke();
  ctx.restore();
  const { x, y } = middle(plot);
  const tall =
    plot.kind === 'attraction'
      ? PAVILION.wall
      : plot.kind === 'booth'
        ? STALL.wall
        : FREE_SPOT_SIGN.post;
  glow(ctx, x, y - tall / 2, tall, strength);
}

/**
 * A ring of string lights round a picked plot, on the snow, in steady warm
 * colours that never flash. `strength` fades it in and out.
 */
export function drawSelectionRing(ctx: CanvasRenderingContext2D, plot: Plot, strength: number) {
  if (strength <= 0) return;
  const c = corners(plot);
  const edges = [
    [c.top, c.right],
    [c.right, c.bottom],
    [c.bottom, c.left],
    [c.left, c.top],
  ] as const;
  ctx.save();
  ctx.globalAlpha = 0.5 * strength;
  ctx.strokeStyle = colors.cocoa;
  ctx.lineWidth = 1.5;
  diamond(ctx, c, 0);
  ctx.stroke();
  ctx.restore();
  let n = 0;
  for (const [from, to] of edges)
    for (let k = 0; k < 8; k++) {
      const at = {
        x: from.x + ((to.x - from.x) * k) / 8,
        y: from.y + ((to.y - from.y) * k) / 8,
      };
      bulb(ctx, at.x, at.y, inTurn(LIGHTS, n++), strength);
    }
  ctx.globalAlpha = 1;
}

/**
 * What marks a picked plot over everything in front of it: a soft beam of
 * light rising from it, seen even when something taller hides the stall, and
 * an arrow over `top`, the top of what stands on it, bouncing by `bounce`.
 */
export function drawSelectionBeam(
  ctx: CanvasRenderingContext2D,
  plot: Plot,
  top: number,
  strength: number,
  bounce: number,
) {
  if (strength <= 0) return;
  const c = corners(plot);
  const { x, y } = middle(plot);
  const height = y - top + 160;
  ctx.save();
  const beam = ctx.createLinearGradient(0, y, 0, y - height);
  beam.addColorStop(0, colors.glow);
  beam.addColorStop(1, `${colors.glow}00`);
  ctx.fillStyle = beam;
  ctx.globalAlpha = 0.3 * strength;
  ctx.beginPath();
  ctx.moveTo(c.left.x + 12, c.left.y);
  ctx.lineTo(c.bottom.x, c.bottom.y);
  ctx.lineTo(c.right.x - 12, c.right.y);
  ctx.lineTo(c.right.x - 26, y - height);
  ctx.lineTo(c.left.x + 26, y - height);
  ctx.closePath();
  ctx.fill();
  // The arrow, pointing down at the sign.
  const tip = top - 8 - bounce;
  ctx.globalAlpha = strength;
  ctx.fillStyle = colors.cocoa;
  quad(ctx, [
    { x: x - 15, y: tip - 25 },
    { x: x + 15, y: tip - 25 },
    { x, y: tip + 2 },
  ]);
  ctx.fill();
  ctx.fillStyle = colors.gold;
  quad(ctx, [
    { x: x - 11, y: tip - 23 },
    { x: x + 11, y: tip - 23 },
    { x, y: tip - 2 },
  ]);
  ctx.fill();
  ctx.restore();
}
