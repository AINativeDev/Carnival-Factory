/**
 * Frozen Pond's signs, in the square's 0 to 100 units: the score, the end and
 * the stones left, the wind's arrow, the hints, each end's result over the
 * stone that won it, the skip's sign while nobody plays, and the final card.
 */
import { canvasFont, theme } from '../../../src/northpole/theme';
import { REOPEN, TALLY, type Curling } from './game';
import { ENDS, STONES, onScreen } from './sheet';

const { colors } = theme;

/** Writes `text` centred on (x, y), `height` units tall, with a soft shadow under it. */
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

/** A rounded panel in the night's colour. */
function panel(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  alpha: number,
) {
  ctx.globalAlpha *= alpha;
  ctx.fillStyle = colors.night;
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, 2.5);
  ctx.fill();
  ctx.globalAlpha /= alpha;
}

/** The wind's arrow: pointing the way it pushes across the sheet, longer the stronger it blows. */
function windArrow(ctx: CanvasRenderingContext2D, wind: number) {
  panel(ctx, 41, 2, 18, 13, 0.55);
  letter(ctx, 'WIND', { x: 50, y: 4.8, height: 2.6, colour: colors.muted });
  const length = 1.5 + Math.abs(wind) * 1.6;
  const way = Math.sign(wind) || 1;
  ctx.strokeStyle = colors.ice;
  ctx.fillStyle = colors.ice;
  ctx.lineWidth = 0.9;
  ctx.beginPath();
  ctx.moveTo(50, 10.5 - (length / 2) * way);
  ctx.lineTo(50, 10.5 + (length / 2) * way);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(48.4, 10.5 + (length / 2 - 1.4) * way);
  ctx.lineTo(51.6, 10.5 + (length / 2 - 1.4) * way);
  ctx.lineTo(50, 10.5 + (length / 2 + 0.6) * way);
  ctx.fill();
}

/** The score, the end, the stones left to throw, the wind and the best. */
export function scoreboard(ctx: CanvasRenderingContext2D, game: Curling) {
  panel(ctx, 2, 2, 30, 13, 0.55);
  letter(ctx, 'SCORE', { x: 4, y: 4.8, height: 2.6, colour: colors.muted, align: 'left' });
  letter(ctx, String(game.score), {
    x: 4,
    y: 9.6,
    height: 5.2,
    colour: colors.text,
    align: 'left',
  });
  const end = `END ${String(game.end)}/${String(ENDS)}`;
  letter(ctx, end, { x: 30, y: 4.8, height: 2.6, colour: colors.gold, align: 'right' });
  for (let n = 0; n < STONES; n++) {
    ctx.fillStyle = n < STONES - game.thrown ? colors.gold : colors.surface;
    ctx.beginPath();
    ctx.ellipse(16 + n * 3.4, 10.4, 1.3, 0.75, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  windArrow(ctx, game.wind);
  panel(ctx, 79, 2, 19, 13, 0.55);
  letter(ctx, 'BEST', { x: 96, y: 4.8, height: 2.6, colour: colors.muted, align: 'right' });
  letter(ctx, String(game.best), {
    x: 96,
    y: 9.6,
    height: 5.2,
    colour: colors.gold,
    align: 'right',
  });
}

/** A line of help in a panel low on the pond. */
function hint(ctx: CanvasRenderingContext2D, text: string, alpha: number) {
  ctx.globalAlpha = alpha;
  panel(ctx, 12, 86, 76, 9, 0.7);
  letter(ctx, text, { x: 50, y: 90.5, height: 3.2, colour: colors.text });
  ctx.globalAlpha = 1;
}

/** How to throw and sweep, while the visitor is new to it, and after a tap that didn't drag. */
export function hints(ctx: CanvasRenderingContext2D, game: Curling, time: number) {
  if (game.mode !== 'play') return;
  const nudged = time - game.nudgedAt < 1_800;
  const first = game.end === 1 && game.thrown === 0;
  if (game.phase === 'aim' && !game.drag && (nudged || first))
    hint(ctx, 'Press, drag back from the stone, and let go', 1);
  else if (game.phase === 'slide' && game.end === 1 && game.thrown <= 2)
    hint(ctx, 'Tap the ice fast to sweep it further!', 0.8 + 0.2 * Math.sin(time / 300));
}

/** How far through showing the end's result `time` is, from 0 to 1, or undefined when it isn't showing. */
function tallying(game: Curling, time: number): number | undefined {
  const p = game.tally ? (time - game.tally.at) / TALLY : -1;
  return p >= 0 && p < 1 ? p : undefined;
}

/** A ring round the stone that won the end, and its points rising over it, on the ice. */
export function shotMarker(ctx: CanvasRenderingContext2D, game: Curling, time: number) {
  const p = tallying(game, time);
  if (p === undefined || !game.tally) return;
  const { s, w, points, rival } = game.tally;
  ctx.globalAlpha = Math.min(1, (1 - p) * 5, p * 10);
  const at = onScreen(s, w);
  ctx.strokeStyle = rival ? colors.berry : colors.gold;
  ctx.lineWidth = 0.6;
  ctx.beginPath();
  ctx.ellipse(at.x, at.y - 0.6, 3 + p * 2, 1.5 + p, 0, 0, Math.PI * 2);
  ctx.stroke();
  const label = points > 0 ? `+${String(points)}` : '0';
  const colour = points > 0 ? colors.gold : colors.berry;
  letter(ctx, label, { x: at.x, y: at.y - 6 - p * 3, height: 5, colour });
  ctx.globalAlpha = 1;
}

/** The end's result in a banner: who took it, and for how much. */
export function endBanner(ctx: CanvasRenderingContext2D, game: Curling, time: number) {
  const p = tallying(game, time);
  if (p === undefined || !game.tally || game.mode === 'demo') return;
  const won = game.tally.points > 0;
  const said = won ? `Shot stone! ${String(game.tally.points)} for you` : 'The rivals take the end';
  ctx.globalAlpha = Math.min(1, (1 - p) * 5, p * 10);
  panel(ctx, 20, 20, 60, 11, 0.8);
  letter(ctx, `End ${String(game.end)}`, { x: 50, y: 23.4, height: 2.8, colour: colors.muted });
  letter(ctx, said, { x: 50, y: 27.4, height: 3.8, colour: won ? colors.gold : colors.text });
  ctx.globalAlpha = 1;
}

/** The skip's sign while nobody plays: the game's name and how to start. */
export function invitation(ctx: CanvasRenderingContext2D, time: number) {
  panel(ctx, 10, 84, 80, 13, 0.7);
  letter(ctx, 'Curling', { x: 50, y: 88.2, height: 4.6, colour: colors.gold });
  ctx.globalAlpha = 0.75 + 0.25 * Math.sin(time / 500);
  letter(ctx, 'Tap to play · drag back and let go to throw', {
    x: 50,
    y: 93.6,
    height: 3.1,
    colour: colors.text,
  });
  ctx.globalAlpha = 1;
}

/** The card at the end of the game: each end's points, the total, the best, and how to play again. */
export function finalCard(ctx: CanvasRenderingContext2D, game: Curling, time: number) {
  const p = Math.min(1, (time - game.endedAt) / 500);
  if (p <= 0) return;
  ctx.globalAlpha = p;
  panel(ctx, 20, 18, 60, 40, 0.88);
  letter(ctx, 'Final score', { x: 50, y: 23.5, height: 4.4, colour: colors.gold });
  letter(ctx, String(game.score), { x: 50, y: 32, height: 9, colour: colors.text });
  const byEnd = game.ends.map((points) => String(points)).join('  ·  ');
  letter(ctx, `Ends: ${byEnd}`, { x: 50, y: 39.6, height: 3, colour: colors.muted });
  const record = game.score > 0 && game.score >= game.best;
  const best = record ? 'New best!' : `Best ${String(game.best)}`;
  letter(ctx, best, { x: 50, y: 45, height: 3.6, colour: record ? colors.mint : colors.muted });
  if (time - game.endedAt >= REOPEN) {
    ctx.globalAlpha = p * (0.75 + 0.25 * Math.sin(time / 500));
    letter(ctx, 'Tap to play again', { x: 50, y: 52, height: 3.6, colour: colors.text });
  }
  ctx.globalAlpha = 1;
}
