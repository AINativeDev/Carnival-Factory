/**
 * The card table itself and what stands around it: the table with its green
 * baize, the lantern hanging over it and the gold chips that keep the score.
 * Everything else on the table is placed from `TOP` and `SPOTS`.
 */
import { box, glow, iso, shadow } from '../../../src/northpole/diorama';
import { theme } from '../../../src/northpole/theme';
import { line, poly } from './brush';
import type { Ctx } from './brush';
import type { Player } from './deck';

const { colors } = theme;

const TABLE = { gx: -8, gy: -8, w: 16, d: 16, h: 8 };
/** The height of the baize, where every card, stack and chip lies. */
export const TOP = TABLE.h + 0.8;
/** Where each elf's stack, the pile and the deck lie on the table, in ground units. */
export const SPOTS = {
  hands: [
    { gx: -4.4, gy: 4 },
    { gx: 4, gy: -4.4 },
  ],
  pile: { gx: 0, gy: 0 },
} as const;

/** The score for each elf: a little stack of gold chips beside their cards. */
export function chips(ctx: Ctx, who: Player, count: number) {
  const spot = who === 0 ? { gx: -5, gy: -2.4 } : { gx: -2.4, gy: -5 };
  for (let n = 0; n < count; n++) {
    const p = iso(spot.gx, spot.gy, TOP + n * 0.6);
    ctx.fillStyle = colors.gingerbread;
    ctx.beginPath();
    ctx.ellipse(p.x, p.y + 0.3, 1.3, 0.65, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = colors.gold;
    ctx.beginPath();
    ctx.ellipse(p.x, p.y, 1.3, 0.65, 0, 0, Math.PI * 2);
    ctx.fill();
  }
}

/** The lantern on its post, hanging over the middle of the table, flickering from `time`. */
export function lantern(ctx: Ctx, time: number) {
  const post = { gx: -12, gy: -12 };
  const base = iso(post.gx, post.gy);
  const tip = iso(post.gx, post.gy, 32);
  const hook = iso(0, 0, 32);
  shadow(ctx, base.x, base.y, 3);
  line(ctx, colors.cocoa, 0.9, base, tip);
  line(ctx, colors.cocoa, 0.6, tip, hook);
  const lamp = iso(0, 0, 27);
  line(ctx, colors.ink, 0.25, hook, lamp);
  const flicker = 0.9 + 0.1 * Math.sin(time / 700) * Math.sin(time / 330);
  glow(ctx, lamp.x, lamp.y + 2, 20, flicker);
  ctx.fillStyle = colors.cocoa;
  ctx.fillRect(lamp.x - 1.8, lamp.y - 0.8, 3.6, 1);
  ctx.fillStyle = colors.lantern;
  ctx.globalAlpha = flicker;
  ctx.fillRect(lamp.x - 1.4, lamp.y, 2.8, 3.4);
  ctx.globalAlpha = 1;
  ctx.fillStyle = colors.cocoa;
  ctx.fillRect(lamp.x - 1.8, lamp.y + 3.4, 3.6, 0.8);
}

/** The wooden table on four legs, its top covered in green baize. */
export function table(ctx: Ctx) {
  const { gx, gy, w, d, h } = TABLE;
  const feet = iso(0, 0);
  shadow(ctx, feet.x, feet.y + 1, 22);
  // Four legs, then the top with its green baize.
  const legs: [number, number][] = [
    [gx + 0.4, gy + d - 1.4],
    [gx + w - 1.4, gy + d - 1.4],
    [gx + w - 1.4, gy + 0.4],
    [gx + 0.4, gy + 0.4],
  ];
  for (const [lx, ly] of legs) {
    box(ctx, lx, ly, 1, 1, h - 1, colors.wood, colors.wood, colors.cocoa);
  }
  box(ctx, gx, gy, w, d, 1, colors.wood, colors.gingerbread, colors.cocoa, h - 0.4);
  poly(ctx, colors.pine, [
    iso(gx + 0.8, gy + 0.8, TOP),
    iso(gx + w - 0.8, gy + 0.8, TOP),
    iso(gx + w - 0.8, gy + d - 0.8, TOP),
    iso(gx + 0.8, gy + d - 0.8, TOP),
  ]);
}
