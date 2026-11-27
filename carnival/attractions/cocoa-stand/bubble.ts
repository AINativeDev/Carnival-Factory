/**
 * The order bubble over the elf at the hatch: what they want in their cup, in
 * order, each thing ticked off as it goes in and the next one ringed, with
 * their patience running down along its foot.
 */
import { theme } from '../../../src/northpole/theme';
import { icon } from './icons';
import { rounded } from './lettering';
import { patienceLeft, type Shift } from './rush';

const { colors } = theme;

/** How wide each item's place in the bubble is, in scene units. */
const SLOT = 10;
/** The bubble's top-left corner and height. */
const BOX = { x: 4, y: 18, h: 18 };
/** Where the bubble's tail points: the head of the elf at the hatch. */
const TAIL = { x: 25, y: 44 };

/** The patience bar's colour: calm, hurrying, or nearly gone. */
const barColour = (left: number) =>
  left > 0.5 ? colors.mint : left > 0.25 ? colors.gold : colors.berry;

/** The bubble at `time`, once the customer has stepped up and while the shift is on. */
export function bubble(ctx: CanvasRenderingContext2D, shift: Shift, time: number) {
  const { customer: who, made } = shift;
  if (shift.ended !== null || time < who.arrives - 150) return;
  const w = who.order.length * SLOT + 4;
  const { x, y, h } = BOX;
  ctx.globalAlpha = Math.min(1, (time - who.arrives + 150) / 250);
  ctx.fillStyle = colors.cream;
  rounded(ctx, x, y, w, h, 3);
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(TAIL.x - 3, y + h - 0.5);
  ctx.lineTo(TAIL.x + 3, y + h - 0.5);
  ctx.lineTo(TAIL.x, TAIL.y);
  ctx.closePath();
  ctx.fill();
  who.order.forEach((item, n) => {
    const cx = x + 2 + SLOT * n + SLOT / 2;
    const cy = y + 7;
    const done = n < made.length;
    ctx.fillStyle = done ? colors.slabShade : colors.surface;
    ctx.beginPath();
    ctx.arc(cx, cy, 4.4, 0, Math.PI * 2);
    ctx.fill();
    if (n === made.length) {
      ctx.strokeStyle = colors.gold;
      ctx.lineWidth = 0.9;
      ctx.stroke();
    }
    const fade = ctx.globalAlpha;
    if (done) ctx.globalAlpha = fade * 0.4;
    icon(ctx, item, cx, cy, 0.85);
    ctx.globalAlpha = fade;
    if (done) tick(ctx, cx + 2.6, cy + 2.4);
  });
  const left = patienceLeft(who, time);
  ctx.fillStyle = colors.slabShade;
  rounded(ctx, x + 2.5, y + h - 4.5, w - 5, 2.4, 1.2);
  ctx.fill();
  ctx.fillStyle = barColour(left);
  if (left > 0) {
    rounded(ctx, x + 2.5, y + h - 4.5, Math.max(2.4, (w - 5) * left), 2.4, 1.2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
}

/** A small green tick at (x, y), for something already in the cup. */
function tick(ctx: CanvasRenderingContext2D, x: number, y: number) {
  ctx.fillStyle = colors.pine;
  ctx.beginPath();
  ctx.arc(x, y, 1.8, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = colors.snowLit;
  ctx.lineWidth = 0.6;
  ctx.beginPath();
  ctx.moveTo(x - 0.9, y);
  ctx.lineTo(x - 0.2, y + 0.8);
  ctx.lineTo(x + 1, y - 0.8);
  ctx.stroke();
}
