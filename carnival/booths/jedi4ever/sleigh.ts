/**
 * The sleigh at the end of the line: when its bells jingle for a full sack,
 * how many sacks the counter on the wall shows, and drawing it.
 */
import { theme } from '../../../src/northpole/theme';
import { circle, type Ctx } from './brushes';
import { IN_THE_SACK, LETTERS, LOOP, SLOT } from './letters';
import { wrap } from './motion';

const { colors } = theme;

/** The round's last toy lands in the sack this long after the round starts. */
const LAST_LANDING = (LETTERS.length - 1) * SLOT + IN_THE_SACK;
/** The first jingle: the rocket already on the belt at time 0 lands within the first loop. */
const FIRST_LANDING = wrap(LAST_LANDING, LOOP);
/** How long the bells wiggle after a full sack. */
export const JINGLE = 1_500;

/** How hard the sleigh's bells are wiggling, 0 to 1, just after each round's last toy lands. */
export function jingleAt(time: number): number {
  const since = wrap(time - LAST_LANDING, LOOP);
  return since < JINGLE ? Math.sin((since / JINGLE) * Math.PI) : 0;
}

/** The counter on the wall: how many times the sleigh has jingled since `time` began. */
export function sacksFilled(time: number): number {
  return time < FIRST_LANDING ? 0 : Math.floor((time - FIRST_LANDING) / LOOP) + 1;
}

/** The sleigh with its sack, its bells wiggling when a sack fills. */
export function drawSleigh(ctx: Ctx, u: number, time: number) {
  ctx.fillStyle = colors.gingerbread;
  circle(ctx, 91 * u, 68 * u, 7 * u);
  ctx.fillStyle = colors.cocoa;
  ctx.fillRect(89 * u, 60 * u, 4 * u, 1.4 * u);
  ctx.fillStyle = colors.berry;
  ctx.beginPath();
  ctx.moveTo(82 * u, 72 * u);
  ctx.lineTo(99 * u, 72 * u);
  ctx.lineTo(99 * u, 84 * u);
  ctx.lineTo(85 * u, 84 * u);
  ctx.quadraticCurveTo(81 * u, 80 * u, 82 * u, 72 * u);
  ctx.fill();
  ctx.strokeStyle = colors.gold;
  ctx.lineWidth = 0.9 * u;
  ctx.beginPath();
  ctx.moveTo(84 * u, 87 * u);
  ctx.lineTo(99 * u, 87 * u);
  ctx.moveTo(84 * u, 87 * u);
  ctx.quadraticCurveTo(80 * u, 87 * u, 81 * u, 84 * u);
  ctx.moveTo(87 * u, 84 * u);
  ctx.lineTo(87 * u, 87 * u);
  ctx.moveTo(96 * u, 84 * u);
  ctx.lineTo(96 * u, 87 * u);
  ctx.stroke();
  const wiggle = jingleAt(time) * Math.sin(time / 90) * 0.5;
  for (const [bx, phase] of [
    [84.5, 0],
    [88, 1],
  ] as const) {
    ctx.save();
    ctx.translate(bx * u, 73 * u);
    ctx.rotate(wiggle * (phase ? -1 : 1));
    ctx.fillStyle = colors.gold;
    circle(ctx, 0, 2.6 * u, 1.4 * u);
    ctx.restore();
  }
}
