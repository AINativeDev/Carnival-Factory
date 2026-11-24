import type { NorthPoleSquare } from '../../northpole/square';
import { theme } from '../../northpole/theme';

const { colors } = theme;

/** One figure eight, in milliseconds. */
export const LAP = 8_000;

/**
 * A point on a figure eight at `phase` (one lap from 0 to 1), from -1 to 1
 * across and -0.5 to 0.5 down, crossing itself in the middle.
 */
export function figureEight(phase: number): { x: number; y: number } {
  const angle = phase * Math.PI * 2;
  return { x: Math.sin(angle), y: Math.sin(angle * 2) / 2 };
}

const SCARVES = [colors.berry, colors.pine, colors.violet];

function skater(ctx: CanvasRenderingContext2D, x: number, y: number, u: number, scarf: string) {
  ctx.fillStyle = colors.surface;
  ctx.fillRect(x - 2 * u, y - 8 * u, 4 * u, 8 * u);
  ctx.fillStyle = scarf;
  ctx.fillRect(x - 2.5 * u, y - 8.5 * u, 5 * u, 1.6 * u);
  ctx.fillStyle = colors.glow;
  ctx.beginPath();
  ctx.arc(x, y - 10.5 * u, 2.2 * u, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = scarf;
  ctx.beginPath();
  ctx.arc(x, y - 11.5 * u, 2.2 * u, Math.PI, 0);
  ctx.fill();
  ctx.fillStyle = colors.muted;
  ctx.fillRect(x - 2.5 * u, y, 5 * u, 0.8 * u);
}

/** A frozen pond in the pines, where skaters trace figure eights and leave their tracks in the ice. */
const attraction: NorthPoleSquare = {
  id: 'frozen-pond',
  name: 'Frozen Pond',
  description: 'Skaters tracing figure eights on the ice.',
  draw(ctx, size, time) {
    const u = size / 100;

    ctx.fillStyle = colors.snow;
    ctx.fillRect(0, 0, size, size);

    // Pines round the back of the pond.
    for (const [x, h] of [
      [10, 26],
      [24, 20],
      [80, 24],
      [92, 18],
    ]) {
      ctx.fillStyle = colors.pineDark;
      ctx.beginPath();
      ctx.moveTo(x * u, (34 - h) * u);
      ctx.lineTo((x + h / 3) * u, 34 * u);
      ctx.lineTo((x - h / 3) * u, 34 * u);
      ctx.closePath();
      ctx.fill();
    }

    // The ice, with a shine that drifts across it.
    ctx.fillStyle = colors.ice;
    ctx.beginPath();
    ctx.ellipse(50 * u, 62 * u, 46 * u, 28 * u, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.save();
    ctx.clip();
    ctx.globalAlpha = 0.35;
    ctx.fillStyle = colors.snow;
    const shine = ((time / 60) % 140) - 20;
    ctx.beginPath();
    ctx.moveTo(shine * u, 34 * u);
    ctx.lineTo((shine + 8) * u, 34 * u);
    ctx.lineTo((shine - 12) * u, 90 * u);
    ctx.lineTo((shine - 20) * u, 90 * u);
    ctx.closePath();
    ctx.fill();
    ctx.restore();

    // The figure eight scratched into the ice.
    const cx = 50 * u;
    const cy = 62 * u;
    const across = 34 * u;
    const down = 30 * u;
    ctx.strokeStyle = colors.snow;
    ctx.lineWidth = 0.8 * u;
    ctx.beginPath();
    for (let i = 0; i <= 64; i++) {
      const { x, y } = figureEight(i / 64);
      if (i === 0) ctx.moveTo(cx + x * across, cy + y * down);
      else ctx.lineTo(cx + x * across, cy + y * down);
    }
    ctx.stroke();

    // Three skaters, a third of a lap apart, the nearer ones drawn last.
    const skaters = SCARVES.map((scarf, i) => ({
      scarf,
      ...figureEight((((time / LAP + i / 3) % 1) + 1) % 1),
    })).sort((a, b) => a.y - b.y);
    for (const { scarf, x, y } of skaters) skater(ctx, cx + x * across, cy + y * down, u, scarf);
  },
};

export default attraction;
