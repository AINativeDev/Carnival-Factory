/**
 * Frozen Pond, and its game, Curling: a curling sheet laid on the pond in the
 * pines, with the house at the far end. Drag back from the stone and let go to
 * throw, tap the ice to sweep, and finish nearest the button.
 */
import type { NorthPoleSquare, SquarePointer } from '../../../src/northpole/square';
import { backdrop } from '../../../src/northpole/diorama';
import { theme } from '../../../src/northpole/theme';
import { TALLY, advance, newCurling, type Curling } from './game';
import { endBanner, finalCard, hints, invitation, scoreboard, shotMarker } from './hud';
import { ZOOM, blowingSnow, curlingSheet, ice, pinesAndLamp, slab } from './pond';
import { drawAim, drawSkater, drawSweeper, drawStones } from './rink-drawing';
import { POND, onScreen } from './sheet';
import { moving, throwFrom } from './stones';

const { colors } = theme;

/** The skaters gliding to and fro along the far side of the pond: their scarves, and where each is in its glide. */
const SKATERS = [
  { scarf: colors.berry, phase: 0 },
  { scarf: colors.pine, phase: 2.1 },
  { scarf: colors.violet, phase: 4.2 },
];

/** The game, the attraction's one piece of state for the visit. */
let curling: Curling | undefined;

/**
 * Where a background skater is at `time`: gliding slowly along the far edge of
 * the ice, beyond the sheet, never crossing it.
 */
export function skaterAt(time: number, phase: number): { x: number; y: number } {
  const along = Math.sin(time / 5_000 + phase);
  return { x: POND.x - 4 + along * 22, y: POND.y - 6.4 + Math.cos(time / 5_000 + phase) * 0.6 };
}

/** How high the skaters hop when an end is won: a few happy bounces, from `time` alone. */
function cheerOf(game: Curling, time: number): number {
  const won = game.tally && game.tally.points > 0 && game.mode !== 'demo';
  const since = time - (game.tally?.at ?? -Infinity);
  if (!won || since < 0 || since >= TALLY) return 0;
  return Math.abs(Math.sin(since / 180)) * (1 - since / TALLY);
}

/** A frozen pond with a curling sheet: throw your stones nearest the button, three ends, against the wind. */
const attraction: NorthPoleSquare = {
  id: 'frozen-pond',
  name: 'Frozen Pond',
  description:
    'Curling on the pond: drag back and let go to throw, tap to sweep, and finish nearest the button over three windy ends.',
  // How it stands on the home map: what it is, not a pavilion (ADR 0042).
  stall: { shape: 'igloo', roof: 'ice', trim: 'snow', landmark: 'ice-rink' },
  draw(ctx, size, time, pointer?: SquarePointer) {
    const game = advance(curling ?? newCurling(time, 'demo'), time, pointer, size);
    curling = game;
    ctx.save();
    ctx.scale(size / 100, size / 100);
    backdrop(ctx);
    ctx.save();
    ctx.translate(ZOOM.x, ZOOM.y);
    ctx.scale(ZOOM.k, ZOOM.k);
    ctx.translate(-ZOOM.x, -ZOOM.y);
    slab(ctx);
    pinesAndLamp(ctx);
    ice(ctx, time);
    const cheer = cheerOf(game, time);
    for (const { scarf, phase } of SKATERS) {
      const at = skaterAt(time, phase);
      drawSkater(ctx, at.x, at.y - cheer * 2, scarf, cheer);
    }
    curlingSheet(ctx);
    blowingSnow(ctx, game.wind, time);
    drawStones(ctx, game.stones, time);
    const sliding = game.stones.at(game.current);
    if (game.phase === 'slide' && sliding && moving(sliding)) {
      const brushing = Math.max(0, Math.min(1, (game.sweptUntil - time) / 150));
      drawSweeper(ctx, onScreen(sliding.s, sliding.w), brushing, time);
    }
    // The thrower at the hack, and the stone it's about to throw while an end is still on.
    drawSkater(ctx, onScreen(-1, 3).x, onScreen(-1, 3).y, colors.gold);
    if (game.phase === 'aim' && game.mode !== 'over') {
      const drag = game.drag && throwFrom(game.drag.from, game.drag.to);
      drawAim(ctx, drag ?? undefined, time);
    }
    shotMarker(ctx, game, time);
    ctx.restore();
    endBanner(ctx, game, time);
    hints(ctx, game, time);
    if (game.mode === 'demo') invitation(ctx, time);
    else scoreboard(ctx, game);
    if (game.mode === 'over') finalCard(ctx, game, time);
    ctx.restore();
  },
};

export default attraction;
