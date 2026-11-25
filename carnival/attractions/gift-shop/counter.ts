/** The wrapping counter in front of the shop, with the present being wrapped on it so far. */
import { box, iso, shadow } from '../../../src/northpole/diorama';
import { theme } from '../../../src/northpole/theme';
import { parcel, type Look } from './parcel';
import type { Ctx } from './shopfront';
import { paperOf, ribbonOf, type Wrapping } from './wrapping';

const { colors } = theme;

/** The counter's north corner, its size and its height. */
const COUNTER = { gx: 9, gy: 4, w: 10, d: 5, h: 5 };

/** The present on the counter: plain card until the paper's chosen, then paper, then its ribbon. */
export function onCounter({ step, paper, ribbon }: Wrapping): Look {
  if (step === 0) return { paper: colors.gingerbread };
  const wrap = paperOf(paper);
  return step === 1 ? { paper: wrap } : { paper: wrap, ribbon: ribbonOf(ribbon) };
}

/** The counter, a roll of each paper leaning behind it and the present on top, breathing in a warm light. */
export function counter(ctx: Ctx, time: number, wrapping: Wrapping) {
  const { gx, gy, w, d, h } = COUNTER;
  const middle = iso(gx + w / 2, gy + d / 2);
  shadow(ctx, middle.x + 1, middle.y + 2, 26);
  // The paper rolls stand behind the counter, so they're drawn first.
  for (let n = 0; n < 4; n++) {
    const foot = iso(gx + 2 + n * 2.6, gy - 1);
    ctx.fillStyle = paperOf(n);
    ctx.fillRect(foot.x - 0.9, foot.y - 9, 1.8, 9);
    ctx.fillStyle = ribbonOf(n);
    ctx.fillRect(foot.x - 0.9, foot.y - 9, 1.8, 0.8);
  }
  box(ctx, gx, gy, w, d, h, colors.cream, colors.wood, colors.cocoa);
  const top = iso(gx + w / 2, gy + d / 2, h);
  ctx.fillStyle = colors.glow;
  ctx.globalAlpha = 0.25 + 0.1 * Math.sin(time / 1200);
  ctx.beginPath();
  ctx.ellipse(top.x, top.y, 7, 3.5, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = 1;
  parcel(ctx, { gx: gx + 2.5, gy, z: h, s: 5 }, onCounter(wrapping));
}
