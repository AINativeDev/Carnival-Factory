import type { NorthPoleSquare } from '../../../src/northpole/square';
import { badge } from './badge';
import { bubble, flyingMic, pop, stand } from './bubbles';
import { takeAsk } from './buttons';
import { type Mood, poseOf, SEATS } from './crowd';
import { advance } from './game';
import { beams, factsBanner, scoreBanner, stage, ticketsSign, wall } from './hall';
import { attendee } from './people';
import { talkAfter } from './program';
import { screen } from './screen';
import { speaker } from './speaker';
import { type Game, newGame } from './state';

/** The one visit's game, the only state the attraction keeps between frames. */
let game: Game | undefined;

/** The row the question mic stands in front of: it's drawn between this row and the next. */
const MIC_ROW = 2;

/** The hall's mood for the crowd: who's asking, who got the mic, and how the round ended. */
function moodOf(state: Game): Mood {
  return {
    askers: state.up.map((q) => q.seat),
    cheers: state.cheers,
    applauseAt: state.talkAt,
    ovationAt: state.mode === 'won' ? state.endedAt : Infinity,
    quiet: state.mode === 'lost',
  };
}

/** The audience, back row first, with the mic stand in the aisle among them. */
function crowd(ctx: CanvasRenderingContext2D, state: Game, time: number) {
  const mood = moodOf(state);
  SEATS.forEach((seat, n) => {
    const next = SEATS.at(n + 1);
    attendee(ctx, seat, poseOf(n, mood, time), time);
    if (seat.row === MIC_ROW && next?.row !== MIC_ROW) stand(ctx);
  });
}

/**
 * AI DevCon: Keep the room buzzing. A keynote hall at dusk where the visitor
 * passes the mic to the questions about building with AI, skips the off-topic
 * ones, and plays through six talks to a standing ovation.
 */
const attraction: NorthPoleSquare = {
  id: 'ai-devcon',
  name: 'AI DevCon',
  description:
    'Keep the keynote buzzing: pass the mic to the questions about AI dev and skip the off-topic ones.',
  stall: { shape: 'pagoda', roof: 'violet', trim: 'mint' },
  draw(ctx, size, time, pointer) {
    const state = advance(game ?? newGame(time), time, pointer, size);
    game = state;
    ctx.save();
    ctx.scale(size / 100, size / 100);
    wall(ctx);
    scoreBanner(ctx, state, time);
    factsBanner(ctx);
    screen(ctx, state, time);
    stage(ctx, time);
    speaker(ctx, 21, talkAfter(state.answered), state.talkAt, time);
    ticketsSign(ctx, time);
    beams(ctx, time);
    crowd(ctx, state, time);
    for (const q of state.up) bubble(ctx, q, time);
    flyingMic(ctx, state.cheers, time);
    for (const p of state.pops) pop(ctx, p, time);
    if (state.badge) badge(ctx, state.badge.kind, state.badge.at, time);
    ctx.restore();
  },
  ask() {
    if (!game) return undefined;
    const taken = takeAsk(game);
    game = taken.game;
    return taken.ask;
  },
};

export default attraction;
