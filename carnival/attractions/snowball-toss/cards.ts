/**
 * What answers each throw and each round: a "+3" rising where a snowball hit,
 * gold and with the combo when it counts, a splash of snow where one missed,
 * the aim under the pointer, and the cards between rounds and at the end of
 * the game, with the score, the best of the visit and the tap to go on.
 */
import { theme } from '../../../src/northpole/theme';
import { type Game, GUARD, ROUNDS } from './game';
import type { Pop } from './landing';
import { letter, panel } from './lettering';

const { colors } = theme;

/** How long a pop shows, in ms. */
const POP_FOR = 900;

/** What a hit's pop says: its points, with the multiplier and "GOLD" when they count. */
export function popText(pop: Pop): string {
  const times = pop.times > 1 ? ` ×${String(pop.times)}` : '';
  return `${pop.gold ? 'GOLD ' : ''}+${String(pop.points)}${times}`;
}

/** The pops of the last few landings, each rising and fading. */
export function pops(ctx: CanvasRenderingContext2D, game: Game, time: number) {
  for (const pop of game.pops) {
    const age = (time - pop.at) / POP_FOR;
    if (age < 0 || age >= 1) continue;
    ctx.globalAlpha = 1 - age;
    if (pop.points > 0) {
      const colour = pop.gold ? colors.gold : pop.times > 1 ? colors.mint : colors.snowLit;
      letter(ctx, popText(pop), { x: pop.x, y: pop.y - 9 - age * 7, height: 4.6, colour });
    } else {
      // A miss: the snowball bursts where it lands.
      ctx.fillStyle = colors.snowLit;
      for (let k = 0; k < 6; k++) {
        const a = (k / 6) * Math.PI * 2;
        ctx.beginPath();
        ctx.arc(
          pop.x + Math.cos(a) * (1 + age * 4),
          pop.y + Math.sin(a) * (0.6 + age * 2.4),
          0.8,
          0,
          Math.PI * 2,
        );
        ctx.fill();
      }
    }
  }
  ctx.globalAlpha = 1;
}

/** A ring under the pointer where the next snowball is aimed. */
export function aim(ctx: CanvasRenderingContext2D, x: number, y: number) {
  ctx.strokeStyle = colors.gold;
  ctx.lineWidth = 0.5;
  ctx.beginPath();
  ctx.arc(x, y, 2.4, 0, Math.PI * 2);
  ctx.moveTo(x - 3.6, y);
  ctx.lineTo(x - 1.2, y);
  ctx.moveTo(x + 1.2, y);
  ctx.lineTo(x + 3.6, y);
  ctx.stroke();
}

/** The card's title, lines and call, by whether the game is over. */
export function cardOf(game: Game): { title: string; lines: [string, string]; call: string } {
  if (game.round < ROUNDS) {
    return {
      title: `Round ${String(game.round)} done!`,
      lines: [`This round +${String(game.roundScore)}`, `Total ${String(game.score)}`],
      call: `Tap for round ${String(game.round + 1)}: faster, windier`,
    };
  }
  const record = game.score > game.bestBefore;
  return {
    title: record ? 'New best!' : 'Game over',
    lines: [`Score ${String(game.score)}`, `Best of your visit ${String(game.best)}`],
    call: 'Tap to play again',
  };
}

/** The card once a round's last snowball is down, fading in. */
export function card(ctx: CanvasRenderingContext2D, game: Game, time: number) {
  if (game.ended === null) return;
  const since = time - game.ended;
  const { title, lines, call } = cardOf(game);
  ctx.save();
  ctx.globalAlpha = Math.min(1, since / 300);
  panel(ctx, 20, 36, 60, 30);
  const over = game.round >= ROUNDS;
  letter(ctx, title, { x: 50, y: 42, height: 5, colour: over ? colors.gold : colors.snowLit });
  letter(ctx, lines[0], { x: 50, y: 49, height: 3.8, colour: over ? colors.snowLit : colors.gold });
  letter(ctx, lines[1], { x: 50, y: 54.5, height: 3, colour: colors.muted, width: 54 });
  if (since >= GUARD)
    letter(ctx, call, { x: 50, y: 61, height: 3, colour: colors.mint, width: 56 });
  ctx.restore();
}
