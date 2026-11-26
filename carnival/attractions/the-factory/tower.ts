/**
 * The Factory's tower at the back of the slab: TESSL down its front, each
 * letter dark until a shipped booth lights it in gold, windows that warm with
 * every letter, a gold cog on top that turns faster with each, and, once all
 * five are lit, a slow halo of light behind it with gifts tumbling off its top.
 */
import { box, glow, iso } from '../../../src/northpole/diorama';
import { theme } from '../../../src/northpole/theme';
import type { Game } from './game';
import { gift, words } from './text';

const { colors } = theme;

/** The tower, in the slab's units: its back corner, its width and depth, and its height. */
export const TOWER = { gx: -21, gy: -21, w: 10, d: 10, h: 37 };

/** The letters down the tower's front. */
export const LETTERS = ['T', 'E', 'S', 'S', 'L'];

/** Where the cog turns, over the tower's top. */
export const COG = iso(TOWER.gx + TOWER.w / 2, TOWER.gy + TOWER.d / 2, TOWER.h + 6);

/** How big a letter is `since` ms after it lit: a quick swell past full size, then settling. */
export function letterPop(since: number): number {
  if (since < 0) return 1;
  if (since > 600) return 1;
  return 1 + Math.sin((since / 600) * Math.PI) * 0.45;
}

/** How far the cog has turned at `time` with `lit` letters lit: slowly with none, briskly with all five. */
export const cogTurn = (time: number, lit: number) => (time / 4_000) * (0.5 + lit * 0.5);

/** How many of TESSL's letters are lit: one per booth shipped, all five staying lit in a round, the demo's starting over. */
export function litOf(game: Game): number {
  return game.mode === 'play' ? Math.min(LETTERS.length, game.shipped) : game.shipped % 6;
}

/** The gold cog on top. */
function cog(ctx: CanvasRenderingContext2D, turn: number) {
  ctx.save();
  ctx.translate(COG.x, COG.y);
  ctx.rotate(turn);
  ctx.fillStyle = colors.gold;
  for (let n = 0; n < 8; n++) {
    ctx.rotate(Math.PI / 4);
    ctx.fillRect(-0.9, -5.4, 1.8, 2.2);
  }
  ctx.beginPath();
  ctx.arc(0, 0, 4, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = colors.cocoa;
  ctx.beginPath();
  ctx.arc(0, 0, 1.4, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

/** The halo behind the finished tower: soft rays turning slowly, faded in over `ramp` from 0 to 1. */
function halo(ctx: CanvasRenderingContext2D, time: number, ramp: number) {
  ctx.save();
  ctx.translate(COG.x, COG.y + 10);
  ctx.rotate(time / 9_000);
  ctx.fillStyle = colors.glow;
  for (let n = 0; n < 12; n++) {
    ctx.globalAlpha = 0.09 * ramp;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.arc(0, 0, 46, (n / 12) * Math.PI * 2, (n / 12) * Math.PI * 2 + 0.22);
    ctx.fill();
  }
  ctx.restore();
  glow(ctx, COG.x, COG.y + 10, 26, ramp);
}

/** Gift `n` of the fountain off the tower's top, `t` ms into the celebration: up, over and down onto the snow. */
export function fountainGift(n: number, t: number) {
  const life = 2_400;
  const k = (((t / life + n / 6) % 1) + 1) % 1;
  const side = n % 2 ? 1 : -1;
  return {
    x: COG.x + side * k * (10 + (n % 3) * 5),
    y: COG.y + 4 - Math.sin(k * Math.PI * 0.9) * 10 + k * k * 34,
    k,
  };
}

/** The tower and everything on it, as the game stands at `time`. */
export function tower(ctx: CanvasRenderingContext2D, game: Game, time: number) {
  const lit = litOf(game);
  const latest = game.gifts.at(-1) ?? -Infinity;
  const done = lit === LETTERS.length ? latest : undefined;
  const ramp = done === undefined ? 0 : Math.min(1, Math.max(0, (time - done) / 1_500));
  if (ramp > 0) halo(ctx, time, ramp);
  const t = TOWER;
  box(ctx, t.gx, t.gy, t.w, t.d, t.h, colors.snowShade, colors.gingerbread, colors.cocoa);
  // Windows up the shaded side, warmer with every letter lit.
  ctx.fillStyle = colors.glow;
  ctx.globalAlpha = 0.3 + lit * 0.14;
  for (let z = 6; z < t.h - 3; z += 7) {
    for (const along of [t.gy + 3, t.gy + 7]) {
      const at = iso(t.gx + t.w, along, z);
      ctx.fillRect(at.x - 0.9, at.y - 1.6, 1.8, 3.2);
    }
  }
  ctx.globalAlpha = 1;
  LETTERS.forEach((text, n) => {
    const at = iso(t.gx + t.w / 2, t.gy + t.d, t.h - 5 - n * 6.6);
    if (n >= lit) {
      words(ctx, text, at.x, at.y, 5.4, colors.cocoa);
      return;
    }
    glow(ctx, at.x, at.y, 6, 0.9);
    const size = 5.4 * (n === lit - 1 ? letterPop(time - latest) : 1);
    words(ctx, text, at.x + 0.4, at.y + 0.4, size, colors.cocoa);
    words(ctx, text, at.x, at.y, size, colors.gold);
  });
  cog(ctx, cogTurn(time, lit));
  if (done === undefined) return;
  for (let n = 0; n < 6; n++) {
    const g = fountainGift(n, time - done);
    ctx.globalAlpha = ramp * (1 - g.k * g.k);
    gift(ctx, g.x, g.y, 2.4, g.k * 6 * (n % 2 ? 1 : -1));
  }
  ctx.globalAlpha = 1;
}
