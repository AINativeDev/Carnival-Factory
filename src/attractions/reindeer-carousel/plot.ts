import type { NorthPolePlot } from '../../northpole/plot';
import { theme } from '../../northpole/theme';

const { colors } = theme;

/** One full turn of the carousel, in milliseconds. */
export const TURN = 9_000;

export interface Rider {
  /** Across the carousel, from -1 (left edge) to 1 (right edge). */
  across: number;
  /** 1 at the front, nearest the viewer, -1 at the back. */
  depth: number;
  /** How far the reindeer has risen on its pole, from 0 to 1. */
  lift: number;
}

/**
 * Where each of `count` reindeer is at `time`, going round once every `TURN`
 * and rising and falling on its pole twice a turn.
 */
export function carouselRiders(count: number, time: number): Rider[] {
  const turn = ((time % TURN) / TURN) * Math.PI * 2;
  return Array.from({ length: count }, (_, i) => {
    const angle = turn + (i / count) * Math.PI * 2;
    return {
      across: Math.sin(angle),
      depth: Math.cos(angle),
      lift: (1 + Math.sin(angle * 2 + i)) / 2,
    };
  });
}

function reindeer(ctx: CanvasRenderingContext2D, x: number, y: number, u: number, facing: number) {
  ctx.fillStyle = colors.wood;
  ctx.beginPath();
  ctx.ellipse(x, y, 6 * u, 3.5 * u, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillRect(x + facing * 4 * u - 1.2 * u, y - 6 * u, 2.4 * u, 5 * u);
  ctx.beginPath();
  ctx.arc(x + facing * 5 * u, y - 7 * u, 2.4 * u, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillRect(x - 5 * u, y + 2 * u, 1.4 * u, 4 * u);
  ctx.fillRect(x + 3.6 * u, y + 2 * u, 1.4 * u, 4 * u);
  // Antlers and a red nose.
  ctx.strokeStyle = colors.gold;
  ctx.lineWidth = 0.8 * u;
  ctx.beginPath();
  ctx.moveTo(x + facing * 4.5 * u, y - 9 * u);
  ctx.lineTo(x + facing * 3 * u, y - 13 * u);
  ctx.moveTo(x + facing * 5.5 * u, y - 9 * u);
  ctx.lineTo(x + facing * 7 * u, y - 13 * u);
  ctx.stroke();
  ctx.fillStyle = colors.berry;
  ctx.beginPath();
  ctx.arc(x + facing * 7.4 * u, y - 7 * u, 1 * u, 0, Math.PI * 2);
  ctx.fill();
}

/** A reindeer carousel going round under a striped candy-cane canopy. */
const attraction: NorthPolePlot = {
  owner: 'reindeer-carousel',
  name: 'Reindeer Carousel',
  description: 'Reindeer bobbing round under a candy-cane canopy.',
  draw(ctx, size, time) {
    const u = size / 100;

    ctx.fillStyle = colors.snow;
    ctx.fillRect(0, 0, size, size);

    // The platform.
    ctx.fillStyle = colors.surface;
    ctx.beginPath();
    ctx.ellipse(50 * u, 80 * u, 40 * u, 9 * u, 0, 0, Math.PI * 2);
    ctx.fill();

    // The candy-cane canopy: a cone of red and white stripes.
    const stripes = 10;
    for (let i = 0; i < stripes; i++) {
      ctx.fillStyle = i % 2 ? colors.snow : colors.berry;
      ctx.beginPath();
      ctx.moveTo(50 * u, 8 * u);
      ctx.lineTo((8 + (84 * i) / stripes) * u, 32 * u);
      ctx.lineTo((8 + (84 * (i + 1)) / stripes) * u, 32 * u);
      ctx.closePath();
      ctx.fill();
    }
    ctx.fillStyle = colors.gold;
    ctx.fillRect(8 * u, 32 * u, 84 * u, 3 * u);
    ctx.beginPath();
    ctx.arc(50 * u, 7 * u, 2.5 * u, 0, Math.PI * 2);
    ctx.fill();

    // The centre column.
    ctx.fillStyle = colors.gold;
    ctx.fillRect(47 * u, 35 * u, 6 * u, 45 * u);

    // Reindeer at the back first, so the front ones pass in front of them.
    const riders = carouselRiders(6, time).sort((a, b) => a.depth - b.depth);
    for (const { across, depth, lift } of riders) {
      const x = 50 * u + across * 34 * u;
      const y = 62 * u + depth * 6 * u - lift * 6 * u;
      ctx.globalAlpha = depth < 0 ? 0.65 : 1;
      ctx.strokeStyle = colors.gold;
      ctx.lineWidth = 1 * u;
      ctx.beginPath();
      ctx.moveTo(x, 35 * u);
      ctx.lineTo(x, 80 * u + depth * 6 * u);
      ctx.stroke();
      reindeer(ctx, x, y, u, depth >= 0 ? 1 : -1);
    }
    ctx.globalAlpha = 1;
  },
};

export default attraction;
