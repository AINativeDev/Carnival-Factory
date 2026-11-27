/**
 * The stand's words: the board with the tips, the three mugs that count the
 * walk-offs, the best of the visit, a line saying what to do, "Oops!" over a
 * spill, and the card when the shift ends.
 */
import { theme } from '../../../src/northpole/theme';
import { icon } from './icons';
import { letter, rounded } from './lettering';
import { CARD, STRIKES, type Stand } from './rush';

const { colors } = theme;

/** A dark board at (x, y), `w` by `h`. */
function plate(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number) {
  ctx.fillStyle = colors.ink;
  ctx.globalAlpha *= 0.85;
  rounded(ctx, x, y, w, h, 2);
  ctx.fill();
  ctx.globalAlpha = 1;
}

/** The boards along the top: tips, walk-offs left, and the best of the visit. */
export function boards(ctx: CanvasRenderingContext2D, stand: Stand) {
  const { shift, best } = stand;
  plate(ctx, 3, 3, 28, 12);
  plate(ctx, 69, 3, 28, 12);
  const small = { y: 6.2, height: 2.6, colour: colors.muted };
  letter(ctx, 'BEST TIPS', { ...small, x: 83 });
  letter(ctx, String(best), { x: 83, y: 11, height: 5.6, colour: colors.cream });
  if (!shift.visitor) {
    letter(ctx, 'COCOA RUSH', { x: 17, y: 9, height: 3.4, colour: colors.gold });
    plate(ctx, 33, 4.5, 34, 9);
    letter(ctx, 'Tap to open the stand!', { x: 50, y: 9, height: 3, colour: colors.cream });
    return;
  }
  letter(ctx, 'TIPS', { ...small, x: 17 });
  letter(ctx, String(shift.tips), { x: 17, y: 11, height: 5.6, colour: colors.gold });
  plate(ctx, 37, 3, 26, 12);
  for (let n = 0; n < STRIKES; n++) {
    const x = 43 + n * 7;
    const lost = n < shift.walkOffs;
    ctx.globalAlpha = lost ? 0.3 : 1;
    icon(ctx, 0, x, 9.5, 0.85);
    ctx.globalAlpha = 1;
    if (lost) cross(ctx, x, 9);
  }
}

/** A berry cross over a lost mug at (x, y). */
function cross(ctx: CanvasRenderingContext2D, x: number, y: number) {
  ctx.strokeStyle = colors.berry;
  ctx.lineWidth = 0.9;
  ctx.beginPath();
  ctx.moveTo(x - 2.4, y - 2.4);
  ctx.lineTo(x + 2.4, y + 2.4);
  ctx.moveTo(x + 2.4, y - 2.4);
  ctx.lineTo(x - 2.4, y + 2.4);
  ctx.stroke();
}

/** "Oops!" rising over a spilled cup at `at`, at `time`. */
export function oops(
  ctx: CanvasRenderingContext2D,
  stand: Stand,
  time: number,
  at: { x: number; y: number },
) {
  const { shift } = stand;
  const spilled = time - shift.spilled;
  if (spilled >= 0 && spilled < 800) {
    ctx.globalAlpha = 1 - spilled / 800;
    const words = { x: at.x, y: at.y - 16 - spilled / 120, height: 4.4 };
    letter(ctx, 'Oops!', { ...words, colour: colors.horizon });
    ctx.globalAlpha = 1;
  }
}

/** The card when the shift ends: the tips, the cups served, the best, and a tap to open again. */
export function card(ctx: CanvasRenderingContext2D, stand: Stand, time: number) {
  const { shift } = stand;
  if (!shift.visitor || shift.ended === null) return;
  const since = time - shift.ended - 400;
  if (since <= 0) return;
  ctx.globalAlpha = Math.min(1, since / 400);
  plate(ctx, 18, 24, 64, 40);
  ctx.globalAlpha = Math.min(1, since / 400);
  letter(ctx, 'Shift over!', { x: 50, y: 31, height: 6, colour: colors.gold });
  letter(ctx, `Tips: ${String(shift.tips)}`, { x: 50, y: 39, height: 4.4, colour: colors.cream });
  const cups = `${String(shift.served)} ${shift.served === 1 ? 'cup' : 'cups'} served`;
  letter(ctx, cups, { x: 50, y: 45, height: 3.2, colour: colors.muted });
  const best = stand.record ? 'Best tips of the visit!' : `Best: ${String(stand.best)}`;
  const colour = stand.record ? colors.aurora : colors.muted;
  letter(ctx, best, { x: 50, y: 50.5, height: 3.2, colour });
  if (time - shift.ended >= CARD) {
    ctx.fillStyle = colors.gold;
    rounded(ctx, 31, 54.5, 38, 6.5, 3.25);
    ctx.fill();
    letter(ctx, 'Tap to open again', { x: 50, y: 57.8, height: 3.4, colour: colors.ink });
  }
  ctx.globalAlpha = 1;
}
