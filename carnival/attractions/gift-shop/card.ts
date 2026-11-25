/**
 * The card in front of the shop. While a present is being wrapped it asks
 * for this step's pick and shows the four swatches to tap; once it's wrapped
 * it turns into the gift's tag: its name, what it does and how to take it home.
 */
import { shadow } from '../../../src/northpole/diorama';
import { theme } from '../../../src/northpole/theme';
import { type Gift, installCommand } from './gifts';
import { bowOn } from './parcel';
import { type Ctx, words } from './shopfront';
import {
  SHELF,
  bowOf,
  giftJustWrapped,
  giftOnCounter,
  paperOf,
  revealing,
  ribbonOf,
  stepOf,
  swatchBox,
  type Wrapping,
} from './wrapping';

const { colors } = theme;

/** The card's paper, its shadow and the gift's colour down its left edge. */
function blank(ctx: Ctx, wrap: string) {
  // Centred high enough that the shadow's soft lower edge (a fifth of its width below) stays in the square.
  shadow(ctx, 50, 91.5, 42);
  ctx.fillStyle = colors.shadow;
  ctx.globalAlpha = 0.25;
  ctx.fillRect(8.6, 78.6, 84, 19);
  ctx.globalAlpha = 1;
  ctx.fillStyle = colors.cream;
  ctx.fillRect(8, 78, 84, 19);
  ctx.fillStyle = wrap;
  ctx.fillRect(8, 78, 2.5, 19);
}

/** The gift's tag, once it's wrapped. */
function tag(ctx: Ctx, { skill, name, does }: Gift) {
  ctx.fillStyle = colors.ink;
  words(ctx, `${name}, wrapped!`, 51, 81.5, 4.6, 76, 'bold');
  words(ctx, does, 51, 87, 3.3, 76);
  ctx.fillStyle = colors.pineDark;
  words(ctx, installCommand(skill), 51, 91.8, 2.8, 78);
  ctx.fillStyle = colors.muted;
  words(ctx, 'Tap to wrap the next one', 51, 95.3, 2.3, 60);
}

/** Swatch `n` for this step: a paper, then a ribbon round the chosen paper, then a bow on both. */
function swatch(ctx: Ctx, w: Wrapping, n: number, over: boolean) {
  const { x, y, w: wide, h } = swatchBox(n);
  const lift = over ? 0.6 : 0;
  const [top, mx, my] = [y - lift, x + wide / 2, y - lift + h / 2];
  ctx.fillStyle = over ? colors.gold : colors.cocoa;
  ctx.fillRect(x - 0.6, top - 0.6, wide + 1.2, h + 1.2);
  ctx.fillStyle = paperOf(w.step === 0 ? n : w.paper);
  ctx.fillRect(x, top, wide, h);
  if (w.step === 0) {
    // A sprinkle of snowflakes printed on the paper.
    ctx.fillStyle = colors.snowLit;
    for (const [dx, dy] of [
      [0.25, 0.3],
      [0.7, 0.5],
      [0.4, 0.75],
    ] as const) {
      ctx.beginPath();
      ctx.arc(x + dx * wide, top + dy * h, 0.7, 0, Math.PI * 2);
      ctx.fill();
    }
    return;
  }
  const ribbon = ribbonOf(w.step === 1 ? n : w.ribbon);
  ctx.fillStyle = ribbon;
  ctx.fillRect(mx - 1, top, 2, h);
  ctx.fillRect(x, my - 1, wide, 2);
  if (w.step === 2) bowOn(ctx, bowOf(n), mx, my + 1.5, 1.3, ribbon);
}

/** The card at `time`; `over` is the swatch under the pointer, or -1. */
export function card(ctx: Ctx, w: Wrapping, time: number, over: number) {
  if (revealing(w, time)) {
    const gift = giftJustWrapped(w);
    blank(ctx, gift.wrap);
    tag(ctx, gift);
    return;
  }
  const gift = giftOnCounter(w);
  blank(ctx, gift.wrap);
  ctx.fillStyle = colors.ink;
  words(ctx, `Pick the ${stepOf(w.step)} for ${gift.name}`, 51, 81.3, 4, 78, 'bold');
  for (let n = 0; n < 4; n++) swatch(ctx, w, n, n === over);
  ctx.fillStyle = colors.muted;
  words(ctx, `${String(w.shelf.length)} of ${String(SHELF)} on the shelves`, 51, 95.6, 2.2, 60);
}
