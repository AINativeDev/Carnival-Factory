/**
 * What's on the wall over the stage while an episode records: the ON AIR sign,
 * swapping to PLAYBACK as it plays back, the ON AIR signal that misses drain,
 * the scoreboard, a hint for whoever's about to play, and the buttons out.
 */
import { theme } from '../../../src/northpole/theme';
import type { Button } from './buttons';
import { LEAD } from './chart';
import type { Game } from './game';
import { letter, rounded } from './lettering';
import { sign } from './room';

const { colors } = theme;

/** The sign over the stage: ON AIR while it records, brighter the stronger the signal, PLAYBACK after. */
export function signs(ctx: CanvasRenderingContext2D, game: Game, listen: number) {
  const where = { x: 37, w: 26 };
  const onAir = game.ended === null ? 0.45 + game.signal * 0.55 : 0.2;
  sign(ctx, 'ON AIR', { ...where, colour: colors.berry }, onAir * (1 - listen));
  if (listen <= 0) return;
  ctx.save();
  ctx.globalAlpha = listen;
  sign(ctx, 'PLAYBACK', { ...where, colour: colors.pine }, listen);
  ctx.restore();
}

/** The ON AIR signal under the sign: full and green, or nearly gone and red. */
export function signal(ctx: CanvasRenderingContext2D, game: Game) {
  const [x, y, w] = [37, 16.2, 26];
  ctx.fillStyle = colors.ink;
  rounded(ctx, x, y, w, 2.6, 1.3);
  ctx.fill();
  const strength = game.signal;
  ctx.fillStyle = strength > 0.5 ? colors.mint : strength > 0.25 ? colors.gold : colors.berry;
  if (strength > 0) {
    rounded(ctx, x + 0.5, y + 0.5, Math.max(1.6, (w - 1) * strength), 1.6, 0.8);
    ctx.fill();
  }
  letter(ctx, 'SIGNAL', { x: x - 1, y: y + 1.4, height: 2, colour: colors.muted, align: 'right' });
}

/** The scoreboard in the top right: the episode, the score and the best of the visit. */
export function scoreboard(ctx: CanvasRenderingContext2D, game: Game, best: number) {
  const [x, y, w, h] = [67, 3, 30, 12.5];
  ctx.fillStyle = colors.ink;
  rounded(ctx, x, y, w, h, 2);
  ctx.fill();
  const who = game.visitor ? `EPISODE ${String(game.episode)}` : 'HOST’S DEMO';
  const small = { y: y + 3, height: 2.3, colour: colors.muted };
  letter(ctx, who, { ...small, x: x + 2.5, align: 'left' });
  letter(ctx, `BEST ${String(best)}`, { ...small, x: x + w - 2.5, align: 'right' });
  letter(ctx, String(game.score), {
    ...{ x: x + w / 2, y: y + 8.5, height: 6, colour: colors.gold, width: w - 4 },
  });
}

/** A button on the drawing: the main one gold, the others quieter. */
export function button(ctx: CanvasRenderingContext2D, b: Button) {
  ctx.fillStyle = b.main ? colors.gold : colors.ink;
  rounded(ctx, b.x, b.y, b.w, b.h, b.h / 2);
  ctx.fill();
  if (!b.main) {
    ctx.strokeStyle = colors.gold;
    ctx.lineWidth = 0.5;
    ctx.stroke();
  }
  const colour = b.main ? colors.ink : colors.snowLit;
  letter(ctx, b.label, { x: b.x + b.w / 2, y: b.y + b.h / 2 + 0.2, height: b.h * 0.48, colour });
}

/** A hint in a pill near the foot of the stage, for whoever's about to play. */
export function hint(ctx: CanvasRenderingContext2D, game: Game, time: number) {
  const into = time - game.start;
  const text = !game.visitor
    ? 'Tap to go ON AIR'
    : game.ended === null && into < LEAD + 1_500
      ? 'Tap as each word hits the ring · hold the gold'
      : '';
  if (!text) return;
  const pulse = 0.85 + 0.15 * Math.sin(time / 600);
  ctx.globalAlpha = 0.9;
  ctx.fillStyle = colors.ink;
  rounded(ctx, 20, 80.5, 54, 7, 3.5);
  ctx.fill();
  ctx.globalAlpha = pulse;
  letter(ctx, text, { x: 47, y: 84.2, height: 3.4, colour: colors.snowLit, width: 50 });
  ctx.globalAlpha = 1;
}
