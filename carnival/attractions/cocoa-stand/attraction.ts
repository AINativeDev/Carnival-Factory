import type { NorthPoleSquare } from '../../../northpole/square';
import { box, drum, glow, iso, scene, shadow } from '../../../northpole/diorama';
import { theme } from '../../../northpole/theme';

const { colors } = theme;

/** How long a wisp of steam takes to rise and fade, in milliseconds. */
export const RISE = 2_400;

/**
 * A wisp of steam from the mug at `mug`, at `time`: how far it has risen, from
 * 0 (just leaving the cocoa) to 1 (gone), and how far it curls sideways, from
 * -1 to 1. Each mug's steam starts at its own moment, so they don't rise in step.
 */
export function steam(mug: number, time: number): { rise: number; curl: number } {
  const rise = (((time / RISE + mug * 0.37) % 1) + 1) % 1;
  return { rise, curl: Math.sin(rise * Math.PI * 2 + mug) };
}

function mug(ctx: CanvasRenderingContext2D, x: number, y: number, color: string) {
  ctx.strokeStyle = color;
  ctx.lineWidth = 0.7;
  ctx.beginPath();
  ctx.arc(x + 2.4, y - 2.4, 1.4, -Math.PI / 2, Math.PI / 2);
  ctx.stroke();
  drum(ctx, x, y, 2.4, 4.6, [color], 1, 0, colors.cocoa);
  // A marshmallow bobbing on top.
  ctx.fillStyle = colors.snowLit;
  ctx.fillRect(x - 0.8, y - 5.6, 1.8, 1.3);
}

/** A strip along the stall's front, from gx0 to gx1 at gy, from z0 up to z1. */
function front(
  ctx: CanvasRenderingContext2D,
  gx0: number,
  gx1: number,
  gy: number,
  z0: number,
  z1: number,
) {
  const points = [iso(gx0, gy, z0), iso(gx1, gy, z0), iso(gx1, gy, z1), iso(gx0, gy, z1)];
  ctx.beginPath();
  points.forEach((p, n) => (n ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y)));
  ctx.closePath();
}

/** A hot cocoa stand, with steam curling from the mugs on the counter. */
const attraction: NorthPoleSquare = {
  id: 'cocoa-stand',
  name: 'Hot Cocoa Stand',
  description: 'Mugs of cocoa with marshmallows, steaming on the counter.',
  draw(ctx, size, time) {
    scene(ctx, size, time, () => {
      const wall = 30;
      // The hut: a wooden stand, its open front facing the lower left.
      const c = iso(0, 0);
      shadow(ctx, c.x + 2, c.y + 4, 64);
      box(ctx, -15, -9, 30, 17, wall, colors.snow, colors.wood, colors.cocoa);
      // Planks along the front.
      ctx.strokeStyle = colors.cocoa;
      ctx.lineWidth = 0.35;
      for (let z = 4; z < wall; z += 4) {
        const a = iso(-15, 8, z);
        const b = iso(15, 8, z);
        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(b.x, b.y);
        ctx.stroke();
      }
      // The serving hatch, dark inside, with a lantern glowing warm.
      ctx.fillStyle = colors.ink;
      front(ctx, -12, 12, 8, 12, 25);
      ctx.fill();
      const lamp = iso(0, 8, 21);
      glow(ctx, lamp.x, lamp.y, 10, 0.75 + 0.25 * Math.sin(time / 1400));
      ctx.fillStyle = colors.lantern;
      ctx.beginPath();
      ctx.arc(lamp.x, lamp.y, 1.6, 0, Math.PI * 2);
      ctx.fill();

      // The counter, with snow on it, standing out in front of the hatch.
      box(ctx, -15, 8, 30, 4, 12, colors.snowShade, colors.gingerbread, colors.wood);

      // The scalloped awning, sloping out over the counter.
      const stripes = 8;
      for (let i = 0; i < stripes; i++) {
        const gx0 = -16 + (32 * i) / stripes;
        const gx1 = gx0 + 32 / stripes;
        ctx.fillStyle = i % 2 ? colors.lantern : colors.berry;
        const points = [
          iso(gx0, 8, wall),
          iso(gx1, 8, wall),
          iso(gx1, 13, wall - 3),
          iso(gx0, 13, wall - 3),
        ];
        ctx.beginPath();
        points.forEach((p, n) => (n ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y)));
        ctx.fill();
        const mid = iso((gx0 + gx1) / 2, 13, wall - 3);
        ctx.beginPath();
        ctx.ellipse(mid.x, mid.y, 2, 1.6, Math.atan2(1, 2), 0, Math.PI);
        ctx.fill();
      }
      ctx.fillStyle = colors.snow;
      front(ctx, -16, 16, 8, wall, wall + 1.5);
      ctx.fill();

      // The sign on the roof, three cocoa drops on gold.
      box(ctx, -9, -1, 18, 1.2, 8, colors.gold, colors.gold, colors.wood, wall);
      ctx.fillStyle = colors.cocoa;
      for (let i = 0; i < 3; i++) {
        const p = iso(-5 + i * 5, 0.2, wall + 4);
        ctx.beginPath();
        ctx.arc(p.x, p.y, 1.4, 0, Math.PI * 2);
        ctx.fill();
      }

      const mugs = [colors.berry, colors.pine, colors.cream, colors.gold];
      mugs.forEach((color, i) => {
        const at = iso(-10 + i * 6.5, 10, 12);
        mug(ctx, at.x, at.y, color);
        // Three wisps of steam per mug, at different stages of rising.
        for (let wisp = 0; wisp < 3; wisp++) {
          const { rise, curl } = steam(i * 3 + wisp, time);
          ctx.globalAlpha = 0.6 * (1 - rise);
          ctx.fillStyle = colors.snowLit;
          ctx.beginPath();
          ctx.arc(at.x + curl * 2, at.y - 7 - rise * 16, 0.9 + rise * 1.6, 0, Math.PI * 2);
          ctx.fill();
        }
      });
      ctx.globalAlpha = 1;
    });
  },
};

export default attraction;
