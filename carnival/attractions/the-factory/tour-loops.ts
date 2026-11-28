/**
 * The tour's third scene, Loops: three of the factory's own loops from
 * tessl.json, one at a time. Something lands in the inbox on the left (an
 * issue, the tessl label, a review comment), rides the belt into the loop's
 * workshop, where the agent runs it with its skill, and comes out the other
 * side through a gate that lights mint once the result is checked. The caption
 * below names the loop's WHEN, its LOOP and skill, and its RESULT, each lit in
 * turn as the parcel reaches that part.
 */
import { box, glow } from '../../../src/northpole/diorama';
import { theme } from '../../../src/northpole/theme';
import { agent, groundAt, sign, tick } from './props';
import { eyebrow, gift, words } from './text';
import { LOOP_ROWS } from './tour-copy';
import { panel, popIn } from './ui';
import { belt, hut, lamp, ON_BELT } from './works';

const { colors } = theme;

/** How long one loop takes to run through, in ms. */
const ROW_TIME = 3_600;

/** Which loop is running at `time`, and how far through it is, from 0 to 1. */
export function loopRunAt(time: number) {
  return {
    row: Math.floor(time / ROW_TIME) % LOOP_ROWS.length,
    along: (time % ROW_TIME) / ROW_TIME,
  };
}

/** The part of a loop `along` is in: 0 waking, 1 running, 2 checked. */
export const partOf = (along: number) => (along < 0.25 ? 0 : along < 0.62 ? 1 : 2);

/** Where the parcel is along the belt `along` of the way through a loop, or undefined while it's in the workshop. */
export function parcelAt(along: number): number | undefined {
  if (along < 0.15) return 24;
  if (along < 0.42) return 24 + ((along - 0.15) / 0.27) * 22;
  if (along < 0.55) return undefined;
  return 54 + Math.min(1, (along - 0.55) / 0.35) * 26;
}

/** What woke loop `row`, as a small thing standing on `x`, `y`: an issue's page, the label, or a comment. */
function wakeUp(ctx: CanvasRenderingContext2D, row: number, x: number, y: number) {
  if (row === 0) {
    ctx.fillStyle = colors.cream;
    ctx.fillRect(x - 1.6, y - 4, 3.2, 4);
    ctx.fillStyle = colors.ink;
    for (const at of [-3.2, -2.2, -1.2]) ctx.fillRect(x - 1, y + at, 2, 0.35);
    return;
  }
  if (row === 1) {
    ctx.fillStyle = colors.gold;
    ctx.beginPath();
    ctx.moveTo(x - 2.2, y - 3);
    ctx.lineTo(x + 1.2, y - 3);
    ctx.lineTo(x + 2.4, y - 1.6);
    ctx.lineTo(x + 1.2, y - 0.2);
    ctx.lineTo(x - 2.2, y - 0.2);
    ctx.fill();
    ctx.fillStyle = colors.night;
    ctx.beginPath();
    ctx.arc(x + 1, y - 1.6, 0.4, 0, Math.PI * 2);
    ctx.fill();
    return;
  }
  ctx.fillStyle = colors.snowLit;
  ctx.beginPath();
  ctx.roundRect(x - 2.2, y - 4, 4.4, 3, 1);
  ctx.moveTo(x - 1, y - 1);
  ctx.lineTo(x - 1.4, y + 0.2);
  ctx.lineTo(x, y - 1);
  ctx.fill();
  ctx.fillStyle = colors.ink;
  for (const at of [-1.2, 0, 1.2]) ctx.fillRect(x + at - 0.3, y - 2.8, 0.6, 0.6);
}

/** The inbox on its post at the belt's start, with what woke the loop rising out of it. */
function inbox(ctx: CanvasRenderingContext2D, row: number, along: number) {
  const { gx, gy } = groundAt(20, 64);
  ctx.fillStyle = colors.cocoa;
  ctx.fillRect(19.6, 58, 0.8, 6);
  box(ctx, gx - 3, gy - 3, 3, 3, 3, colors.snowLit, colors.berry, colors.cocoa, 5);
  if (along >= 0.15) return;
  const rise = Math.min(1, along / 0.08);
  glow(ctx, 20, 52, 6, rise);
  ctx.globalAlpha = rise;
  wakeUp(ctx, row, 20, 56 - rise * 3);
  ctx.globalAlpha = 1;
}

/** The loop's scene at `along`: inbox, belt, workshop with its agent, gate and the tick once it's checked. */
function works(ctx: CanvasRenderingContext2D, row: number, along: number, time: number) {
  const loop = LOOP_ROWS.at(row) ?? LOOP_ROWS[0];
  const x = parcelAt(along);
  glow(ctx, 50, 58, 18, 0.9);
  inbox(ctx, row, along);
  hut(ctx, 50, 62, 6, 8, colors.gold, partOf(along) === 1 ? 1 : 0.5);
  agent(ctx, 61, 63.6, time, 0.8, partOf(along) === 1 ? colors.mint : colors.gold);
  const passed = x === undefined ? 0 : Math.max(0, Math.min(1, (x - 69) / 2.5));
  lamp(ctx, 68, 64, 8, passed);
  belt(ctx, 18, 84, 66, (time / ROW_TIME) * 30);
  if (x !== undefined) {
    if (x < 50) wakeUp(ctx, row, x, 66 - ON_BELT);
    else gift(ctx, x, 66 - ON_BELT, 3);
  }
  sign(ctx, loop.loop, 50, 44);
  tick(ctx, 68, 47.5, 1.8, passed);
}

/** One line of the caption: its label, then its words, bright while its part of the loop runs. */
function line(
  ctx: CanvasRenderingContext2D,
  label: string,
  y: number,
  on: boolean,
  text: string,
  more = '',
) {
  ctx.globalAlpha = on ? 1 : 0.55;
  eyebrow(ctx, label, 11, y, on ? colors.gold : colors.muted);
  const wide = words(ctx, text, 30, y, 3, colors.snow, 'left', 60);
  if (more) words(ctx, more, 30 + wide + 1.6, y, 3, colors.muted, 'left', 58 - wide);
  ctx.globalAlpha = 1;
}

/** The caption: the running loop's WHEN, LOOP and skill, and RESULT, and which of the three it is. */
function caption(ctx: CanvasRenderingContext2D, row: number, along: number) {
  const loop = LOOP_ROWS.at(row) ?? LOOP_ROWS[0];
  const part = partOf(along);
  panel(ctx, { x: 6, y: 69, w: 88, h: 15 });
  line(ctx, 'When', 72.8, part === 0, loop.when);
  line(ctx, 'Loop', 76.6, part === 1, loop.loop, loop.skill);
  line(ctx, 'Result', 80.4, part === 2, loop.then);
  LOOP_ROWS.forEach((_, n) => {
    ctx.fillStyle = n === row ? colors.gold : colors.muted;
    ctx.globalAlpha = n === row ? 1 : 0.45;
    ctx.beginPath();
    ctx.arc(83 + n * 3.4, 72.8, n === row ? 1 : 0.75, 0, Math.PI * 2);
    ctx.fill();
  });
  ctx.globalAlpha = 1;
}

/** Loops: one of the factory's loops running at a time, popping up as the step begins, captioned below. */
export function loopsScene(ctx: CanvasRenderingContext2D, time: number, since: number) {
  const { row, along } = loopRunAt(time);
  // Two units further back on the slab, which on screen is straight up, to leave the caption room.
  ctx.save();
  ctx.translate(0, -2);
  popIn(ctx, 50, 66, since, 0, () => {
    works(ctx, row, along, time);
  });
  ctx.restore();
  caption(ctx, row, along);
}
