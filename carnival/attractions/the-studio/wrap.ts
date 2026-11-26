/**
 * After the recording: the take played back as a waveform built from the words
 * said, with a playhead running over it, and then the wrap-up card with the
 * episode's grade and score, the buttons out to the real podcast and the tap
 * to record the next episode.
 */
import { theme } from '../../../src/northpole/theme';
import { button } from './board';
import { buttonsFor } from './buttons';
import { LISTEN, type Game } from './game';
import { LANE } from './lane';
import { letter, rounded } from './lettering';
import { grade, SLOTS, waveOf } from './score';

const { colors } = theme;

/** How far through the playback `time` is, from 0 to 1. */
export const played = (game: Game, time: number) =>
  game.ended === null ? 0 : Math.min(1, Math.max(0, (time - game.ended) / LISTEN));

/** How loud the playback is at `time`: the bar under the playhead. */
export function playbackLoudness(game: Game, time: number): number {
  return waveOf(game).at(Math.min(SLOTS - 1, Math.floor(played(game, time) * SLOTS))) ?? 0;
}

/** The waveform of the take on the track, lit up to the playhead, at `on` from 0 to 1. */
export function playback(ctx: CanvasRenderingContext2D, game: Game, time: number, on: number) {
  if (on <= 0) return;
  const [x, y, w, h] = [LANE.left, LANE.y - 6.5, LANE.right - LANE.left, 13];
  ctx.save();
  ctx.globalAlpha = on;
  ctx.fillStyle = colors.ink;
  rounded(ctx, x, y, w, h, 3);
  ctx.fill();
  const done = played(game, time);
  const step = (w - 4) / SLOTS;
  waveOf(game).forEach((level, n) => {
    ctx.fillStyle = n / SLOTS <= done ? colors.aurora : colors.slabShade;
    const tall = Math.max(0.6, level * (h - 3));
    rounded(ctx, x + 2 + n * step + step * 0.15, LANE.y - tall / 2, step * 0.7, tall, step * 0.3);
    ctx.fill();
  });
  ctx.fillStyle = colors.gold;
  ctx.fillRect(x + 2 + done * (w - 4) - 0.3, y + 1, 0.6, h - 2);
  const who = game.lost
    ? 'Signal lost! Here’s what made it on air'
    : game.visitor
      ? 'Your take, played back'
      : 'The host’s take, played back';
  letter(ctx, who, { x: x + w / 2, y: y - 3, height: 3, colour: colors.snowLit, width: w - 2 });
  ctx.restore();
}

/** The wrap-up card: the grade, the score, the buttons out and the tap to go again, at `on`. */
export function wrapCard(ctx: CanvasRenderingContext2D, game: Game, best: number, on: number) {
  if (on <= 0) return;
  const [x, y, w, h] = [46, 19, 51, 38.5];
  ctx.save();
  ctx.globalAlpha = on;
  ctx.fillStyle = colors.ink;
  rounded(ctx, x - 0.8, y - 0.8, w + 1.6, h + 1.6, 3.4);
  ctx.fill();
  ctx.fillStyle = colors.surface;
  rounded(ctx, x, y, w, h, 3);
  ctx.fill();
  const { letter: mark, title } = grade(game);
  ctx.fillStyle = game.lost ? colors.berry : colors.gold;
  ctx.beginPath();
  ctx.arc(x + 7.5, y + 10, 5.2, 0, Math.PI * 2);
  ctx.fill();
  letter(ctx, mark, { x: x + 7.5, y: y + 10.4, height: 6.4, colour: colors.ink });
  const left = { x: x + 15, align: 'left' as const, width: w - 17 };
  letter(ctx, title, { ...left, y: y + 7.6, height: 4.4, colour: colors.snowLit });
  const record = best > 0 && game.score >= best && game.visitor ? '  ·  NEW BEST!' : '';
  const tally = `${String(game.score)} points${record}`;
  letter(ctx, tally, { ...left, y: y + 13, height: 2.8, colour: colors.gold });
  letter(ctx, 'Hear the real podcast, on air now:', {
    ...{ x: x + w / 2, y: y + 17.5, height: 2.5, colour: colors.muted },
  });
  for (const b of buttonsFor('wrap')) button(ctx, b);
  const again = !game.visitor
    ? 'Tap anywhere to record your own episode'
    : game.lost
      ? 'Tap anywhere to try episode 1 again'
      : `Tap anywhere to record episode ${String(game.episode + 1)}`;
  letter(ctx, again, { x: x + w / 2, y: y + h - 2.6, height: 2.4, colour: colors.snowShade });
  ctx.restore();
}
