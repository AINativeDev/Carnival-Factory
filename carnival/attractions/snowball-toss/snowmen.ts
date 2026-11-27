/**
 * The three gingerbread shelves and the tin snowmen sliding along them, each
 * tipping over backwards when hit. One turns gold now and then, glowing warm
 * with a "GOLD" tag over its hat while it's worth the bonus.
 */
import { glow } from '../../../src/northpole/diorama';
import { theme } from '../../../src/northpole/theme';
import type { Game } from './game';
import { letter } from './lettering';
import { goldShelf, paceOf, SHELVES, snowmanX, topple } from './targets';

const { colors } = theme;

/** How big a snowman is drawn. */
const SIZE = 0.8;

/** One tin snowman with its feet at 0, 0: two snowballs, a top hat and a carrot nose, in tin or gold. */
function snowman(ctx: CanvasRenderingContext2D, gold: boolean) {
  const u = SIZE;
  const y = -5.6;
  ctx.fillStyle = gold ? colors.gold : colors.snowShade;
  ctx.beginPath();
  ctx.arc(0, y + 3 * u, 4 * u, 0, Math.PI * 2);
  ctx.arc(0, y - 3 * u, 3 * u, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = gold ? colors.lantern : colors.muted;
  ctx.lineWidth = 0.6 * u;
  ctx.stroke();
  ctx.fillStyle = colors.night;
  ctx.fillRect(-3 * u, y - 7 * u, 6 * u, 1 * u);
  ctx.fillRect(-2 * u, y - 10 * u, 4 * u, 3 * u);
  ctx.fillStyle = gold ? colors.berry : colors.gingerbread;
  ctx.fillRect(0, y - 3.5 * u, 2 * u, 0.8 * u);
}

/**
 * The shelves, then the snowmen from the top shelf down, so each stands in
 * front of the shelf above it. A gold one glows and wears its tag.
 */
export function shelves(ctx: CanvasRenderingContext2D, game: Game, time: number) {
  for (const shelf of SHELVES) {
    const half = shelf.swing + 6;
    ctx.fillStyle = colors.wood;
    ctx.fillRect(50 - half, shelf.y + 1, half * 2, 2);
    ctx.fillStyle = colors.gingerbread;
    ctx.fillRect(50 - half, shelf.y, half * 2, 1.2);
  }
  const gold = goldShelf(game.roundStart, game.round, time);
  const pace = paceOf(game.round);
  for (let n = SHELVES.length - 1; n >= 0; n--) {
    const shelf = SHELVES.at(n);
    if (!shelf) continue;
    const x = snowmanX(n, time, pace);
    const tip = topple(game.down.at(n), time);
    const shining = n === gold && tip === 0;
    if (shining) glow(ctx, x, shelf.y - 6, 9, 0.9);
    ctx.save();
    // It tips over backwards about its feet, and fades as it lies down.
    ctx.translate(x, shelf.y);
    ctx.rotate((tip * Math.PI) / 2);
    ctx.globalAlpha = 1 - tip * 0.6;
    snowman(ctx, n === gold);
    ctx.restore();
    if (shining) letter(ctx, 'GOLD', { x, y: shelf.y - 16.5, height: 2.6, colour: colors.gold });
  }
}
