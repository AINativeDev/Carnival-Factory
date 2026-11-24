import type { NorthPoleSquare } from '../../northpole/square';
import { theme } from '../../northpole/theme';

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
    const u = size / 100;

    ctx.fillStyle = colors.snow;
    ctx.fillRect(0, 0, size, size);

    // The tent walls, in stripes.
    const stripes = 8;
    for (let i = 0; i < stripes; i++) {
      ctx.fillStyle = i % 2 ? colors.snow : colors.berry;
      ctx.fillRect((12 + (76 * i) / stripes) * u, 44 * u, (76 / stripes) * u, 42 * u);
    }
    ctx.strokeStyle = colors.snowShade;
    ctx.lineWidth = 1 * u;
    ctx.strokeRect(12 * u, 44 * u, 76 * u, 42 * u);

    // The roof: a striped peak with a scalloped hem.
    for (let i = 0; i < stripes; i++) {
      ctx.fillStyle = i % 2 ? colors.berry : colors.snow;
      ctx.beginPath();
      ctx.moveTo(50 * u, 12 * u);
      ctx.lineTo((8 + (84 * i) / stripes) * u, 44 * u);
      ctx.lineTo((8 + (84 * (i + 1)) / stripes) * u, 44 * u);
      ctx.closePath();
      ctx.fill();
    }
    ctx.fillStyle = colors.gold;
    for (let i = 0; i < 7; i++) {
      ctx.beginPath();
      ctx.arc((14 + i * 12) * u, 44 * u, 6 * u, 0, Math.PI);
      ctx.fill();
    }

    // A pennant on the peak, fluttering.
    ctx.strokeStyle = colors.wood;
    ctx.lineWidth = 1 * u;
    ctx.beginPath();
    ctx.moveTo(50 * u, 12 * u);
    ctx.lineTo(50 * u, 2 * u);
    ctx.stroke();
    ctx.fillStyle = colors.pine;
    ctx.beginPath();
    ctx.moveTo(50 * u, 2 * u);
    ctx.lineTo((60 + Math.sin(time / 250) * 1.5) * u, (5 + Math.sin(time / 300)) * u);
    ctx.lineTo(50 * u, 8 * u);
    ctx.closePath();
    ctx.fill();

    // Three flaps, each with an elf that pops out in turn.
    for (const [flap, x] of [24, 50, 76].entries()) {
      const peek = elfPeek(flap, time);
      ctx.fillStyle = colors.night;
      ctx.beginPath();
      ctx.moveTo((x - 7) * u, 86 * u);
      ctx.lineTo(x * u, 66 * u);
      ctx.lineTo((x + 7) * u, 86 * u);
      ctx.closePath();
      ctx.fill();
      if (peek > 0) {
        ctx.save();
        ctx.beginPath();
        ctx.rect((x - 9) * u, 50 * u, 18 * u, 36 * u);
        ctx.clip();
        elf(ctx, x * u, (88 - peek * 14) * u, u);
        ctx.restore();
      }
    }
  },
};

export default attraction;
