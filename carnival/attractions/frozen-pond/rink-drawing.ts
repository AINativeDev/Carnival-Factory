/**
 * Drawing what's on the ice of Frozen Pond: the skaters, the lines the
 * visitor's skater carves, and the sparkle a figure eight earns. All in the
 * attraction's 0 to 100 units, as `scene` scales them.
 */
import { shadow } from '../../../src/northpole/diorama';
import { theme } from '../../../src/northpole/theme';
import { FADE, type Mark } from './skate';

const { colors } = theme;

/** How many times round a spin goes: unhurried, so the skater turns rather than flickers. */
const SPIN_TURNS = 1.5;

/**
 * A skater standing at (x, y). `spin`, from 0 to 1 while it's spinning, turns
 * it round: its body narrows side-on and its scarf's tail swings round it.
 */
export function drawSkater(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  scarf: string,
  spin = 0,
) {
  const angle = spin * SPIN_TURNS * Math.PI * 2;
  const width = 3.6 * Math.max(Math.abs(Math.cos(angle)), 0.4);
  shadow(ctx, x, y, 6);
  ctx.fillStyle = colors.surface;
  ctx.fillRect(x - width / 2, y - 7.2, width, 7.2);
  ctx.fillStyle = scarf;
  ctx.fillRect(x - width / 2 - 0.4, y - 7.6, width + 0.8, 1.4);
  if (spin > 0) ctx.fillRect(x + Math.sin(angle) * 3 - 0.6, y - 7.4, 1.2, 3);
  ctx.fillStyle = colors.glow;
  ctx.beginPath();
  ctx.arc(x, y - 9.4, 2, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = scarf;
  ctx.beginPath();
  ctx.arc(x, y - 10.3, 2, Math.PI, 0);
  ctx.fill();
  ctx.fillStyle = colors.muted;
  ctx.fillRect(x - width / 2 - 0.3, y, width + 0.6, 0.7);
}

/** The lines the visitor's skater carved, each fading as it ages. */
export function drawTrail(ctx: CanvasRenderingContext2D, trail: readonly Mark[], time: number) {
  ctx.save();
  ctx.strokeStyle = colors.snowLit;
  ctx.lineWidth = 0.7;
  ctx.lineCap = 'round';
  for (let index = 1; index < trail.length; index++) {
    const before = trail.at(index - 1);
    const mark = trail.at(index);
    if (!before || !mark) continue;
    ctx.globalAlpha = 0.85 * Math.max(0, 1 - (time - mark.at) / FADE);
    ctx.beginPath();
    ctx.moveTo(before.x, before.y);
    ctx.lineTo(mark.x, mark.y);
    ctx.stroke();
  }
  ctx.restore();
}

/** A ring of little gold stars over the skater, rising as `brightness` fades from 1 to 0. */
export function drawSparkle(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  brightness: number,
) {
  if (brightness <= 0) return;
  ctx.save();
  ctx.globalAlpha = brightness;
  ctx.fillStyle = colors.gold;
  const rise = (1 - brightness) * 6;
  for (let i = 0; i < 6; i++) {
    const around = (i / 6) * Math.PI * 2;
    const sx = x + Math.cos(around) * 7;
    const sy = y - 8 - rise + Math.sin(around) * 4;
    const r = 1.4;
    ctx.beginPath();
    ctx.moveTo(sx, sy - r);
    ctx.lineTo(sx + r * 0.3, sy - r * 0.3);
    ctx.lineTo(sx + r, sy);
    ctx.lineTo(sx + r * 0.3, sy + r * 0.3);
    ctx.lineTo(sx, sy + r);
    ctx.lineTo(sx - r * 0.3, sy + r * 0.3);
    ctx.lineTo(sx - r, sy);
    ctx.lineTo(sx - r * 0.3, sy - r * 0.3);
    ctx.closePath();
    ctx.fill();
  }
  ctx.restore();
}
