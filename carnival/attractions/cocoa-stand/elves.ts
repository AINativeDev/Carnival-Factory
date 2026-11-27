/**
 * The customers: elves queueing at the hatch, the one at the front stepping
 * up, smiling, worried or frowning, and the one served walking off with their
 * mug, or walking off cross when they waited too long.
 */
import { iso, shadow } from '../../../src/northpole/diorama';
import { theme } from '../../../src/northpole/theme';
import { icon } from './icons';
import { letter } from './lettering';
import { ARRIVE, patienceLeft, SPILL, type Shift } from './rush';

const { colors } = theme;

/** Each customer's coat, by their place in the shift. */
const COATS = [colors.pine, colors.violet, colors.berry, colors.gingerbread, colors.mint];
/** How long a customer takes to walk off, in ms. */
const WALK = 1_200;

/** How an elf feels: pleased, waiting, worried or cross. */
type Mood = 'happy' | 'calm' | 'worried' | 'cross';

/** Where the front of the queue stands, and each place behind it. */
const place = (k: number) => iso(-8 - k * 6, 16);

/** An elf with its feet at (x, y): coat, head, a hat with a bobble, and a face for `mood`. */
function elf(
  ctx: CanvasRenderingContext2D,
  at: { x: number; y: number },
  coat: string,
  mood: Mood,
) {
  const { x, y } = at;
  shadow(ctx, x, y, 9);
  ctx.fillStyle = coat;
  ctx.beginPath();
  ctx.moveTo(x - 4.5, y);
  ctx.lineTo(x + 4.5, y);
  ctx.lineTo(x + 2.6, y - 10);
  ctx.lineTo(x - 2.6, y - 10);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = colors.snow;
  ctx.fillRect(x - 4.5, y - 1.4, 9, 1.4);
  ctx.fillStyle = colors.glow;
  ctx.beginPath();
  ctx.arc(x, y - 13.5, 4, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = coat;
  ctx.beginPath();
  ctx.moveTo(x - 4.4, y - 15.5);
  ctx.lineTo(x + 4.4, y - 15.5);
  ctx.lineTo(x - 5, y - 24);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = colors.snow;
  ctx.fillRect(x - 4.6, y - 16.4, 9.2, 1.5);
  ctx.beginPath();
  ctx.arc(x - 5, y - 24, 1.4, 0, Math.PI * 2);
  ctx.fill();
  face(ctx, x, y - 13.5, mood);
}

/** The face on a head at (x, y): eyes, brows when cross or worried, and a smile, a line or a frown. */
function face(ctx: CanvasRenderingContext2D, x: number, y: number, mood: Mood) {
  ctx.fillStyle = colors.ink;
  for (const side of [-1, 1]) {
    ctx.beginPath();
    ctx.arc(x + side * 1.5, y - 0.4, 0.55, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.strokeStyle = colors.ink;
  ctx.lineWidth = 0.5;
  ctx.beginPath();
  if (mood === 'happy') ctx.arc(x, y + 0.8, 1.7, 0.15, Math.PI - 0.15);
  else if (mood === 'cross') ctx.arc(x, y + 2.8, 1.5, Math.PI + 0.4, -0.4);
  else ctx.moveTo(x - 1.1, y + 1.8);
  if (mood === 'calm' || mood === 'worried') ctx.lineTo(x + 1.1, y + 1.8);
  if (mood === 'cross' || mood === 'worried') {
    const slant = mood === 'cross' ? 0.7 : -0.7;
    ctx.moveTo(x - 2.4, y - 2 - slant);
    ctx.lineTo(x - 0.8, y - 2 + slant);
    ctx.moveTo(x + 2.4, y - 2 - slant);
    ctx.lineTo(x + 0.8, y - 2 + slant);
  }
  ctx.stroke();
}

/** The front customer's mood at `time`: cross just after a spill, worried when patience runs low. */
function moodAt(shift: Shift, time: number): Mood {
  if (time - shift.spilled < SPILL + 500) return 'cross';
  return patienceLeft(shift.customer, time) < 0.3 ? 'worried' : 'calm';
}

/** The queue at `time`: the elves waiting, the front one stepping up, and the last one walking off. */
export function queue(ctx: CanvasRenderingContext2D, shift: Shift, time: number) {
  const { customer: who } = shift;
  const waiting = shift.ended === null ? Math.min(3, 1 + Math.floor(who.n / 3)) : 0;
  const coat = (n: number) => COATS.at(n % COATS.length) ?? colors.pine;
  for (let k = waiting; k >= 1; k--) elf(ctx, place(k), coat(who.n + k), 'calm');
  if (shift.ended === null) {
    const step = Math.max(0, Math.min(1, 1 - (who.arrives - time) / ARRIVE));
    const from = place(1);
    const to = place(0);
    const at = { x: from.x + (to.x - from.x) * step, y: from.y + (to.y - from.y) * step };
    elf(ctx, at, coat(who.n), moodAt(shift, time));
  }
  walkingOff(ctx, shift, time, coat);
}

/** The customer leaving: off along the counter with their mug and a "Thanks!", or a cross "Hmph!". */
function walkingOff(
  ctx: CanvasRenderingContext2D,
  shift: Shift,
  time: number,
  coat: (n: number) => string,
) {
  const gone = shift.leaving;
  const since = gone ? time - gone.at : Infinity;
  if (!gone || since < 0 || since >= WALK) return;
  const t = since / WALK;
  const start = place(0);
  const at = { x: start.x + t * 30, y: start.y + t * 15 };
  ctx.globalAlpha = t < 0.6 ? 1 : 1 - (t - 0.6) / 0.4;
  elf(ctx, at, coat(gone.n), gone.happy ? 'happy' : 'cross');
  if (gone.happy) {
    icon(ctx, 0, at.x + 5, at.y - 8, 0.8);
    const tip = { x: at.x + 12, y: at.y - 16 - t * 8, height: 5, colour: colors.gold };
    letter(ctx, `+${String(gone.tip)}`, tip);
  }
  const words = {
    x: at.x,
    y: at.y - 30,
    height: 3.6,
    colour: gone.happy ? colors.gold : colors.horizon,
  };
  letter(ctx, gone.happy ? 'Thanks!' : 'Hmph!', words);
  ctx.globalAlpha = 1;
}
