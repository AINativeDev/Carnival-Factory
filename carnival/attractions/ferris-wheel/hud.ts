/**
 * Boarding Time's signs, in the square's 0 to 100 units: the score, the best
 * and the misses left, the lap, the words that float up after each tap, the
 * attendant's sign while nobody plays, and the card when the ride closes.
 */
import { canvasFont, theme } from '../../../src/northpole/theme';
import { LIVES, POINTS, REOPEN, type Boarding } from './game';
import { GATE } from './ride';

const { colors } = theme;

/** Writes `text` centred on (x, y), `height` units tall, in the theme's font scaled to fit. */
function letter(
  ctx: CanvasRenderingContext2D,
  text: string,
  at: { x: number; y: number; height: number; colour: string; align?: CanvasTextAlign },
) {
  const k = at.height / theme.font.title;
  ctx.save();
  ctx.translate(at.x, at.y);
  ctx.scale(k, k);
  ctx.font = canvasFont('title', 'bold');
  ctx.textAlign = at.align ?? 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = colors.shadow;
  ctx.globalAlpha *= 0.6;
  ctx.fillText(text, 1.5, 2);
  ctx.globalAlpha /= 0.6;
  ctx.fillStyle = at.colour;
  ctx.fillText(text, 0, 0);
  ctx.restore();
}

/** A rounded panel, the night's colour, at `alpha`. */
function panel(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  alpha: number,
) {
  ctx.globalAlpha = alpha;
  ctx.fillStyle = colors.night;
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, 2.5);
  ctx.fill();
  ctx.globalAlpha = 1;
}

/** A little bauble, lit for a miss still left and hollow for one used. */
function life(ctx: CanvasRenderingContext2D, x: number, y: number, left: boolean) {
  ctx.fillStyle = left ? colors.berry : colors.surface;
  ctx.beginPath();
  ctx.arc(x, y, 1.6, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = colors.gold;
  ctx.fillRect(x - 0.6, y - 2.3, 1.2, 0.8);
}

/** The score, the misses left and the lap on the left, the best on the right. */
export function scoreboard(ctx: CanvasRenderingContext2D, game: Boarding) {
  panel(ctx, 2, 2, 30, 13, 0.55);
  letter(ctx, 'SCORE', { x: 4, y: 4.8, height: 2.6, colour: colors.muted, align: 'left' });
  letter(ctx, String(game.score), {
    x: 4,
    y: 9.4,
    height: 5.2,
    colour: colors.text,
    align: 'left',
  });
  for (let n = 0; n < LIVES; n++) life(ctx, 21 + n * 3.8, 10.2, n < LIVES - game.misses);
  letter(ctx, `LAP ${String(game.lap)}`, {
    x: 30,
    y: 4.8,
    height: 2.6,
    colour: colors.gold,
    align: 'right',
  });
  panel(ctx, 79, 2, 19, 13, 0.55);
  letter(ctx, 'BEST', { x: 96, y: 4.8, height: 2.6, colour: colors.muted, align: 'right' });
  letter(ctx, String(game.best), {
    x: 96,
    y: 9.4,
    height: 5.2,
    colour: colors.gold,
    align: 'right',
  });
}

/** The words floating up from the gate after a tap: the points, or what went wrong. */
export function callouts(ctx: CanvasRenderingContext2D, game: Boarding, time: number) {
  const recent = game.boarded.at >= game.missed.at ? 'board' : 'miss';
  const at = recent === 'board' ? game.boarded.at : game.missed.at;
  const p = (time - at) / 1_100;
  if (p < 0 || p >= 1 || game.mode === 'demo') return;
  ctx.globalAlpha = Math.min(1, (1 - p) * 3);
  const y = GATE.y + 12 - p * 6;
  if (recent === 'miss')
    letter(ctx, game.missed.why, { x: 50, y, height: 4, colour: colors.berry });
  else if (game.boarded.perfect)
    letter(ctx, `Perfect! +${String(POINTS.perfect)}`, {
      x: 50,
      y,
      height: 4.4,
      colour: colors.gold,
    });
  else letter(ctx, `+${String(POINTS.good)}`, { x: 50, y, height: 4, colour: colors.text });
  ctx.globalAlpha = 1;
}

/** "Full wheel!" over the hub while the wheel whirls its victory lap. */
export function fullWheel(ctx: CanvasRenderingContext2D, game: Boarding, time: number) {
  const p = (time - game.lapAt) / 2_400;
  if (p < 0 || p >= 1) return;
  ctx.globalAlpha = Math.min(1, (1 - p) * 4, p * 8);
  letter(ctx, 'Full wheel!', { x: 50, y: 25, height: 6, colour: colors.gold });
  if (game.mode === 'play')
    letter(ctx, `+${String(POINTS.lap * (game.lap - 1))} · faster!`, {
      x: 50,
      y: 31,
      height: 3.4,
      colour: colors.text,
    });
  ctx.globalAlpha = 1;
}

/** How to play, under the wheel, until the visitor's first elf is aboard. */
export function firstHint(ctx: CanvasRenderingContext2D, game: Boarding, time: number) {
  if (game.mode !== 'play' || game.served > 0) return;
  panel(ctx, 12, 88, 76, 9, 0.7);
  ctx.globalAlpha = 0.8 + 0.2 * Math.sin(time / 500);
  letter(ctx, 'Tap as an empty car swings into the ring', {
    ...{ x: 50, y: 92.5, height: 3.2, colour: colors.text },
  });
  ctx.globalAlpha = 1;
}

/** The attendant's sign while nobody plays: the game's name and how to start. */
export function invitation(ctx: CanvasRenderingContext2D, time: number) {
  panel(ctx, 10, 85, 80, 13, 0.7);
  letter(ctx, 'Boarding Time', { x: 50, y: 89.2, height: 4.6, colour: colors.gold });
  ctx.globalAlpha = 0.75 + 0.25 * Math.sin(time / 500);
  letter(ctx, 'Tap to play · board each empty car in the ring', {
    x: 50,
    y: 94.6,
    height: 3.1,
    colour: colors.text,
  });
  ctx.globalAlpha = 1;
}

/** The card when three misses close the ride: the score, the best, and how to go again. */
export function closedCard(ctx: CanvasRenderingContext2D, game: Boarding, time: number) {
  const p = Math.min(1, (time - game.endedAt) / 500);
  if (p <= 0) return;
  ctx.globalAlpha = p;
  panel(ctx, 20, 24, 60, 38, 0.88);
  ctx.globalAlpha = p;
  letter(ctx, 'Ride closed!', { x: 50, y: 30, height: 5, colour: colors.gold });
  letter(ctx, String(game.score), { x: 50, y: 39.5, height: 9, colour: colors.text });
  const record = game.score > 0 && game.score >= game.best;
  letter(ctx, record ? 'New best!' : `Best ${String(game.best)}`, {
    x: 50,
    y: 48,
    height: 3.6,
    colour: record ? colors.mint : colors.muted,
  });
  if (time - game.endedAt >= REOPEN) {
    ctx.globalAlpha = p * (0.75 + 0.25 * Math.sin(time / 500));
    letter(ctx, 'Tap to go again', { x: 50, y: 56, height: 3.6, colour: colors.text });
  }
  ctx.globalAlpha = 1;
}
