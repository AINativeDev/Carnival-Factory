import type { NorthPoleSquare } from '../../northpole/square';
import { theme } from '../../northpole/theme';

const { colors } = theme;

/** One full turn of the wheel, in milliseconds. */
export const TURN = 24_000;

/**
 * Where each gondola hangs from the rim at `time`: `count` points evenly round
 * a circle of `radius` about (cx, cy), turning clockwise once every `TURN`.
 */
export function gondolaPositions(
  count: number,
  time: number,
  cx: number,
  cy: number,
  radius: number,
): { x: number; y: number }[] {
  const turn = ((time % TURN) / TURN) * Math.PI * 2;
  return Array.from({ length: count }, (_, i) => {
    const angle = turn + (i / count) * Math.PI * 2;
    return { x: cx + Math.cos(angle) * radius, y: cy + Math.sin(angle) * radius };
  });
}

const BAUBLES = [colors.berry, colors.gold, colors.mint, colors.violet];

/** A ferris wheel hung with bauble gondolas, turning slowly under the northern lights. */
const attraction: NorthPoleSquare = {
  id: 'ferris-wheel',
  name: 'Ferris Wheel',
  description: 'Bauble gondolas turning slowly against the northern lights.',
  draw(ctx, size, time) {
    const u = size / 100;

    ctx.fillStyle = colors.night;
    ctx.fillRect(0, 0, size, size);

    // The northern lights: two ribbons that ripple across the sky.
    ctx.lineWidth = 6 * u;
    ctx.lineCap = 'round';
    for (const [color, base, speed] of [
      [colors.aurora, 14, 1500],
      [colors.violet, 24, 2100],
    ] as const) {
      ctx.globalAlpha = 0.45;
      ctx.strokeStyle = color;
      ctx.beginPath();
      for (let x = 0; x <= 100; x += 4) {
        const y = base + Math.sin(x / 14 + time / speed) * 5;
        if (x === 0) ctx.moveTo(x * u, y * u);
        else ctx.lineTo(x * u, y * u);
      }
      ctx.stroke();
    }
    ctx.globalAlpha = 1;

    ctx.fillStyle = colors.snow;
    ctx.fillRect(0, 84 * u, size, 16 * u);

    const cx = 50 * u;
    const cy = 50 * u;
    const radius = 30 * u;

    // The A-frame legs.
    ctx.strokeStyle = colors.wood;
    ctx.lineWidth = 3 * u;
    ctx.beginPath();
    ctx.moveTo(30 * u, 88 * u);
    ctx.lineTo(cx, cy);
    ctx.lineTo(70 * u, 88 * u);
    ctx.stroke();

    // The rim and its spokes, turning with the gondolas.
    const gondolas = gondolaPositions(8, time, cx, cy, radius);
    ctx.strokeStyle = colors.snowShade;
    ctx.lineWidth = 1.2 * u;
    for (const { x, y } of gondolas) {
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(x, y);
      ctx.stroke();
    }
    ctx.strokeStyle = colors.gold;
    ctx.lineWidth = 2 * u;
    ctx.beginPath();
    ctx.arc(cx, cy, radius, 0, Math.PI * 2);
    ctx.stroke();

    // Each gondola hangs straight down from the rim, like a bauble on a branch.
    gondolas.forEach(({ x, y }, i) => {
      ctx.strokeStyle = colors.snowShade;
      ctx.lineWidth = 0.8 * u;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x, y + 3 * u);
      ctx.stroke();
      ctx.fillStyle = colors.gold;
      ctx.fillRect(x - 1.5 * u, y + 2.5 * u, 3 * u, 2 * u);
      ctx.fillStyle = BAUBLES[i % BAUBLES.length];
      ctx.beginPath();
      ctx.arc(x, y + 8 * u, 4.5 * u, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = colors.snow;
      ctx.globalAlpha = 0.6;
      ctx.beginPath();
      ctx.arc(x - 1.5 * u, y + 6.5 * u, 1.2 * u, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;
    });

    ctx.fillStyle = colors.berry;
    ctx.beginPath();
    ctx.arc(cx, cy, 3 * u, 0, Math.PI * 2);
    ctx.fill();
  },
};

export default attraction;
