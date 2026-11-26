/**
 * The build loop on the slab: a round belt that carries the parcel from
 * request through build and review to merge, its rollers moving with it, the
 * parcel itself, built up as it goes, and the hopper in the loop's middle.
 */
import { drum, glow, iso, type Point } from '../../../src/northpole/diorama';
import { theme } from '../../../src/northpole/theme';
import { type Game, levelOf, progressOf } from './game';
import { alongOf, SKILLS } from './rules';
import { gift, words } from './text';

const { colors } = theme;

/** The loop round the slab's middle: its centre and its radius, in the slab's units. */
export const LOOP = { gx: 2, gy: 2, r: 17, width: 2.6, height: 1.6 };

/** How far down the screen the loop's middle is: a parcel or station above it is behind the hopper. */
export const LOOP_MIDDLE = iso(LOOP.gx, LOOP.gy).y;

/** The spot `along` of the way round the loop from request, `out` from its middle line, `z` up. */
export function onLoop(along: number, out = 0, z = 0): Point {
  // Request at the loop's far left corner, so each arch spans the belt along one of the slab's sides.
  const a = Math.PI + along * Math.PI * 2;
  const r = LOOP.r + out;
  return iso(LOOP.gx + Math.cos(a) * r, LOOP.gy + Math.sin(a) * r, z);
}

/** A ring of the loop `out` from its middle line, `z` up, as a path. */
function ring(ctx: CanvasRenderingContext2D, out: number, z: number) {
  ctx.beginPath();
  for (let n = 0; n <= 48; n++) {
    const p = onLoop(n / 48, out, z);
    if (n) ctx.lineTo(p.x, p.y);
    else ctx.moveTo(p.x, p.y);
  }
  ctx.closePath();
}

/** The belt: its dark side, its top with rollers moving as the parcel rides, and the snow inside it. */
export function belt(ctx: CanvasRenderingContext2D, game: Game) {
  const phase = alongOf(game.leg, progressOf(game));
  const { width: w, height: h } = LOOP;
  ctx.fillStyle = colors.night;
  ring(ctx, w, 0);
  ctx.fill();
  ctx.fillStyle = colors.surface;
  ring(ctx, w, h);
  ctx.fill();
  ctx.fillStyle = colors.slabShade;
  ring(ctx, -w, h);
  ctx.fill();
  ctx.save();
  ring(ctx, -w, h);
  ctx.clip();
  ctx.fillStyle = colors.snow;
  ring(ctx, -w, 0);
  ctx.fill();
  ctx.restore();
  ctx.strokeStyle = colors.mountainFar;
  ctx.lineWidth = 0.35;
  for (let n = 0; n < 40; n++) {
    const along = (n / 40 + phase) % 1;
    const from = onLoop(along, -w * 0.8, h);
    const to = onLoop(along, w * 0.8, h);
    ctx.beginPath();
    ctx.moveTo(from.x, from.y);
    ctx.lineTo(to.x, to.y);
    ctx.stroke();
  }
}

/** A crate `h` high standing on the origin. */
function crate(ctx: CanvasRenderingContext2D, h: number) {
  ctx.fillStyle = colors.gingerbread;
  ctx.fillRect(-1.8, -h, 3.6, h);
  ctx.fillStyle = colors.cocoa;
  ctx.fillRect(0, -h, 1.8, h);
  ctx.fillStyle = colors.wood;
  ctx.fillRect(-1.8, -h, 3.6, 0.5);
}

/** A request standing on the origin: a sheet of paper, written on once request has passed it. */
function slip(ctx: CanvasRenderingContext2D, written: boolean) {
  ctx.fillStyle = colors.cream;
  ctx.fillRect(-1.6, -4.2, 3.2, 4.2);
  ctx.fillStyle = colors.snowShade;
  ctx.fillRect(0.6, -4.2, 1, 1);
  ctx.fillStyle = written ? colors.ink : colors.snowShade;
  for (const [y, w] of [
    [-3.2, 2.2],
    [-2.2, 2.4],
    [-1.2, 1.6],
  ] as const) {
    ctx.fillRect(-1.1, y, w, 0.35);
  }
}

/**
 * The parcel, drawn as far as it has been built: a blank slip heading for
 * request, a written one heading for build, a crate rising as it heads for
 * review and a wrapped booth heading for merge. It shakes while the belt jams.
 */
export function parcel(ctx: CanvasRenderingContext2D, game: Game, time: number) {
  const along = alongOf(game.leg, progressOf(game));
  const shake = time < game.jamUntil ? Math.sin(time / 35) * 0.5 : 0;
  const at = onLoop(along, 0, LOOP.height);
  glow(ctx, at.x, at.y - 3, 8, game.answer === 'right' ? 1 : 0.4);
  ctx.save();
  ctx.translate(at.x + shake, at.y);
  ctx.scale(1.5, 1.5);
  if (game.leg < 2) slip(ctx, game.leg === 1);
  else if (game.leg === 2) crate(ctx, 1 + Math.min(1, progressOf(game) * 3) * 2.6);
  else gift(ctx, 0, 0, 3.6);
  ctx.restore();
}

/** Whether the parcel is on the back half of the loop, behind the hopper. */
export function parcelBehind(game: Game): boolean {
  return onLoop(alongOf(game.leg, progressOf(game))).y < LOOP_MIDDLE;
}

/** The hopper in the loop's middle, the four skills' gems circling over it and the level on its sign. */
export function hopper(ctx: CanvasRenderingContext2D, game: Game, time: number) {
  const foot = iso(LOOP.gx, LOOP.gy);
  const turn = alongOf(game.leg, progressOf(game)) * 8;
  drum(ctx, foot.x, foot.y, 5.5, 4, [colors.gingerbread, colors.cocoa], 6, turn, colors.ink);
  glow(ctx, foot.x, foot.y - 6, 9, 0.7);
  SKILLS.forEach((skill, n) => {
    const a = time / 1_400 + (n / SKILLS.length) * Math.PI * 2;
    const x = foot.x + Math.cos(a) * 4.2;
    const y = foot.y - 8 + Math.sin(a) * 1.6;
    ctx.fillStyle = skill.color;
    ctx.beginPath();
    ctx.moveTo(x, y - 1.1);
    ctx.lineTo(x + 0.8, y);
    ctx.lineTo(x, y + 1.1);
    ctx.lineTo(x - 0.8, y);
    ctx.fill();
  });
  if (game.mode !== 'play') return;
  ctx.fillStyle = colors.ink;
  ctx.beginPath();
  ctx.roundRect(foot.x - 6, foot.y - 15.6, 12, 4, 1);
  ctx.fill();
  words(ctx, `LEVEL ${String(levelOf(game.shipped))}`, foot.x, foot.y - 13.5, 2.6, colors.glow);
}
