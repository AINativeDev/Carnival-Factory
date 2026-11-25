/**
 * The owner's logo, a white cube of interlocking blocks on a dark backdrop,
 * hung on the back wall like a sign and turned by `spin`.
 */
import { theme } from '../../../src/northpole/theme';
import type { Ctx } from './brushes';
import { PLAQUE } from './spin';

const { colors } = theme;

/** The cube's corners, as angles from straight up, in steps of a sixth of a turn. */
function corner(index: number, r: number): [number, number] {
  const a = (index * Math.PI) / 3;
  return [Math.sin(a) * r, -Math.cos(a) * r];
}

/** One straight dark gap between blocks, from `a` to `b`. */
function gap(ctx: Ctx, a: [number, number], b: [number, number]) {
  ctx.moveTo(a[0], a[1]);
  ctx.lineTo(b[0], b[1]);
}

/** The logo on its plaque, `angle` radians round from upright. */
export function drawLogo(ctx: Ctx, u: number, angle: number) {
  const { x, y, w, h } = PLAQUE;
  ctx.fillStyle = colors.cocoa;
  ctx.fillRect((x - 0.8) * u, (y - 0.8) * u, (w + 1.6) * u, (h + 1.6) * u);
  ctx.fillStyle = colors.night;
  ctx.fillRect(x * u, y * u, w * u, h * u);

  ctx.save();
  ctx.translate((x + w / 2) * u, (y + h / 2) * u);
  ctx.rotate(angle);
  const r = 5.6 * u;
  ctx.fillStyle = colors.snow;
  ctx.beginPath();
  for (let i = 0; i < 6; i++) {
    const [cx, cy] = corner(i, r);
    if (i === 0) ctx.moveTo(cx, cy);
    else ctx.lineTo(cx, cy);
  }
  ctx.closePath();
  ctx.fill();

  // The gaps between the blocks: a Y from the middle, and two steps that interlock.
  ctx.strokeStyle = colors.night;
  ctx.lineWidth = 0.7 * u;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.beginPath();
  const mid: [number, number] = [0, 0];
  gap(ctx, mid, corner(1, r * 0.95));
  gap(ctx, mid, corner(3, r * 0.5));
  gap(ctx, corner(3, r * 0.5), corner(4, r * 0.95));
  gap(ctx, mid, corner(5, r * 0.5));
  gap(ctx, corner(5, r * 0.5), [corner(5, r * 0.5)[0] + r * 0.5, corner(5, r * 0.5)[1] - r * 0.3]);
  gap(ctx, [-r * 0.5, -r * 0.1], [-r * 0.5, -r * 0.45]);
  ctx.stroke();
  ctx.restore();
}
