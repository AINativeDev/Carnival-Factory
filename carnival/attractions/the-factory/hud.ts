/**
 * What the game shows over the scene, and only what it needs: the four skill
 * cards down the left to tap, with one line on what to do; the score, best
 * and lives in the top right (or, before a round, how to play); and under them
 * one quiet link to sign up. All of it is drawn text and shapes; a tap on the
 * link only asks the page to open it (`ask`).
 */
import { theme } from '../../../src/northpole/theme';
import { SIGN_UP_CORNER } from './buttons';
import { type Game, LIVES } from './game';
import { cardAt, CARDS, cardTop, POP_LIFE, SKILLS } from './rules';
import { eyebrow, words } from './text';
import { breath, panel, tertiary } from './ui';

const { colors } = theme;

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

/** The skill cards down the left, each with its colour down its left edge, pressing in as it's tapped. */
export function cards(ctx: CanvasRenderingContext2D, game: Game, time: number) {
  eyebrow(ctx, 'Skills', CARDS.x, CARDS.y - 7.5, colors.gold);
  const hint = game.mode === 'play' ? 'Tap the skill it needs' : 'Tap a card to play';
  words(ctx, hint, CARDS.x, CARDS.y - 3.4, 3, colors.snowLit, 'left', 33);
  SKILLS.forEach((skill, n) => {
    const press = pressOf(game, n, time);
    const box = { x: CARDS.x + press * 0.6, y: cardTop(n) + press * 0.6, w: CARDS.w, h: CARDS.h };
    panel(ctx, box, 0.88, press > 0 ? colors.surface : colors.night);
    ctx.fillStyle = skill.color;
    ctx.fillRect(box.x, box.y + 1.6, 0.8, box.h - 3.2);
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

/** The three lives as hearts, right-aligned to `x` on `y`, the lost ones dark. */
function hearts(ctx: CanvasRenderingContext2D, lives: number, x: number, y: number) {
  for (let n = 0; n < LIVES; n++) {
    const at = x - n * 3.6;
    ctx.fillStyle = n < lives ? colors.berry : colors.surface;
    ctx.beginPath();
    ctx.arc(at - 0.7, y, 0.9, Math.PI, 0);
    ctx.arc(at + 0.7, y, 0.9, Math.PI, 0);
    ctx.lineTo(at, y + 2.2);
    ctx.fill();
  }
}

/** The score, best and lives in the top right, or how to play before a round, and the quiet sign-up link under them. */
export function scoreboard(ctx: CanvasRenderingContext2D, game: Game, time: number) {
  const box = { x: 66, y: 4, w: 30, h: 20 };
  panel(ctx, box);
  const left = box.x + 3;
  if (game.mode !== 'demo') {
    eyebrow(ctx, 'Score', left, box.y + 4, colors.muted);
    hearts(ctx, game.lives, box.x + box.w - 3.5, box.y + 3.6);
    words(ctx, String(game.score), left, box.y + 10.5, 7, colors.gold, 'left', 24);
    words(ctx, `Best ${String(game.best)}`, left, box.y + 16.6, 3, colors.snowLit, 'left', 24);
  } else {
    eyebrow(ctx, 'Feed the loop', left, box.y + 4, colors.gold);
    words(ctx, 'Give each station', left, box.y + 8.8, 3, colors.snow, 'left', 24);
    words(ctx, 'the skill it needs.', left, box.y + 12.6, 3, colors.snow, 'left', 24);
    ctx.globalAlpha = 0.7 + breath(time) * 0.3;
    words(ctx, 'Tap to play ▶', left, box.y + 17, 3, colors.mint, 'left', 24);
    ctx.globalAlpha = 1;
  }
  tertiary(ctx, SIGN_UP_CORNER, colors.gold);
}
