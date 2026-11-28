/**
 * The tour's last scene, the factory: a warm-lit hall at the back with its
 * chimney smoking, and in front of it the loops chained along one belt, a
 * small workshop for each, ASSESS, BUILD, CHECKS, REVIEW and MERGE, with a gate
 * lamp between each pair that lights mint once the parcel is through. Agents
 * work the middle stations, and at the front a person writes the skills and
 * specs that steer it all.
 */
import { box, glow } from '../../../src/northpole/diorama';
import { theme } from '../../../src/northpole/theme';
import { agent, person, sign } from './props';
import { gift } from './text';
import { CHAIN } from './tour-copy';
import { popIn } from './ui';
import { belt, hut, lamp, ON_BELT, patch, smoke } from './works';

const { colors } = theme;

/** How long the parcel takes down the whole belt, in ms. */
const LAP = 8_000;

/** Where the factory's parcel is along its belt at `time`, from 0 at the left to 1 at the right. */
export const chainAt = (time: number) => (time % LAP) / LAP;

/** Where each station's workshop stands along the belt, left to right. */
export const STATION_X = [18, 34, 50, 66, 82] as const;

/** The belt's line across the slab, and where it starts and ends. */
const BELT = { y: 66, from: 12, to: 88 };

/** Where the parcel is on screen at `time`. */
export const chainX = (time: number) => BELT.from + 2 + chainAt(time) * (BELT.to - BELT.from - 4);

/** The hall at the back: lit windows down both sides, and a chimney with slow smoke. */
function hall(ctx: CanvasRenderingContext2D, time: number) {
  glow(ctx, 50, 52, 26, 0.9);
  box(ctx, -20, -20, 12, 12, 11, colors.snowLit, colors.gingerbread, colors.cocoa);
  ctx.fillStyle = colors.berry;
  patch(ctx, -20, -8, true, 0, 12, 9.8, 1.2);
  ctx.fill();
  for (const [alongX, warm] of [
    [true, 0.95],
    [false, 0.6],
  ] as const) {
    ctx.fillStyle = colors.lantern;
    ctx.globalAlpha = warm;
    for (let u = 1.4; u < 11; u += 2.6) {
      for (const z of [2.6, 6.4]) {
        patch(ctx, alongX ? -20 : -8, alongX ? -8 : -20, alongX, u, 1.4, z, 2.4);
        ctx.fill();
      }
    }
  }
  ctx.globalAlpha = 1;
  box(ctx, -17, -17, 2.4, 2.4, 4, colors.snowLit, colors.slabShade, colors.mountain, 11);
  smoke(ctx, 50, 34.5, time);
}

/** A slip of paper on the belt, the request before it's built into anything. */
function slip(ctx: CanvasRenderingContext2D, x: number, y: number) {
  ctx.fillStyle = colors.cream;
  ctx.fillRect(x - 1.6, y - 4, 3.2, 4);
  ctx.fillStyle = colors.ink;
  for (const at of [-3.2, -2.2, -1.2]) ctx.fillRect(x - 1, y + at, 2, 0.35);
}

/** The stations, their gates and the belt, with the parcel riding down it: a request until it's built, a gift after. */
function line(ctx: CanvasRenderingContext2D, time: number) {
  const x = chainX(time);
  STATION_X.forEach((at, n) => {
    hut(ctx, at, 63.6, 4, 6, n === STATION_X.length - 1 ? colors.gold : colors.berry);
  });
  STATION_X.slice(0, -1).forEach((at) => {
    const gate = at + 8;
    lamp(ctx, gate, 64.2, 7, Math.max(0, Math.min(1, (x - gate - 1) / 2.5)));
  });
  CHAIN.forEach((name, n) => {
    sign(ctx, name, STATION_X.at(n) ?? 50, 50.5);
  });
  belt(ctx, BELT.from, BELT.to, BELT.y, (time / LAP) * 72);
  glow(ctx, x, BELT.y - 3, 5, 0.7);
  if (x < (STATION_X.at(1) ?? 34)) slip(ctx, x, BELT.y - ON_BELT);
  else gift(ctx, x, BELT.y - ON_BELT, 3);
  for (const at of [34, 50, 66]) agent(ctx, at + 3.5, 73, time, 0.55, colors.mint);
}

/** The person at the front, writing the skills and specs on a long scroll. */
function writer(ctx: CanvasRenderingContext2D, time: number) {
  glow(ctx, 47, 76, 10, 0.8);
  person(ctx, 44, 81, colors.violet);
  ctx.fillStyle = colors.cream;
  ctx.fillRect(46.4, 73, 4.2, 5.4);
  ctx.fillStyle = colors.snowShade;
  ctx.fillRect(46.4, 78, 4.2, 0.6);
  ctx.fillStyle = colors.gold;
  const written = 1 + Math.floor((time / 700) % 4);
  for (let n = 0; n < written; n++)
    ctx.fillRect(47.1, 74 + n * 1.05, n === written - 1 ? 1.6 : 2.8, 0.4);
}

/** The factory: the hall, then the line, then the writer, each popping up as the step begins. */
export function factoryScene(ctx: CanvasRenderingContext2D, time: number, since: number) {
  popIn(ctx, 50, 58, since, 0, () => {
    hall(ctx, time);
  });
  popIn(ctx, 50, 66, since, 120, () => {
    line(ctx, time);
  });
  popIn(ctx, 44, 81, since, 260, () => {
    writer(ctx, time);
  });
}
