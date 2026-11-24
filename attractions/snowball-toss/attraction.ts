import type { NorthPoleSquare } from '../../northpole/square';
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
    const u = size / 100;

    ctx.fillStyle = colors.snow;
    ctx.fillRect(0, 0, size, size);

    // The booth: a back wall, a striped awning and a counter.
    ctx.fillStyle = colors.surface;
    ctx.fillRect(14 * u, 14 * u, 72 * u, 64 * u);
    ctx.fillStyle = colors.wood;
    ctx.fillRect(14 * u, 14 * u, 3 * u, 72 * u);
    ctx.fillRect(83 * u, 14 * u, 3 * u, 72 * u);
    ctx.fillRect(10 * u, 78 * u, 80 * u, 6 * u);
    ctx.fillRect(30 * u, 66 * u, 40 * u, 2 * u);
    for (let i = 0; i < 6; i++) {
      ctx.fillStyle = i % 2 ? colors.snow : colors.pine;
      ctx.fillRect((10 + i * 13.33) * u, 4 * u, 13.4 * u, 10 * u);
      ctx.beginPath();
      ctx.arc((16.67 + i * 13.33) * u, 14 * u, 6.67 * u, 0, Math.PI);
      ctx.fill();
    }

    // The pyramid: three on the bottom, two, then one on top that the snowball hits.
    const s = 0.8 * u;
    for (const x of [38, 50, 62]) snowman(ctx, x * u, 60.4 * u, s);
    for (const x of [44, 56]) snowman(ctx, x * u, 46.8 * u, s);
    const tip = topple(time);
    ctx.save();
    // It tips over about its base.
    ctx.translate(50 * u, 38.8 * u);
    ctx.rotate((tip * Math.PI) / 2);
    ctx.globalAlpha = 1 - tip * 0.6;
    snowman(ctx, 0, -5.6 * u, s);
    ctx.restore();

    // Candy-cane prizes hanging from the awning.
    ctx.strokeStyle = colors.berry;
    ctx.lineWidth = 1.5 * u;
    for (const x of [22, 78]) {
      const sway = Math.sin(time / 600 + x) * 2 * u;
      ctx.beginPath();
      ctx.moveTo(x * u + sway, 46 * u);
      ctx.lineTo(x * u, 34 * u);
      ctx.arc(x * u - 2.5 * u, 34 * u, 2.5 * u, 0, Math.PI, true);
      ctx.stroke();
    }

    const ball = snowballAt(time);
    if (ball) {
      ctx.fillStyle = colors.snow;
      ctx.strokeStyle = colors.snowShade;
      ctx.lineWidth = 0.8 * u;
      ctx.beginPath();
      ctx.arc(ball.x * u, ball.y * u, 3 * u, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    }
  },
};

export default attraction;
