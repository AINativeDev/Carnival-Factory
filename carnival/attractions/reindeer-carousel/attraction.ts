import type { NorthPoleSquare, SquarePointer } from '../../../src/northpole/square';
import { cone, drum, glow, scene, shadow } from '../../../src/northpole/diorama';
import { theme } from '../../../src/northpole/theme';
import { reindeer, ridingElf } from './figures';
import {
  AT_PACE,
  carouselRiders,
  chaseBrightness,
  paceOf,
  reindeerAt,
  riderSpot,
  seatAfterTap,
  stepRide,
  turnOf,
  type Ride,
  type Rider,
} from './ride';

const { colors } = theme;

/** How many lantern bulbs hang round the canopy's rim. */
const BULBS = 13;

/**
 * The carousel's one memory of the pointer: how far a held ride has got ahead
 * of its own pace, and which reindeer the elf rides (-1 for none).
 */
let ride: Ride = AT_PACE;
let seated = -1;

/** The lantern lights round the rim, a bright spot chasing round as the ride turns. */
function chaseLights(ctx: CanvasRenderingContext2D, x: number, hem: number, turn: number) {
  for (let n = 0; n < BULBS; n++) {
    const a = 0.1 + (n / (BULBS - 1)) * (Math.PI - 0.2);
    const bx = x + Math.cos(a) * 33;
    const by = hem + 2 + Math.sin(a) * 16.5;
    const strength = chaseBrightness(turn, n, BULBS);
    ctx.fillStyle = colors.glow;
    ctx.globalAlpha = 0.35 * strength;
    ctx.beginPath();
    ctx.arc(bx, by, 1.9, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = strength;
    ctx.fillStyle = n % 2 ? colors.gold : colors.lantern;
    ctx.beginPath();
    ctx.arc(bx, by, 0.9, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
}

/** A reindeer carousel going round under a striped candy-cane canopy, to ride and speed up. */
const attraction: NorthPoleSquare = {
  id: 'reindeer-carousel',
  name: 'Reindeer Carousel',
  description: 'Pick a reindeer to ride, and hold on to speed the carousel up.',
  // How it stands on the home map: what it is, not a pavilion (ADR 0042).
  stall: { shape: 'carousel', roof: 'berry', trim: 'snow', landmark: 'merry-go-round' },
  draw(ctx, size, time, pointer?: SquarePointer) {
    ride = stepRide(ride, pointer?.down === true, time);
    const turn = turnOf(ride, time);
    const pace = paceOf(ride);
    const riders = carouselRiders(6, turn);
    if (pointer && pointer.presses > 0) {
      const tapped = reindeerAt(riders, (pointer.x * 100) / size, (pointer.y * 100) / size);
      seated = seatAfterTap(seated, tapped);
    }

    scene(ctx, size, time, () => {
      const x = 50;
      const floor = 76;
      const deck = floor - 4;
      const hem = 40;

      // The platform, lit warm by the lights under the canopy, brighter as it speeds up.
      shadow(ctx, x, floor + 2, 76);
      drum(ctx, x, floor, 34, 4, [colors.surface, colors.dusk], 12, turn, colors.slab);
      glow(ctx, x, deck - 6, 30, 0.5 + pace * 0.1);

      const draw = (rider: Rider, index: number) => {
        const spot = riderSpot(rider);
        const facing = rider.depth >= 0 ? 1 : -1;
        ctx.globalAlpha = rider.depth < 0 ? 0.75 : 1;
        ctx.strokeStyle = colors.gold;
        ctx.lineWidth = 0.8;
        ctx.beginPath();
        ctx.moveTo(spot.x, hem + 2 + rider.depth * 14);
        ctx.lineTo(spot.x, spot.foot);
        ctx.stroke();
        reindeer(ctx, spot.x, spot.y, 0.85, facing);
        if (index === seated) ridingElf(ctx, spot.x, spot.y, 0.85, facing, pace);
        ctx.globalAlpha = 1;
      };
      // Reindeer at the back first, then the centre column, then the front ones.
      const order = riders.map((rider, index) => ({ rider, index }));
      order.sort((a, b) => a.rider.depth - b.rider.depth);
      for (const { rider, index } of order) if (rider.depth < 0) draw(rider, index);
      drum(ctx, x, deck, 4, deck - hem, [colors.gold, colors.lantern], 2, 0, colors.gold);
      for (const { rider, index } of order) if (rider.depth >= 0) draw(rider, index);

      // The candy-cane canopy, turning with the ride, with a gold trim and a gold ball on top.
      cone(ctx, x, hem, 35, 24, [colors.berry, colors.snow], 10, turn);
      ctx.strokeStyle = colors.gold;
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.ellipse(x, hem, 35, 17.5, 0, 0, Math.PI);
      ctx.stroke();
      chaseLights(ctx, x, hem, turn);
      ctx.fillStyle = colors.gold;
      ctx.beginPath();
      ctx.arc(x, hem - 25, 2.2, 0, Math.PI * 2);
      ctx.fill();
    });
  },
};

export default attraction;
