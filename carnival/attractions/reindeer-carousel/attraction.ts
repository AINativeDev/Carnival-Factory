import type { NorthPoleSquare, SquarePointer } from '../../../src/northpole/square';
import { cone, drum, glow, scene, shadow } from '../../../src/northpole/diorama';
import { theme } from '../../../src/northpole/theme';
import { ringArm } from './arm';
import { reindeer, ridingElf, yours } from './figures';
import { advance, newGrab, type Grab } from './grab';
import { hud } from './hud';
import { carouselRiders, chaseBrightness, paceOf, riderSpot, turnOf, type Rider } from './ride';

const { colors } = theme;

/** How many lantern bulbs hang round the canopy's rim. */
const BULBS = 13;
/** How long the elf's arm stays out after a tap, in ms. */
const REACH = 320;

/** The carousel's one memory for the visit: the ride and Ring Grab's score. */
let grab: Grab | undefined;

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

/** How far the elf reaches at `time`: out fast after a tap, back slowly, or for the demo's grab. */
function reachOf(game: Grab, time: number): number {
  const last = game.moments.at(-1)?.at ?? -Infinity;
  const tapped = Math.max(game.mode === 'demo' ? -Infinity : game.lastTap, last);
  const t = (time - tapped) / REACH;
  return t < 0 || t > 1 ? 0 : Math.sin(Math.PI * Math.sqrt(t));
}

/** The carousel turning `turn` radians round: platform, reindeer, column, canopy and lights. */
function carousel(ctx: CanvasRenderingContext2D, game: Grab, time: number, turn: number) {
  const pace = paceOf(game.ride);
  const riders = carouselRiders(6, turn);
  const x = 50;
  const floor = 76;
  const deck = floor - 4;
  const hem = 40;

  // The platform, lit warm by the lights under the canopy, brighter as it speeds up.
  shadow(ctx, x, floor + 2, 76);
  drum(ctx, x, floor, 34, 4, [colors.surface, colors.dusk], 12, turn, colors.slab);
  glow(ctx, x, deck - 6, 30, 0.5 + Math.min(3, pace) * 0.1);

  const draw = (rider: Rider, index: number) => {
    const spot = riderSpot(rider);
    const facing = rider.depth >= 0 ? 1 : -1;
    // Yours is always in full view; the others at the back are fainter.
    ctx.globalAlpha = rider.depth < 0 && index !== 0 ? 0.75 : 1;
    if (index === 0) yours(ctx, spot.x, spot.y, time);
    ctx.strokeStyle = colors.gold;
    ctx.lineWidth = 0.8;
    ctx.beginPath();
    ctx.moveTo(spot.x, hem + 2 + rider.depth * 14);
    ctx.lineTo(spot.x, spot.foot);
    ctx.stroke();
    reindeer(ctx, spot.x, spot.y, 0.85, facing);
    if (index === 0) ridingElf(ctx, spot, 0.85, facing, pace, reachOf(game, time));
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
}

/**
 * The Reindeer Carousel: Ring Grab, the brass-ring game, on a reindeer
 * carousel under a striped candy-cane canopy. Your reindeer carries the elf
 * round; tap as it passes the ring arm to grab the ring.
 */
const attraction: NorthPoleSquare = {
  id: 'reindeer-carousel',
  name: 'Reindeer Carousel',
  description:
    'Ring Grab: tap as your reindeer passes the ring arm to grab silver rings and the rare gold one, while the carousel spins faster with every ring.',
  // How it stands on the home map: what it is, not a pavilion (ADR 0042).
  stall: { shape: 'carousel', roof: 'berry', trim: 'snow', landmark: 'merry-go-round' },
  draw(ctx, size, time, pointer?: SquarePointer) {
    const game = advance(grab ?? newGrab(time, 'demo', 0), time, pointer?.presses ?? 0);
    grab = game;
    const turn = turnOf(game.ride, time);
    scene(ctx, size, time, () => {
      carousel(ctx, game, time, turn);
      ringArm(ctx, game, turn);
      hud(ctx, game, time);
    });
  },
};

export default attraction;
