/**
 * The counter's front with its five big buttons, one for each thing that goes
 * in a cup. A pressed button dips and rings mint when it was right, berry when
 * it spilled the cup; in the stand's own show a mitten taps each one in turn.
 */
import { theme } from '../../../src/northpole/theme';
import { BUTTONS } from './buttons';
import { icon } from './icons';
import { letter, rounded } from './lettering';
import { ITEMS } from './orders';
import type { Shift } from './rush';

const { colors } = theme;

/** How long a pressed button stays dipped and ringed, in ms. */
const PRESSED = 300;

/** The ring round a pressed button: mint when right, berry when it spilled, quiet when it had to wait. */
function ringFor(verdict: 'right' | 'wrong' | 'wait') {
  if (verdict === 'right') return colors.mint;
  return verdict === 'wrong' ? colors.berry : colors.muted;
}

/** The counter's front and every button on it, at `time`. */
export function panel(ctx: CanvasRenderingContext2D, shift: Shift, time: number) {
  ctx.fillStyle = colors.wood;
  ctx.fillRect(0, 77, 100, 23);
  ctx.fillStyle = colors.cream;
  ctx.fillRect(0, 77, 100, 1);
  const last = shift.pressed;
  const since = last ? time - last.at : Infinity;
  for (const b of BUTTONS) {
    const pressed = last !== null && last.item === b.item && since >= 0 && since < PRESSED;
    const dip = pressed ? 1 - since / PRESSED : 0;
    ctx.fillStyle = colors.cocoa;
    rounded(ctx, b.x, b.y + 1.2, b.w, b.h, 2.5);
    ctx.fill();
    ctx.fillStyle = colors.cream;
    rounded(ctx, b.x, b.y + dip, b.w, b.h, 2.5);
    ctx.fill();
    if (pressed) {
      ctx.strokeStyle = ringFor(last.verdict);
      ctx.lineWidth = 1;
      ctx.globalAlpha = dip;
      ctx.stroke();
      ctx.globalAlpha = 1;
    }
    ctx.fillStyle = colors.surface;
    ctx.beginPath();
    ctx.arc(b.x + b.w / 2, b.y + 6.8 + dip, 5.6, 0, Math.PI * 2);
    ctx.fill();
    icon(ctx, b.item, b.x + b.w / 2, b.y + 7 + dip, 1.15);
    const name = ITEMS.at(b.item) ?? '';
    const words = { x: b.x + b.w / 2, y: b.y + 15 + dip, height: 2.7, colour: colors.ink };
    letter(ctx, name, { ...words, shade: false });
  }
  if (!shift.visitor && last && since < 500) mitten(ctx, last.item, since / 500);
}

/** The stand's own elf's mitten tapping `item`'s button, `t` of the way through the tap. */
function mitten(ctx: CanvasRenderingContext2D, item: number, t: number) {
  const b = BUTTONS.at(item);
  if (!b) return;
  const x = b.x + b.w * 0.7;
  const y = b.y + 9 - Math.sin(t * Math.PI) * 2;
  ctx.globalAlpha = Math.sin(t * Math.PI);
  ctx.fillStyle = colors.berry;
  ctx.beginPath();
  ctx.ellipse(x, y, 2.4, 2.8, 0.3, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = colors.snowLit;
  ctx.fillRect(x - 1.8, y + 2, 4, 1.6);
  ctx.globalAlpha = 1;
}
