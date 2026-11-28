import type { NorthPoleSquare } from '../../../src/northpole/square';
import { theme } from '../../../src/northpole/theme';
import { scoreboard, signal, signs } from './board';
import { combo, said, verdict } from './callouts';
import { afterglow, ease, FADE, hop } from './cues';
import { crowd } from './crowd';
import { desk, floor, mixer, speaker } from './desk';
import { footer } from './footer';
import { host, mic } from './host';
import { lane, screen } from './lane';
import { keyLight, outlook, sceneBox, wall } from './room';
import { voice } from './score';
import { advance, newStudio, type Studio } from './studio';
import { playback, playbackLoudness, wrapCard } from './wrap';

const { colors } = theme;

/** The studio's one piece of state for the visit: the episode, the best score, a link asked for. */
let studio: Studio | undefined;

/**
 * The Recording Studio: a rhythm game in the North Pole's podcast studio. Say
 * each word into the mic as it slides into the ring, hold the gold ones, keep
 * the ON AIR signal up, then hear your take played back and scored, with
 * buttons out to the real podcast. It's drawn in the Tessl places' three
 * layers: a slim header, the lit studio, and a footer with the hint and the
 * one button. On the home map it stands as the studio building, and takes the
 * sleigh into the level of the same name.
 */
const theStudio: NorthPoleSquare = {
  id: 'the-studio',
  name: 'The Recording Studio',
  description:
    'Record a podcast episode on the beat: say each word as it hits the mic, keep the signal ON AIR, then hear your take played back.',
  // How it stands on the home map: what it is, not a pavilion (ADR 0042).
  stall: { shape: 'shed', roof: 'surface', trim: 'berry', landmark: 'studio' },
  draw(ctx, size, time, pointer, keys) {
    const state = advance(studio ?? newStudio(time), time, pointer, size, keys);
    studio = state;
    const { game } = state;
    const fades = afterglow(game, time);
    const recording = game.ended === null;
    const loud = recording ? voice(game, time) : playbackLoudness(game, time) * fades.listen;
    ctx.save();
    ctx.scale(size / 100, size / 100);
    ctx.fillStyle = colors.night;
    ctx.fillRect(0, 0, 100, 100);
    signs(ctx, game, fades.listen);
    signal(ctx, game);
    scoreboard(ctx, game, state.best);
    ctx.save();
    sceneBox(ctx);
    ctx.clip();
    wall(ctx);
    outlook(ctx, time);
    keyLight(ctx);
    screen(ctx);
    lane(ctx, game, time, game.ended === null ? 0 : ease((time - game.ended) / FADE));
    playback(ctx, game, time, fades.listen);
    floor(ctx);
    speaker(ctx, fades.listen * loud);
    host(ctx, { loud, talking: recording && loud > 0.05, headphones: fades.listen, time });
    mic(ctx, recording ? loud : 0);
    desk(ctx);
    mixer(ctx, loud);
    crowd(ctx, time, fades.listen * (0.4 + loud), hop(state.cheer, time));
    verdict(ctx, game, time);
    combo(ctx, game, time);
    said(ctx, game, time);
    ctx.restore();
    footer(ctx, game, time);
    wrapCard(ctx, game, state.best, time, fades.wrap);
    ctx.restore();
  },
  // A tap on a link asks the page, once, to open that link of the panel.
  ask() {
    const open = studio?.open ?? null;
    if (open === null || !studio) return undefined;
    studio.open = null;
    return { open };
  },
};

export default theStudio;
