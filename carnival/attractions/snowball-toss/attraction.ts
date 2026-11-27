/**
 * Snowball Toss: three rounds of snowballs at the tin snowmen sliding along
 * the booth's shelves, with the wind bending every throw, combos for hits in
 * a row and a gold snowman now and then. Puts the booth, the snowmen, the
 * snowballs, the wind, the scoreboard and the cards together, back to front,
 * and keeps the attraction's one memory of the visit.
 */
import type { NorthPoleSquare } from '../../../src/northpole/square';
import { scene } from '../../../src/northpole/diorama';
import { theme } from '../../../src/northpole/theme';
import { booth, counter, pennant, prizes } from './booth';
import { aim, card, pops } from './cards';
import { flightOf, FLIGHT, windAt } from './flight';
import { advance, type Game, newGame } from './game';
import { scoreboard } from './scoreboard';
import { shelves } from './snowmen';
import { flakes, windSign } from './wind';

const { colors } = theme;

let game: Game | undefined;

/** The snowballs in the air, shrinking a little as they fly away into the booth. */
function snowballs(ctx: CanvasRenderingContext2D, state: Game, time: number) {
  ctx.fillStyle = colors.snowLit;
  ctx.strokeStyle = colors.snowShade;
  ctx.lineWidth = 0.6;
  for (const ball of state.throws) {
    const at = flightOf(ball, time);
    if (!at) continue;
    const r = 3 - ((time - ball.at) / FLIGHT) * 1.4;
    ctx.beginPath();
    ctx.arc(at.x, at.y, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  }
}

/** A snowball toss game: tap to throw snowballs at the tin snowmen sliding along the shelves. */
const attraction: NorthPoleSquare = {
  id: 'snowball-toss',
  name: 'Snowball Toss',
  description:
    'Three rounds of snowballs at the sliding tin snowmen: mind the wind, chain hits for combos and hit the gold one for a bonus.',
  // How it stands on the home map: what it is, not a pavilion (ADR 0042).
  stall: { shape: 'stall', roof: 'pine', trim: 'snow', landmark: 'game-stall' },
  draw(ctx, size, time, pointer) {
    const state = advance(game ?? newGame(time), time, pointer, size);
    game = state;
    const wind = windAt(state.round, time);
    scene(ctx, size, time, () => {
      booth(ctx);
      pennant(ctx, wind, time);
      shelves(ctx, state, time);
      prizes(ctx, time);
      counter(ctx);
      snowballs(ctx, state, time);
      pops(ctx, state, time);
      flakes(ctx, wind, time);
      scoreboard(ctx, state);
      windSign(ctx, wind);
      const playing = state.ended === null && state.left > 0;
      if (pointer && playing) aim(ctx, (pointer.x / size) * 100, (pointer.y / size) * 100);
      card(ctx, state, time);
    });
  },
};

export default attraction;
