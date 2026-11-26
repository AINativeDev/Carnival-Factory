/**
 * What the game shows over the scene: the four skill cards down the left to
 * tap, the score, best and lives in the top right with the small sign-up
 * button under them, and, when a round ends, its card in the middle with the
 * score and a big button to sign up for Tessl. All of it is drawn text and
 * shapes; a tap on a button only asks the page to open the link (`ask`).
 */
import { theme } from '../../../src/northpole/theme';
import { type Game, LIVES, OVER_GUARD } from './game';
import { type Box, cardAt, CARDS, cardTop, POP_LIFE, SIGN_UP, SKILLS } from './rules';
import { words } from './text';

const { colors } = theme;

/** A rounded panel filled with `fill` and edged with `edge`. */
function panel(ctx: CanvasRenderingContext2D, box: Box, fill: string, edge: string, alpha = 0.9) {
  ctx.globalAlpha = alpha;
  ctx.fillStyle = fill;
  ctx.beginPath();
  ctx.roundRect(box.x, box.y, box.w, box.h, 1.6);
  ctx.fill();
  ctx.globalAlpha = 1;
  ctx.strokeStyle = edge;
  ctx.lineWidth = 0.5;
  ctx.stroke();
}

/** How pressed card `n` looks at `time`, from 0 to 1: just after a tap on it, or the demo's answer with it. */
export function pressOf(game: Game, n: number, time: number): number {
  let press = 0;
  for (const pop of game.pops) {
    const t = (time - pop.at) / (POP_LIFE / 3);
    const tapped = pop.kind === 'tap' && cardAt(pop.x ?? -1, pop.y ?? -1) === n;
    const demo = game.mode !== 'play' && pop.kind === 'right' && game.need === n;
    if ((tapped || demo) && t >= 0 && t < 1) press = Math.max(press, 1 - t);
  }
  return press;
}

/** The skill cards down the left, each pressing in as it's tapped. */
export function cards(ctx: CanvasRenderingContext2D, game: Game, time: number) {
  words(ctx, 'SKILLS', CARDS.x + 0.5, CARDS.y - 6, 2.6, colors.gold, 'left');
  const hint = game.mode === 'play' ? 'Tap what the station needs' : 'Tap any card to play';
  words(ctx, hint, CARDS.x + 0.5, CARDS.y - 2.6, 2, colors.snowLit, 'left', CARDS.w);
  SKILLS.forEach((skill, n) => {
    const press = pressOf(game, n, time);
    const color = skill.color;
    const box = { x: CARDS.x + press * 0.6, y: cardTop(n) + press * 0.6, w: CARDS.w, h: CARDS.h };
    panel(ctx, box, press > 0 ? colors.surface : colors.night, color);
    ctx.fillStyle = color;
    ctx.fillRect(box.x, box.y + 1.2, 1.2, box.h - 2.4);
    const gem = { x: box.x + 5, y: box.y + box.h / 2 };
    ctx.beginPath();
    ctx.moveTo(gem.x, gem.y - 2.2);
    ctx.lineTo(gem.x + 1.6, gem.y);
    ctx.lineTo(gem.x, gem.y + 2.2);
    ctx.lineTo(gem.x - 1.6, gem.y);
    ctx.fill();
    words(ctx, skill.name, box.x + 8.5, gem.y + 0.2, 3.6, colors.snow, 'left', CARDS.w - 10);
  });
}

/** The sign-up button in `box`, `big` on the round's last card. */
function signUp(ctx: CanvasRenderingContext2D, box: Box, big: boolean, time: number) {
  panel(ctx, box, colors.gold, colors.glow, 1);
  const nudge = Math.sin(time / 380) * 0.5;
  const size = big ? 4 : 2.6;
  words(
    ctx,
    'Sign up for Tessl',
    box.x + box.w / 2 - 1.5,
    box.y + box.h / 2 + 0.2,
    size,
    colors.ink,
    'center',
    box.w - 7,
  );
  words(
    ctx,
    '↗',
    box.x + box.w - 3 + nudge * 0.6,
    box.y + box.h / 2 - nudge * 0.6,
    size,
    colors.ink,
  );
}

/** The score, best and lives in the top right, or how to play while the demo runs, and the small sign-up button; nothing once the round is over. */
export function scoreboard(ctx: CanvasRenderingContext2D, game: Game, time: number) {
  // The round's last card says all of it.
  if (game.mode === 'over') return;
  const box = { x: 66, y: 4, w: 31, h: 21 };
  panel(ctx, box, colors.night, colors.gold, 0.85);
  if (game.mode === 'play') {
    words(ctx, 'SCORE', box.x + 2, box.y + 3.5, 2, colors.muted, 'left');
    words(ctx, String(game.score), box.x + 2, box.y + 9, 6, colors.gold, 'left', 18);
    words(ctx, `BEST ${String(game.best)}`, box.x + 2, box.y + 16.5, 2.2, colors.snow, 'left');
    for (let n = 0; n < LIVES; n++) {
      const x = box.x + box.w - 3.5 - n * 3.6;
      ctx.fillStyle = n < game.lives ? colors.berry : colors.surface;
      ctx.beginPath();
      ctx.arc(x - 0.7, box.y + 3.6, 0.9, Math.PI, 0);
      ctx.arc(x + 0.7, box.y + 3.6, 0.9, Math.PI, 0);
      ctx.lineTo(x, box.y + 5.8);
      ctx.fill();
    }
  } else {
    words(ctx, 'FEED THE LOOP', box.x + box.w / 2, box.y + 4, 3, colors.gold, 'center', box.w - 3);
    words(ctx, 'Give each station', box.x + box.w / 2, box.y + 9, 2.2, colors.snow);
    words(ctx, 'the skill it needs', box.x + box.w / 2, box.y + 12, 2.2, colors.snow);
    ctx.globalAlpha = 0.75 + Math.sin(time / 700) * 0.25;
    words(ctx, 'TAP TO PLAY', box.x + box.w / 2, box.y + 17, 3, colors.mint);
    ctx.globalAlpha = 1;
  }
  signUp(ctx, SIGN_UP.corner, false, time);
}

/** The round's last card: how it went, the big sign-up button, and how to play again. */
export function overCard(ctx: CanvasRenderingContext2D, game: Game, time: number) {
  if (game.mode !== 'over') return;
  const rise = Math.min(1, (time - game.overAt) / 400);
  ctx.save();
  ctx.translate(0, (1 - rise) * 6);
  ctx.globalAlpha = rise;
  const box = { x: 22, y: 18, w: 56, h: 50 };
  panel(ctx, box, colors.night, colors.gold, 0.94);
  words(ctx, 'LOOP COMPLETE', 50, 24, 4.4, colors.gold);
  words(ctx, `Score ${String(game.score)}`, 50, 32, 6.4, colors.snow);
  const best =
    game.score > 0 && game.score >= game.best ? 'New best!' : `Best ${String(game.best)}`;
  const shipped = `${String(game.shipped)} booth${game.shipped === 1 ? '' : 's'} shipped · ${best}`;
  words(ctx, shipped, 50, 39, 2.6, colors.mint, 'center', 50);
  words(ctx, 'Run this loop on your own repo:', 50, 45.5, 2.4, colors.snowLit);
  signUp(ctx, SIGN_UP.card, true, time);
  if (time - game.overAt >= OVER_GUARD) {
    ctx.globalAlpha = rise * (0.7 + Math.sin(time / 700) * 0.3);
    words(ctx, 'Tap anywhere else to play again', 50, 63.5, 2.4, colors.snow);
  }
  ctx.restore();
}
