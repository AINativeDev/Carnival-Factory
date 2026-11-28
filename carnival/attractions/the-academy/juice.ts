/**
 * The little bit of juice on the big moments (a squashed bug, a lamp lit at
 * the gate, the gate swinging open): a short shake that dies away, a soft
 * ring that spreads and fades, and a gentle burst of particles. All from how
 * long ago the moment was, so they replay the same on every frame. None of
 * it flashes: no brightness swings across the square, only small things
 * moving and fading (the flashing rule in docs/style.md).
 */
import { theme } from '../../../src/northpole/theme';
import { scatter, star } from './kit';

const { colors } = theme;

/** How far a shake `age` ms old moves things, `strength` at its strongest, gone after `lasts` ms. */
export function shake(age: number, strength: number, lasts = 320): { x: number; y: number } {
  if (age < 0 || age >= lasts) return { x: 0, y: 0 };
  const left = 1 - age / lasts;
  return {
    x: Math.sin(age / 18) * strength * left,
    y: Math.cos(age / 23) * strength * 0.6 * left,
  };
}

/** A soft ring round (`x`, `y`), `age` ms old, spreading out to `reach` as it fades. */
export function ring(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  age: number,
  reach: number,
  colour: string,
) {
  const t = age / 600;
  if (t < 0 || t >= 1) return;
  ctx.strokeStyle = colour;
  ctx.globalAlpha = 0.5 * (1 - t);
  ctx.lineWidth = 0.6 * (1 - t) + 0.15;
  ctx.beginPath();
  ctx.arc(x, y, 1 + reach * Math.sqrt(t), 0, Math.PI * 2);
  ctx.stroke();
  ctx.globalAlpha = 1;
}

/** How a burst looks: how many bits, how far they fly, their colours, and whether they're stars. */
interface Burst {
  count: number;
  reach: number;
  colours: readonly string[];
  stars?: boolean;
  /** A different scatter for each burst, so two never fly the same way. */
  seed?: number;
}

/**
 * A gentle burst from (`x`, `y`), `age` ms old: bits fly out, slow down, drift
 * a little down and fade, gone within 800 ms.
 */
export function burst(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  age: number,
  look: Burst,
) {
  const t = age / 800;
  if (t < 0 || t >= 1) return;
  const seed = look.seed ?? 0;
  const out = 1 - (1 - t) ** 3;
  for (let n = 0; n < look.count; n++) {
    const a = (n / look.count) * Math.PI * 2 + scatter(n + seed) * 0.8;
    const far = look.reach * (0.6 + scatter(n + seed + 30) * 0.4) * out;
    const px = x + Math.cos(a) * far;
    const py = y + Math.sin(a) * far * 0.7 + t * t * 4;
    ctx.globalAlpha = 1 - t;
    if (look.stars) star(ctx, px, py, 1.1 * (1 - t * 0.5));
    else {
      ctx.fillStyle = look.colours.at(n % look.colours.length) ?? colors.gold;
      ctx.beginPath();
      ctx.arc(px, py, 0.7 * (1 - t * 0.5), 0, Math.PI * 2);
      ctx.fill();
    }
  }
  ctx.globalAlpha = 1;
}
