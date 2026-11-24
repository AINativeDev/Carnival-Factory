import type { NorthPoleSquare } from '../../northpole/square';
import { box, glow, iso, scene, shadow } from '../../northpole/diorama';
import { theme } from '../../northpole/theme';

const { colors } = theme;

/** One throw, from leaving the hand to the snowmen standing again, in milliseconds. */
export const THROW = 4_000;
/** The part of a throw the snowball is in the air. */
const FLIGHT = 0.4;

/**
 * Where the snowball is at `time`, in the attraction's 0 to 100 units, or undefined
 * while it is not in the air. It arcs from the front of the booth up to the
 * top tin snowman, at (50, 33).
 */
export function snowballAt(time: number): { x: number; y: number } | undefined {
  const t = (time % THROW) / THROW / FLIGHT;
  if (t >= 1) return undefined;
  return { x: 50 + (1 - t) * 30, y: 33 + (1 - t) * 57 - Math.sin(t * Math.PI) * 30 };
}

/** How far the top snowman has tipped over at `time`, from 0 (standing) to 1 (knocked flat). */
export function topple(time: number): number {
  const t = (time % THROW) / THROW;
  if (t < FLIGHT) return 0;
  if (t < 0.55) return (t - FLIGHT) / (0.55 - FLIGHT);
  if (t < 0.85) return 1;
  return 1 - (t - 0.85) / 0.15;
}

function snowman(ctx: CanvasRenderingContext2D, x: number, y: number, u: number) {
  ctx.fillStyle = colors.snowShade;
  ctx.beginPath();
  ctx.arc(x, y + 3 * u, 4 * u, 0, Math.PI * 2);
  ctx.arc(x, y - 3 * u, 3 * u, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = colors.muted;
  ctx.lineWidth = 0.6 * u;
  ctx.stroke();
  ctx.fillStyle = colors.night;
  ctx.fillRect(x - 3 * u, y - 7 * u, 6 * u, 1 * u);
  ctx.fillRect(x - 2 * u, y - 10 * u, 4 * u, 3 * u);
  ctx.fillStyle = colors.gingerbread;
  ctx.fillRect(x, y - 3.5 * u, 2 * u, 0.8 * u);
}

/** A snowball toss booth with a pyramid of tin snowmen that get knocked over and stood back up. */
const attraction: NorthPoleSquare = {
  id: 'snowball-toss',
  name: 'Snowball Toss',
  description: 'Knock the tin snowmen off the shelf and win a candy cane.',
  draw(ctx, size, time) {
    scene(ctx, size, time, () => {
      // The booth: two back walls meeting behind, a lamp in the corner, and striped awnings.
      const wall = 34;
      shadow(ctx, 53, 70, 80);
      box(ctx, -21, -21, 3, 40, wall, colors.slab, colors.surface, colors.night);
      box(ctx, -21, -21, 40, 3, wall, colors.slab, colors.surface, colors.night);
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
          const points = [p(a0, 0, wall), p(a1, 0, wall), p(a1, 6, wall - 5), p(a0, 6, wall - 5)];
          ctx.beginPath();
          points.forEach((q, n) => (n ? ctx.lineTo(q.x, q.y) : ctx.moveTo(q.x, q.y)));
          ctx.fill();
        }
      }

      // The shelf, and the pyramid on it: three on the bottom, two, then one on top that the snowball hits.
      box(ctx, -9, -9, 18, 18, 4, colors.gingerbread, colors.wood, colors.cocoa);
      const s = 0.8;
      for (const x of [38, 50, 62]) snowman(ctx, x, 60.4, s);
      for (const x of [44, 56]) snowman(ctx, x, 46.8, s);
      const tip = topple(time);
      ctx.save();
      // It tips over about its base.
      ctx.translate(50, 38.8);
      ctx.rotate((tip * Math.PI) / 2);
      ctx.globalAlpha = 1 - tip * 0.6;
      snowman(ctx, 0, -5.6, s);
      ctx.restore();

      // Candy-cane prizes hanging from the awning.
      ctx.strokeStyle = colors.berry;
      ctx.lineWidth = 1.3;
      for (const [n, hook] of [iso(-16, 12, wall - 6), iso(12, -16, wall - 6)].entries()) {
        const sway = Math.sin(time / 600 + n * 40) * 1.6;
        ctx.beginPath();
        ctx.moveTo(hook.x + sway, hook.y + 11);
        ctx.lineTo(hook.x, hook.y);
        ctx.arc(hook.x - 2.2, hook.y, 2.2, 0, Math.PI, true);
        ctx.stroke();
      }

      // The counter at the front, with snow on it.
      box(ctx, -21, 17, 30, 4, 6, colors.snowShade, colors.gingerbread, colors.wood);

      const ball = snowballAt(time);
      if (ball) {
        ctx.fillStyle = colors.snowLit;
        ctx.strokeStyle = colors.snowShade;
        ctx.lineWidth = 0.6;
        ctx.beginPath();
        ctx.arc(ball.x, ball.y, 2.6, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
      }
    });
  },
};

export default attraction;
