import type { NorthPoleSquare } from '../../../northpole/square';
import { cone, drum, glow, scene, shadow, stringLights } from '../../../northpole/diorama';
import { theme } from '../../../northpole/theme';

const { colors } = theme;

/** How often an elf pops out of a flap, in milliseconds. */
export const PEEK = 3_200;

/**
 * How far the elf at flap `flap` has popped out at `time`, from 0 (hidden) to
 * 1 (all the way out). Each of the three flaps takes its turn, a third of a
 * peek after the last, and an elf is out for the first half of its peek.
 */
export function elfPeek(flap: number, time: number): number {
  const phase = (((time / PEEK - flap / 3) % 1) + 1) % 1;
  return phase < 0.5 ? Math.sin(phase * 2 * Math.PI) : 0;
}

function elf(ctx: CanvasRenderingContext2D, x: number, y: number, u: number) {
  ctx.fillStyle = colors.glow;
  ctx.beginPath();
  ctx.arc(x, y, 3.5 * u, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = colors.pine;
  ctx.beginPath();
  ctx.moveTo(x - 4 * u, y - 2 * u);
  ctx.lineTo(x + 4 * u, y - 2 * u);
  ctx.lineTo(x + 5 * u, y - 10 * u);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = colors.snow;
  ctx.beginPath();
  ctx.arc(x + 5 * u, y - 10 * u, 1.3 * u, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = colors.night;
  ctx.fillRect(x - 1.8 * u, y - 0.5 * u, 1 * u, 1 * u);
  ctx.fillRect(x + 0.8 * u, y - 0.5 * u, 1 * u, 1 * u);
}

/** Santa's workshop big top: red and white stripes, with elves popping out of the flaps. */
const attraction: NorthPoleSquare = {
  id: 'big-top',
  name: "Santa's Big Top",
  description: "Santa's workshop under a striped big top, with elves peeking out of the flaps.",
  draw(ctx, size, time) {
    scene(ctx, size, time, () => {
      const x = 50;
      const y = 72;
      const wall = 16;
      const hem = y - wall;

      shadow(ctx, x, y + 2, 66);
      glow(ctx, x, y - 2, 26, 0.7);
      // The tent walls in stripes, and the roof's peak in stripes over them.
      drum(ctx, x, y, 28, wall, [colors.berry, colors.snow], 8, 0.2, colors.snow);
      cone(ctx, x, hem, 32, 28, [colors.snow, colors.berry], 8, 0.2);
      // A gold scalloped hem round the front of the roof.
      ctx.fillStyle = colors.gold;
      for (let i = 1; i < 8; i++) {
        const a = (i / 8) * Math.PI;
        ctx.beginPath();
        ctx.arc(x + Math.cos(a) * 32, hem + Math.sin(a) * 16, 2.2, 0, Math.PI);
        ctx.fill();
      }
      stringLights(
        ctx,
        Array.from({ length: 11 }, (_, i) => {
          const a = 0.15 + (i / 10) * (Math.PI - 0.3);
          return { x: x + Math.cos(a) * 29, y: hem + 3 + Math.sin(a) * 14.5 };
        }),
        [colors.lantern, colors.gold],
        time,
      );

      // A pennant on the peak, fluttering.
      const peak = hem - 28;
      ctx.fillStyle = colors.wood;
      ctx.fillRect(x - 0.5, peak - 9, 1, 9);
      ctx.fillStyle = colors.pine;
      ctx.beginPath();
      ctx.moveTo(x + 0.5, peak - 9);
      ctx.lineTo(x + 9 + Math.sin(time / 500) * 1.2, peak - 6.5 + Math.sin(time / 600) * 0.8);
      ctx.lineTo(x + 0.5, peak - 4);
      ctx.fill();

      // Three flaps, lit warm inside, each with an elf that pops out in turn.
      for (const [flap, a] of [0.95, 0.5, 0.05].entries()) {
        const angle = Math.PI * (0.22 + a * 0.56);
        const fx = x + Math.cos(angle) * 28;
        const fy = y + Math.sin(angle) * 14;
        const door = () => {
          ctx.beginPath();
          ctx.moveTo(fx - 5, fy);
          ctx.lineTo(fx, fy - 13);
          ctx.lineTo(fx + 5, fy);
          ctx.closePath();
        };
        ctx.fillStyle = colors.ink;
        door();
        ctx.fill();
        glow(ctx, fx, fy - 4, 7, 0.9);
        const peek = elfPeek(flap, time);
        if (peek > 0) {
          ctx.save();
          ctx.beginPath();
          ctx.rect(fx - 8, hem + 2, 16, fy - hem - 2);
          ctx.clip();
          elf(ctx, fx, fy + 3 - peek * 11, 1);
          ctx.restore();
        }
      }
    });
  },
};

export default attraction;
