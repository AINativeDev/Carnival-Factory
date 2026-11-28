/**
 * Stations 4 and 5, in their bays of the hall. The checks: three bugs
 * scuttle about the test mat until the visitor squashes each one (a SPLAT, a
 * little shake and a gentle spray), then the seven checks on the board above
 * tick green one after another. Code review: a magnifying glass sweeps over
 * the code on the easel, stops on the one finding (a stray sock), and the
 * shepherd trots in and fixes it.
 */
import { theme } from '../../../src/northpole/theme';
import { BUGS, bugPlace } from './bugs';
import { sheep } from './folk';
import { burst, ring, shake } from './juice';
import { letters, popIn, rounded, smooth, tick, TYPE } from './kit';
import type { Moment } from './moment';
import { surface } from './ui';

const { colors } = theme;

/** The checks that tick green once the bugs are gone. */
const CHECKS = ['lint', 'types', 'tests', 'ownership', 'size', 'smoke test', 'preview'] as const;

/** A bug: a round body with spots, six legs pattering and feelers, heading left or right. */
function bug(ctx: CanvasRenderingContext2D, x: number, y: number, heading: number, time: number) {
  ctx.save();
  ctx.translate(x, y);
  ctx.fillStyle = colors.shadow;
  ctx.globalAlpha = 0.3;
  ctx.beginPath();
  ctx.ellipse(1, 3.4, 4.6, 1.3, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = 1;
  ctx.scale(heading < 0 ? -1.6 : 1.6, 1.6);
  ctx.strokeStyle = colors.ink;
  ctx.lineWidth = 0.5;
  ctx.beginPath();
  for (let n = 0; n < 3; n++) {
    const step = Math.sin(time / 60 + n * 2) * 0.8;
    ctx.moveTo(-1.5 + n * 1.5, 0);
    ctx.lineTo(-2 + n * 1.5 + step, 2.4);
    ctx.moveTo(-1.5 + n * 1.5, 0);
    ctx.lineTo(-2 + n * 1.5 - step, -2.4);
  }
  ctx.moveTo(2.5, -0.5);
  ctx.lineTo(4.5, -2.5);
  ctx.stroke();
  ctx.fillStyle = colors.berry;
  ctx.beginPath();
  ctx.ellipse(0, 0, 3, 2.2, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = colors.ink;
  ctx.beginPath();
  ctx.arc(2.6, 0, 1.2, 0, Math.PI * 2);
  ctx.arc(-0.8, -0.6, 0.5, 0, Math.PI * 2);
  ctx.arc(0.6, 0.8, 0.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

/** The last bug squashed, `since` ms ago at `at`: a splat, a ring, a spray and the word. */
function splat(ctx: CanvasRenderingContext2D, at: { x: number; y: number }, since: number) {
  ring(ctx, at.x, at.y, since, 10, colors.gold);
  burst(ctx, at.x, at.y, since, { count: 9, reach: 8, colours: [colors.berry, colors.gold] });
  if (since >= 900) return;
  ctx.globalAlpha = 1 - smooth((since - 500) / 400);
  ctx.fillStyle = colors.ink;
  ctx.beginPath();
  ctx.ellipse(at.x, at.y + 1, 4.5 * popIn(since / 160), 1.6, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = colors.gold;
  letters(ctx, 4.4 * popIn(since / 220));
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('SPLAT!', at.x, at.y - 6);
  ctx.globalAlpha = 1;
}

/** The board of checks on the wall: waiting grey, then each one ticking green in turn once the bugs are gone. */
function board(ctx: CanvasRenderingContext2D, green: boolean, since: number) {
  surface(ctx, { x: 44, y: 25, w: 52, h: 21.5 });
  letters(ctx, TYPE.body);
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  CHECKS.forEach((check, n) => {
    const x = 46.5 + (n >= 4 ? 25 : 0);
    const y = 28.6 + (n % 4) * 4.9;
    const on = green ? popIn((since - 200 - n * 160) / 260) : 0;
    ctx.save();
    ctx.translate(x + 2, y);
    const size = on > 0 ? on : 1;
    ctx.scale(size, size);
    ctx.fillStyle = on > 0 ? colors.mint : colors.slabShade;
    ctx.globalAlpha = on > 0 ? 1 : 0.35;
    rounded(ctx, -2, -2.1, 22.5, 4.2, 2);
    ctx.fill();
    ctx.globalAlpha = on > 0 ? 1 : 0.6;
    ctx.strokeStyle = colors.pineDark;
    ctx.lineWidth = 0.6;
    if (on > 0) tick(ctx, 0.6, 0, 1.1);
    ctx.fillStyle = on > 0 ? colors.night : colors.snow;
    ctx.fillText(check, 3, 0.2, 17);
    ctx.globalAlpha = 1;
    ctx.restore();
  });
}

/** The checks: bugs until squashed, then each check ticking green in turn. */
export function checksScene(ctx: CanvasRenderingContext2D, moment: Moment) {
  const { visit, since, time } = moment;
  const squashed = visit.squashed;
  board(ctx, squashed.length >= BUGS, since);
  const jolt = squashed.length > 0 ? shake(since, 0.9) : { x: 0, y: 0 };
  ctx.save();
  ctx.translate(jolt.x, jolt.y);
  for (let n = 0; n < BUGS; n++) {
    if (squashed.includes(n)) continue;
    const place = bugPlace(n, time);
    bug(ctx, place.x, place.y, place.heading, time);
  }
  const last = squashed.at(-1);
  if (last !== undefined) splat(ctx, bugPlace(last, visit.at), since);
  ctx.restore();
}

/** The code on the easel: a sheet of grey lines, the sock's line marked or fixed. */
function code(ctx: CanvasRenderingContext2D, beat: number, since: number) {
  ctx.globalAlpha = 0.45;
  ctx.fillStyle = colors.shadow;
  rounded(ctx, 41, 27.6, 38, 26, 1.4);
  ctx.fill();
  ctx.globalAlpha = 1;
  ctx.fillStyle = colors.snowLit;
  rounded(ctx, 40, 27, 38, 26, 1.4);
  ctx.fill();
  [28, 20, 31, 16, 26, 22].forEach((w, n) => {
    const fixed = n === 3 && beat >= 2 && since > 700;
    ctx.fillStyle = fixed ? colors.mint : colors.slab;
    rounded(ctx, 44, 30 + n * 3.8 - 0.9, w, 1.8, 0.9);
    ctx.fill();
  });
  if (beat !== 1) return;
  // The stray sock, poking out of line four.
  ctx.fillStyle = colors.berry;
  ctx.beginPath();
  ctx.moveTo(61, 39.5);
  ctx.lineTo(64, 39.5);
  ctx.lineTo(64, 43.5);
  ctx.lineTo(66.5, 44);
  ctx.lineTo(66, 46);
  ctx.lineTo(61.5, 45);
  ctx.closePath();
  ctx.fill();
}

/** Code review: the glass sweeping, the finding circled, then the shepherd's fix. */
export function reviewScene(ctx: CanvasRenderingContext2D, moment: Moment) {
  const { visit, since, time } = moment;
  code(ctx, visit.beat, since);
  const gx = visit.beat === 0 ? 59 + Math.sin(time / 600) * 13 : 63.5;
  const gy = visit.beat === 0 ? 39 + Math.cos(time / 900) * 6 : 42.5;
  if (visit.beat === 1) ring(ctx, gx, gy, since, 10, colors.berry);
  if (visit.beat < 2) {
    ctx.fillStyle = colors.ice;
    ctx.globalAlpha = 0.25;
    ctx.beginPath();
    ctx.arc(gx, gy, 5.4, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
    ctx.strokeStyle = visit.beat === 1 ? colors.berry : colors.wood;
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.arc(gx, gy, 6, 0, Math.PI * 2);
    ctx.moveTo(gx + 4.3, gy + 4.3);
    ctx.lineTo(gx + 10, gy + 10);
    ctx.stroke();
  }
  sheep(ctx, 88, 70, 20, visit.beat >= 2 ? smooth(since / 700) : 0, time);
  if (visit.beat < 2 || since <= 700) return;
  burst(ctx, 62, 41.4, since - 700, { count: 8, reach: 10, colours: [], stars: true, seed: 9 });
  ctx.strokeStyle = colors.pine;
  ctx.lineWidth = 1;
  tick(ctx, 74, 41.4, 2);
}
