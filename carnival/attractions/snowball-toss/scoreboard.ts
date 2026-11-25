/**
 * The little scoreboard hung on the left wall: this round's score, the best of
 * the visit, and a dot for each snowball left, with the call to throw under
 * it. Its text is the attraction's own, drawn with `fillText`.
 */
import { canvasFont, theme } from '../../../src/northpole/theme';
import { type Game, ROUND } from './game';

const { colors } = theme;

function label(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, width: number) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(0.3, 0.3);
  ctx.fillText(text, 0, 0, width / 0.3);
  ctx.restore();
}

/** What the board says under the score: how to play, or how to play again. */
export function callOf(game: Game): string {
  if (game.left === 0 && game.throws.every((ball) => !ball.played)) return 'Tap to play again';
  return game.left === ROUND ? 'Tap to throw' : `${String(game.left)} left`;
}

/** The scoreboard, at the top left of the drawing. */
export function scoreboard(ctx: CanvasRenderingContext2D, game: Game) {
  ctx.fillStyle = colors.gold;
  ctx.beginPath();
  ctx.roundRect(3, 4, 27, 19, 2);
  ctx.fill();
  ctx.fillStyle = colors.surface;
  ctx.beginPath();
  ctx.roundRect(4, 5, 25, 17, 1.5);
  ctx.fill();
  ctx.font = canvasFont('title', 'bold');
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = colors.text;
  label(ctx, `Score ${String(game.score)}`, 6, 9, 21);
  ctx.fillStyle = colors.gold;
  label(ctx, `Best ${String(game.best)}`, 6, 14.5, 21);
  // A dot for each snowball of the round: lit while it's still to throw.
  for (let k = 0; k < ROUND; k++) {
    ctx.fillStyle = k < game.left ? colors.snowLit : colors.muted;
    ctx.globalAlpha = k < game.left ? 1 : 0.4;
    ctx.beginPath();
    ctx.arc(6.5 + k * 2.2, 19.3, 0.8, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
  ctx.font = canvasFont('small', 'bold');
  ctx.fillStyle = colors.snowLit;
  ctx.textAlign = 'center';
  label(ctx, callOf(game), 16.5, 26.5, 26);
}
