import type { NorthPoleSquare } from '../../../src/northpole/square';
import { theme } from '../../../src/northpole/theme';
import { button, hint, scoreboard, signal, signs } from './board';
import { buttonsFor } from './buttons';
import { afterglow, hop } from './cues';
import { crowd, notes, ripples } from './crowd';
import { advance, newStudio, phaseOf, type Studio } from './game';
import { host, mic } from './host';
import { lane, said } from './lane';
import { desk, speaker, spotlight, wall } from './room';
import { voice } from './score';
import { playback, playbackLoudness, wrapCard } from './wrap';

const { colors } = theme;

/** The studio's one piece of state for the visit: the episode, the best score, a link asked for. */
let studio: Studio | undefined;

/**
 * The Recording Studio: a rhythm game in the North Pole's podcast studio. Say
 * each word into the mic as it slides into the ring, hold the gold ones, keep
 * the ON AIR signal up, then hear your take played back and scored, with
 * buttons out to the real podcast. On the home map it stands as the studio
 * building, and takes the sleigh into the level of the same name.
 */
const theStudio: NorthPoleSquare = {
  id: 'the-studio',
  name: 'The Recording Studio',
  description:
    'Record a podcast episode on the beat: say each word as it hits the mic, keep the signal ON AIR, then hear your take played back.',
  // How it stands on the home map: what it is, not a pavilion (ADR 0042).
  stall: { shape: 'shed', roof: 'surface', trim: 'berry', landmark: 'studio' },
  draw(ctx, size, time, pointer) {
    const state = advance(studio ?? newStudio(time), time, pointer, size);
    studio = state;
    const { game } = state;
    const phase = phaseOf(game, time);
    const fades = afterglow(game, time);
    const loud =
      game.ended === null ? voice(game, time) : playbackLoudness(game, time) * fades.listen;
    ctx.save();
    ctx.scale(size / 100, size / 100);
    ctx.fillStyle = colors.night;
    ctx.fillRect(0, 0, 100, 100);
    wall(ctx, time);
    spotlight(ctx);
    for (const x of [8, 92]) {
      speaker(ctx, x, fades.listen * loud);
      ripples(ctx, x, 58.5, fades.listen * (0.4 + loud), time);
    }
    signs(ctx, game, fades.listen);
    signal(ctx, game);
    scoreboard(ctx, game, state.best);
    const mood = {
      loud,
      talking: game.ended === null && loud > 0.05,
      headphones: fades.listen,
      time,
    };
    host(ctx, mood);
    mic(ctx, game.ended === null ? loud : 0);
    desk(ctx, loud, time);
    lane(ctx, game, time, Math.max(fades.listen, fades.wrap, game.ended === null ? 0 : 1));
    playback(ctx, game, time, fades.listen);
    said(ctx, game, time);
    notes(ctx, time, fades.listen);
    crowd(ctx, time, fades.listen * (0.4 + loud), hop(state.cheer, time));
    if (phase !== 'wrap') for (const b of buttonsFor(phase)) button(ctx, b);
    hint(ctx, game, time);
    wrapCard(ctx, game, state.best, fades.wrap);
    ctx.restore();
  },
  // A tap on a button asks the page, once, to open that link of the panel.
  ask() {
    const open = studio?.open ?? null;
    if (open === null || !studio) return undefined;
    studio.open = null;
    return { open };
  },
};

export default theStudio;
