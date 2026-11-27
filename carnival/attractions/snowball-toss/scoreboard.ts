/**
 * The scoreboard hung at the top left: the game's score, the best of the
 * visit, the round, a dot for each snowball left and the combo, with the call
 * to throw under it. Its text is the attraction's own, drawn with `fillText`.
 */
import { theme } from '../../../src/northpole/theme';
import { type Game, ROUND, ROUNDS } from './game';
import { multiplier } from './landing';
import { letter, panel } from './lettering';

const { colors } = theme;

/** What the board says under the score: how to play, how many are left, or how to go on. */
export function callOf(game: Game): string {
  if (!game.started) return 'Tap to throw';
  if (game.ended !== null) {
    return game.round < ROUNDS ? `Tap for round ${String(game.round + 1)}` : 'Tap to play again';
  }
  return `${String(game.left)} left`;
}

/** The scoreboard, at the top left of the drawing. */
export function scoreboard(ctx: CanvasRenderingContext2D, game: Game) {
  panel(ctx, 3, 3, 28, 27);
  const left = { x: 6, align: 'left' as const, width: 23 };
  letter(ctx, `Score ${String(game.score)}`, {
    ...left,
    y: 7.4,
    height: 4,
    colour: colors.snowLit,
  });
  letter(ctx, `Best ${String(game.best)}`, { ...left, y: 12, height: 3, colour: colors.gold });
  const round = `Round ${String(game.round)} of ${String(ROUNDS)}`;
  letter(ctx, round, { ...left, y: 16.2, height: 2.6, colour: colors.muted });
  // A dot for each snowball of the round: lit while it's still to throw.
  for (let k = 0; k < ROUND; k++) {
    ctx.fillStyle = k < game.left ? colors.snowLit : colors.muted;
    ctx.globalAlpha = k < game.left ? 1 : 0.35;
    ctx.beginPath();
    ctx.arc(7.2 + k * 2.8, 20.6, 1, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
  letter(ctx, callOf(game), { x: 17, y: 26, height: 3, colour: colors.mint, width: 25 });
  const times = multiplier(game.combo);
  if (game.ended !== null || times < 2) return;
  ctx.fillStyle = colors.berry;
  ctx.beginPath();
  ctx.roundRect(7, 32, 20, 5, 2.5);
  ctx.fill();
  letter(ctx, `COMBO ×${String(times)}`, { x: 17, y: 34.6, height: 3, colour: colors.snowLit });
}
