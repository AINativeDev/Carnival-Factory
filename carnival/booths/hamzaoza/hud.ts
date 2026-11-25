/**
 * The score in the corner and, after a crash with someone there, the call to
 * sled again. Its text is the booth's own, drawn with `fillText`.
 */
import type { SquarePointer } from '../../../src/northpole/square';
import { canvasFont, theme } from '../../../src/northpole/theme';
import { type Game, TUMBLE } from './game';
import type { Ctx } from './view';

const { colors } = theme;

function label(ctx: Ctx, text: string, x: number, y: number, scale: number, width: number) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(scale, scale);
  ctx.fillText(text, 0, 0, width);
  ctx.restore();
}

/** The score and the best of the visit, and "Oof! Tap to sled again" once the tumble is over. */
export function hud(ctx: Ctx, game: Game, pointer: SquarePointer | undefined, time: number) {
  ctx.fillStyle = colors.surface;
  ctx.globalAlpha = 0.8;
  ctx.beginPath();
  ctx.roundRect(3, 3, 40, 9, 3);
  ctx.fill();
  ctx.globalAlpha = 1;
  ctx.font = canvasFont('title', 'bold');
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = colors.glow;
  label(ctx, `★ ${game.run.score}`, 6, 7.8, 0.2, 80);
  ctx.fillStyle = colors.snow;
  label(ctx, `best ${game.best}`, 24, 7.8, 0.14, 120);

  const { crashedAt } = game.run;
  if (pointer && crashedAt !== null && time - crashedAt > TUMBLE) {
    ctx.fillStyle = colors.surface;
    ctx.globalAlpha = 0.85;
    ctx.beginPath();
    ctx.roundRect(22, 44, 56, 13, 4);
    ctx.fill();
    ctx.globalAlpha = 1;
    ctx.textAlign = 'center';
    ctx.fillStyle = colors.glow;
    label(ctx, 'Oof! Tap to sled again', 50, 50.8, 0.16, 300);
  }
}
