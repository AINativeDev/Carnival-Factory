import type { NorthPoleSquare } from '../../northpole/square';
import { theme } from '../../northpole/theme';

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

function mug(ctx: CanvasRenderingContext2D, x: number, y: number, u: number, color: string) {
  ctx.fillStyle = color;
  ctx.fillRect(x - 4 * u, y - 8 * u, 8 * u, 8 * u);
  ctx.strokeStyle = color;
  ctx.lineWidth = 1.2 * u;
  ctx.beginPath();
  ctx.arc(x + 4 * u, y - 4 * u, 2.2 * u, -Math.PI / 2, Math.PI / 2);
  ctx.stroke();
  ctx.fillStyle = colors.cocoa;
  ctx.fillRect(x - 3.4 * u, y - 7.6 * u, 6.8 * u, 1.4 * u);
  // A marshmallow bobbing on top.
  ctx.fillStyle = colors.snow;
  ctx.fillRect(x - 1 * u, y - 9 * u, 2.4 * u, 2 * u);
}

/** A hot cocoa stand, with steam curling from the mugs on the counter. */
const attraction: NorthPoleSquare = {
  id: 'cocoa-stand',
  name: 'Hot Cocoa Stand',
  description: 'Mugs of cocoa with marshmallows, steaming on the counter.',
  draw(ctx, size, time) {
    const u = size / 100;

    ctx.fillStyle = colors.snow;
    ctx.fillRect(0, 0, size, size);

    // The hut: a wooden stand with a scalloped awning.
    ctx.fillStyle = colors.wood;
    ctx.fillRect(16 * u, 30 * u, 68 * u, 56 * u);
    ctx.fillStyle = colors.cocoa;
    ctx.fillRect(22 * u, 36 * u, 56 * u, 26 * u);
    for (let i = 0; i < 5; i++) {
      ctx.fillStyle = i % 2 ? colors.glow : colors.berry;
      ctx.fillRect((12 + i * 15.2) * u, 20 * u, 15.2 * u, 10 * u);
      ctx.beginPath();
      ctx.arc((19.6 + i * 15.2) * u, 30 * u, 7.6 * u, 0, Math.PI);
      ctx.fill();
    }

    // The sign on the roof.
    ctx.fillStyle = colors.gold;
    ctx.fillRect(32 * u, 8 * u, 36 * u, 10 * u);
    ctx.fillStyle = colors.cocoa;
    for (let i = 0; i < 3; i++) {
      ctx.beginPath();
      ctx.arc((40 + i * 10) * u, 13 * u, 2.5 * u, 0, Math.PI * 2);
      ctx.fill();
    }

    // The counter, with snow on it.
    ctx.fillStyle = colors.snowShade;
    ctx.fillRect(14 * u, 62 * u, 72 * u, 5 * u);

    // A lantern inside, glowing warm.
    ctx.globalAlpha = 0.6 + 0.4 * Math.sin(time / 700);
    ctx.fillStyle = colors.glow;
    ctx.beginPath();
    ctx.arc(50 * u, 44 * u, 4 * u, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;

    const mugs = [
      [28, colors.berry],
      [44, colors.pine],
      [60, colors.snow],
      [74, colors.gold],
    ] as const;
    mugs.forEach(([x, color], i) => {
      mug(ctx, x * u, 62 * u, u, color);
      // Three wisps of steam per mug, at different stages of rising.
      for (let wisp = 0; wisp < 3; wisp++) {
        const { rise, curl } = steam(i * 3 + wisp, time);
        ctx.globalAlpha = 0.7 * (1 - rise);
        ctx.fillStyle = colors.snowShade;
        ctx.beginPath();
        ctx.arc((x + curl * 3) * u, (52 - rise * 22) * u, (1.5 + rise * 2) * u, 0, Math.PI * 2);
        ctx.fill();
      }
    });
    ctx.globalAlpha = 1;
  },
};

export default attraction;
