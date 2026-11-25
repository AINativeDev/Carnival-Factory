import type { NorthPoleSquare } from '../../../src/northpole/square';
import { cone, drum, glow, scene, shadow, stringLights } from '../../../src/northpole/diorama';
import { theme } from '../../../src/northpole/theme';

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
const attraction: NorthPoleSquare = {
  id: 'reindeer-carousel',
  name: 'Reindeer Carousel',
  description: 'Reindeer bobbing round under a candy-cane canopy.',
  draw(ctx, size, time) {
    scene(ctx, size, time, () => {
      const x = 50;
      const floor = 76;
      const deck = floor - 4;
      const hem = 40;
      const turn = ((time % TURN) / TURN) * Math.PI * 2;

      // The platform, lit warm by the lights under the canopy.
      shadow(ctx, x, floor + 2, 76);
      drum(ctx, x, floor, 34, 4, [colors.surface, colors.dusk], 12, turn, colors.slab);
      glow(ctx, x, deck - 6, 30, 0.6);

      const riders = carouselRiders(6, time);
      const ride = (rider: Rider) => {
        const { across, depth, lift } = rider;
        const rx = x + across * 26;
        const foot = deck + depth * 12;
        const ry = foot - 12 - lift * 6;
        ctx.globalAlpha = depth < 0 ? 0.75 : 1;
        ctx.strokeStyle = colors.gold;
        ctx.lineWidth = 0.8;
        ctx.beginPath();
        ctx.moveTo(rx, hem + 2 + depth * 14);
        ctx.lineTo(rx, foot);
        ctx.stroke();
        reindeer(ctx, rx, ry, 0.85, depth >= 0 ? 1 : -1);
        ctx.globalAlpha = 1;
      };
      // Reindeer at the back first, then the centre column, then the front ones.
      const order = [...riders].sort((a, b) => a.depth - b.depth);
      for (const rider of order) if (rider.depth < 0) ride(rider);
      drum(ctx, x, deck, 4, deck - hem, [colors.gold, colors.lantern], 2, 0, colors.gold);
      for (const rider of order) if (rider.depth >= 0) ride(rider);

      // The candy-cane canopy, turning with the ride, with a gold trim and a gold ball on top.
      cone(ctx, x, hem, 35, 24, [colors.berry, colors.snow], 10, turn);
      ctx.strokeStyle = colors.gold;
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.ellipse(x, hem, 35, 17.5, 0, 0, Math.PI);
      ctx.stroke();
      stringLights(
        ctx,
        Array.from({ length: 13 }, (_, i) => {
          const a = 0.1 + (i / 12) * (Math.PI - 0.2);
          return { x: x + Math.cos(a) * 33, y: hem + 2 + Math.sin(a) * 16.5 };
        }),
        [colors.lantern, colors.gold],
        time,
      );
      ctx.fillStyle = colors.gold;
      ctx.beginPath();
      ctx.arc(x, hem - 25, 2.2, 0, Math.PI * 2);
      ctx.fill();
    });
  },
};

export default attraction;
