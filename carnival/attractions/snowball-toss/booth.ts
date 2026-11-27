/**
 * The game booth around the targets: two back walls meeting behind with a
 * lamp in the corner and striped awnings, candy-cane prizes swaying from the
 * awnings, a pennant on the roof that streams out with the wind, and the
 * counter at the front the snowballs are thrown from.
 */
import { box, glow, iso, shadow } from '../../../src/northpole/diorama';
import { theme } from '../../../src/northpole/theme';

const { colors } = theme;

/** How tall the booth's back walls are. */
const WALL = 34;

/** The booth: two back walls meeting behind, a lamp in the corner, and striped awnings. */
export function booth(ctx: CanvasRenderingContext2D) {
  shadow(ctx, 53, 70, 80);
  box(ctx, -21, -21, 3, 40, WALL, colors.slab, colors.surface, colors.night);
  box(ctx, -21, -21, 40, 3, WALL, colors.slab, colors.surface, colors.night);
  const lamp = iso(-17, -17, 24);
  glow(ctx, lamp.x, lamp.y, 24, 0.8);
  ctx.fillStyle = colors.lantern;
  ctx.beginPath();
  ctx.arc(lamp.x, lamp.y, 1.4, 0, Math.PI * 2);
  ctx.fill();
  for (const side of [0, 1]) {
    for (let i = 0; i < 7; i++) {
      const a0 = -18 + i * 5.3;
      const a1 = a0 + 5.3;
      // Along one wall or the other: `a` runs along it, out from it to the front.
      const p = (a: number, out: number, z: number) =>
        side ? iso(-18 + out, a, z) : iso(a, -18 + out, z);
      ctx.fillStyle = i % 2 ? colors.snow : colors.pine;
      const points = [p(a0, 0, WALL), p(a1, 0, WALL), p(a1, 6, WALL - 5), p(a0, 6, WALL - 5)];
      ctx.beginPath();
      for (const q of points) ctx.lineTo(q.x, q.y);
      ctx.fill();
    }
  }
}

/** Candy-cane prizes hanging from the awning, swaying gently. */
export function prizes(ctx: CanvasRenderingContext2D, time: number) {
  ctx.strokeStyle = colors.berry;
  ctx.lineWidth = 1.3;
  for (const [n, hook] of [iso(-16, 12, WALL - 6), iso(12, -16, WALL - 6)].entries()) {
    const sway = Math.sin(time / 600 + n * 40) * 1.6;
    ctx.beginPath();
    ctx.moveTo(hook.x + sway, hook.y + 11);
    ctx.lineTo(hook.x, hook.y);
    ctx.arc(hook.x - 2.2, hook.y, 2.2, 0, Math.PI, true);
    ctx.stroke();
  }
}

/** The pennant on the booth's back corner, streaming out as far and as fast as the wind blows. */
export function pennant(ctx: CanvasRenderingContext2D, wind: number, time: number) {
  const foot = iso(-21, -21, WALL);
  const top = { x: foot.x, y: foot.y - 9 };
  ctx.strokeStyle = colors.ink;
  ctx.lineWidth = 0.6;
  ctx.beginPath();
  ctx.moveTo(foot.x, foot.y);
  ctx.lineTo(top.x, top.y);
  ctx.stroke();
  const reach = (3 + Math.abs(wind) * 7) * Math.sign(wind || 1);
  const flutter = Math.sin(time / (140 - Math.abs(wind) * 60)) * (0.4 + Math.abs(wind) * 0.6);
  ctx.fillStyle = colors.berry;
  ctx.beginPath();
  ctx.moveTo(top.x, top.y);
  ctx.quadraticCurveTo(top.x + reach / 2, top.y + 0.6 + flutter, top.x + reach, top.y + 1.6);
  ctx.quadraticCurveTo(top.x + reach / 2, top.y + 2.6 - flutter, top.x, top.y + 3.2);
  ctx.closePath();
  ctx.fill();
}

/** The counter at the front, with snow on it. */
export function counter(ctx: CanvasRenderingContext2D) {
  box(ctx, -21, 17, 30, 4, 6, colors.snowShade, colors.gingerbread, colors.wood);
}
