/**
 * The cheer meter by the track, a post of bulbs that light one more with each
 * launch, and the lever at the station that glows while the sleigh waits.
 * Both glow slowly and steadily: nothing here flashes (docs/style.md).
 */
import { box, glow, iso } from '../../../src/northpole/diorama';
import { theme } from '../../../src/northpole/theme';
import { CHEERS } from './ride';

const { colors } = theme;

/** Where the meter's post stands on the slab, in front of the hill. */
const POST = { gx: 15, gy: 9 };

/** The cheer meter with `cheers` of its bulbs lit, and a warm glow round it once it's full. */
export function drawCheerMeter(ctx: CanvasRenderingContext2D, cheers: number, time: number) {
  box(ctx, POST.gx, POST.gy, 2, 2, 16, colors.cream, colors.wood, colors.cocoa);
  const top = iso(POST.gx + 1, POST.gy + 1, 16);
  if (cheers >= CHEERS) glow(ctx, top.x, top.y + 6, 12, 0.8 + 0.2 * Math.sin(time / 700));
  for (let n = 0; n < CHEERS; n++) {
    const bulb = iso(POST.gx, POST.gy + 2, 2.5 + n * 2.9);
    ctx.fillStyle = n < cheers ? colors.gold : colors.slabShade;
    ctx.beginPath();
    ctx.arc(bulb.x + 0.2, bulb.y, 1.1, 0, Math.PI * 2);
    ctx.fill();
  }
  // A little star on top, lit once the meter is full.
  ctx.fillStyle = cheers >= CHEERS ? colors.gold : colors.slabShade;
  ctx.beginPath();
  for (let n = 0; n < 10; n++) {
    const r = n % 2 ? 1.1 : 2.4;
    const a = -Math.PI / 2 + (n * Math.PI) / 5;
    ctx.lineTo(top.x + r * Math.cos(a), top.y - 2.5 + r * Math.sin(a));
  }
  ctx.closePath();
  ctx.fill();
}

/** The station's launch lever at `at`, glowing gently while the sleigh waits for a tap. */
export function drawLever(
  ctx: CanvasRenderingContext2D,
  at: { x: number; y: number },
  waiting: boolean,
  time: number,
) {
  if (waiting) glow(ctx, at.x, at.y - 5, 7, 0.6 + 0.4 * Math.sin(time / 600));
  ctx.strokeStyle = colors.ink;
  ctx.lineWidth = 0.9;
  ctx.beginPath();
  ctx.moveTo(at.x, at.y);
  ctx.lineTo(at.x + (waiting ? -2 : 2), at.y - 6);
  ctx.stroke();
  ctx.fillStyle = colors.berry;
  ctx.beginPath();
  ctx.arc(at.x + (waiting ? -2 : 2), at.y - 6, 1.3, 0, Math.PI * 2);
  ctx.fill();
}
