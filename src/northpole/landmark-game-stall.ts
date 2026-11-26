/**
 * Snowball Toss stands as a fairground game stall: a counter at the front,
 * a striped hood and header, bullseye targets rocking gently on the back
 * wall, a pile of snowballs ready on the counter, and an elf at the front
 * throwing a snowball every few seconds that sets the middle target wobbling
 * when it lands, with more elves queueing (`landmark-game-stall-life.ts`).
 * Its square's drawing is on the counter's front, under its name (ADR 0042).
 */
import { block, bulb, corners, twinkle } from './brushes';
import { band, onFace, type Face } from './faces';
import { hoodLights, releaseFrom, stallLife, THROWER } from './landmark-game-stall-life';
import { framedArt, frontOf, stage, type LandmarkDrawer } from './landmark-parts';
import { area, fillShape, onSpot } from './landmark-kit';
import { inTurn } from './rounds';
import { SIGN_STYLES } from './sign-styles';
import { standing } from './stall-plan';
import { theme } from './theme';
import type { Spot, Tile } from './world';

const { colors } = theme;

const STALL = { stage: 10, wall: 206, counter: 104, header: [146, 168] as const, throw: 4200 };
/** The targets on the back wall: how far along it and how high. */
const TARGETS = [
  [0.2, 174],
  [0.5, 178],
  [0.8, 174],
  [0.35, 142],
  [0.65, 142],
] as const;

/** A bullseye: rings of snow and berry. */
function target(ctx: CanvasRenderingContext2D, at: Tile, r: number) {
  for (const [n, scale] of [1, 0.72, 0.44, 0.18].entries()) {
    ctx.fillStyle = inTurn([colors.snow, colors.berry], n);
    ctx.beginPath();
    ctx.arc(at.x, at.y, r * scale, 0, Math.PI * 2);
    ctx.fill();
  }
}

/**
 * How far the middle target is knocked sideways, in pixels, through a throw
 * `t`: still while the snowball flies, then a few slow, fading rocks once it
 * lands at the start of the next.
 */
export function wobble(t: number): number {
  if (t > 0.3) return 0;
  return Math.sin((t / 0.3) * Math.PI * 3) * (1 - t / 0.3) * 4;
}

/** A snowball: a white ball with its right side in the dusk's shade. */
function snowball(ctx: CanvasRenderingContext2D, at: Tile, r: number) {
  ctx.fillStyle = colors.snow;
  ctx.beginPath();
  ctx.arc(at.x, at.y, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = colors.snowShade;
  ctx.beginPath();
  ctx.arc(at.x + r * 0.3, at.y + r * 0.2, r * 0.6, 0, Math.PI * 2);
  ctx.fill();
}

/**
 * The striped hood out from the top of the back wall over the targets, and the
 * striped header across the front posts, with bulbs along it. The middle stays
 * open, so the targets show between them.
 */
function stripes(ctx: CanvasRenderingContext2D, spot: Spot, time: number) {
  const top = STALL.wall + STALL.stage;
  const [low, high] = STALL.header;
  const header: Face = {
    a: onSpot(spot, 0.06, 0.07),
    b: onSpot(spot, 0.94, 0.07),
    out: frontOf(spot).out,
  };
  for (let n = 0; n < 10; n++) {
    const [from, to] = [0.03 + (0.94 * n) / 10, 0.03 + (0.94 * (n + 1)) / 10];
    const color = inTurn([colors.berry, colors.snow], n);
    fillShape(
      ctx,
      [
        onSpot(spot, from, 0.78, top),
        onSpot(spot, to, 0.78, top),
        onSpot(spot, to, 0.56, top - 16),
        onSpot(spot, from, 0.56, top - 16),
      ],
      color,
    );
    ctx.fillStyle = color;
    band(ctx, header, n / 10, (n + 1) / 10, low, high);
    ctx.fill();
    const lip = onFace(header, (n + 0.5) / 10, low);
    ctx.beginPath();
    ctx.arc(lip.x, lip.y, 4.5, 0, Math.PI);
    ctx.fill();
    bulb(ctx, lip.x, lip.y + 7, colors.lantern, twinkle(time, n * 2.7));
  }
}

export const drawGameStall: LandmarkDrawer = (ctx, spot, square, paint, time) => {
  stage(ctx, spot, 80);
  // The back wall, dark between its edges, with the targets rocking a little on their pins.
  const back = area(spot, [0.06, 0.94], [0.66, 0.76]);
  block(ctx, back, STALL.wall, colors.cocoa, colors.wood, colors.cocoa, STALL.stage);
  const wall: Face = frontOf(spot, back);
  ctx.fillStyle = colors.night;
  band(ctx, wall, 0.05, 0.95, 70, STALL.wall);
  ctx.fill();
  const t = (time / STALL.throw) % 1;
  for (const [n, [along, lift]] of TARGETS.entries()) {
    const at = onFace(wall, along, lift);
    const hit = n === 1 ? wobble(t) : 0;
    target(ctx, { x: at.x + hit, y: at.y + Math.sin(time / 1300 + n) * 1.5 }, 12);
  }
  // A post at each front corner, holding up the header.
  for (const along of [
    [0.06, 0.11],
    [0.89, 0.94],
  ] as const)
    block(
      ctx,
      area(spot, along, [0.04, 0.1]),
      STALL.header[1],
      colors.gold,
      colors.gold,
      colors.wood,
      STALL.stage,
    );
  // One snowball in flight from the thrower's hand to the middle target, every few seconds.
  const from = releaseFrom(onSpot(spot, THROWER.along, THROWER.deep, STALL.stage));
  const to = onFace(wall, 0.5, 178);
  snowball(
    ctx,
    {
      x: from.x + (to.x - from.x) * t,
      y: from.y + (to.y - from.y) * t - Math.sin(t * Math.PI) * 40,
    },
    5 - t * 2,
  );
  stripes(ctx, spot, time);
  hoodLights(ctx, spot, STALL.wall + STALL.stage, time);
  // The counter, with the square's drawing on its front and a pile of snowballs on top.
  const counter = area(spot, [0.08, 0.92], [0.04, 0.2]);
  block(ctx, counter, STALL.counter, colors.wood, colors.gingerbread, colors.cocoa, STALL.stage);
  framedArt(
    ctx,
    frontOf(spot, counter),
    square,
    paint,
    { from: 0.1, to: 0.9, low: 14 },
    SIGN_STYLES.stall,
  );
  for (const [row, count] of [3, 2, 1].entries())
    for (let k = 0; k < count; k++)
      snowball(
        ctx,
        onSpot(
          spot,
          0.8 + (k - (count - 1) / 2) * 0.05,
          0.12,
          STALL.counter + STALL.stage + 5 + row * 8,
        ),
        5,
      );
  stallLife(ctx, spot, STALL.stage, STALL.header[1], time, t);
  return standing(
    spot,
    corners(spot).top.y - (corners(back).top.y - STALL.wall - STALL.stage) + 10,
  );
};
