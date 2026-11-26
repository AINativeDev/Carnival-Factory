/**
 * The big screen over the stage. With nobody playing it says how to play,
 * between the talk's slides; in a round it shows the talk on now, a point of
 * it appearing with each good question, and how far through the keynote the
 * round is; at the end, the standing ovation or the quiet room, the score,
 * where and when the conference is next, and the big tickets button.
 */
import { glow } from '../../../src/northpole/diorama';
import { theme } from '../../../src/northpole/theme';
import { CARD_BUTTON } from './buttons';
import { EVENT, KEYNOTE, pointsShown, talkAfter, talkOf, TALKS } from './program';
import { type Game, RESTART_AFTER } from './state';
import { words } from './words';

const { colors } = theme;

/** Where the screen is, in the attraction's units. */
const SCREEN = { x: 24, y: 6, w: 52, h: 34 } as const;
const MID = SCREEN.x + SCREEN.w / 2;
const WIDE = SCREEN.w - 6;

/** Whether the demo's screen is on its how-to-play card at `time`, rather than the talk. */
export const howToShows = (time: number) => time % 10_000 < 6_000;

/** How far a slide that went up at `since` has faded in at `time`. */
const fadeIn = (since: number, time: number) => Math.max(0, Math.min(1, (time - since) / 400));

function frame(ctx: CanvasRenderingContext2D, time: number) {
  ctx.fillStyle = colors.ink;
  ctx.beginPath();
  ctx.roundRect(SCREEN.x - 0.9, SCREEN.y - 0.9, SCREEN.w + 1.8, SCREEN.h + 1.8, 1.2);
  ctx.fill();
  const face = ctx.createLinearGradient(0, SCREEN.y, 0, SCREEN.y + SCREEN.h);
  face.addColorStop(0, colors.night);
  face.addColorStop(1, colors.surface);
  ctx.fillStyle = face;
  ctx.fillRect(SCREEN.x, SCREEN.y, SCREEN.w, SCREEN.h);
  ctx.save();
  ctx.beginPath();
  ctx.rect(SCREEN.x, SCREEN.y, SCREEN.w, SCREEN.h);
  ctx.clip();
  // A slow aurora drifting behind the slides.
  const drift = Math.sin(time / 7_000) * 14;
  ctx.fillStyle = colors.aurora;
  for (const [dx, r] of [
    [0, 18],
    [10, 12],
  ] as const) {
    ctx.globalAlpha = 0.07;
    ctx.beginPath();
    ctx.ellipse(MID + drift + dx, SCREEN.y + SCREEN.h, r * 1.6, r, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
  ctx.restore();
}

function header(ctx: CanvasRenderingContext2D, right: string) {
  const y = SCREEN.y + 2.4;
  words(ctx, EVENT.title, SCREEN.x + 2, y, { size: 2, color: colors.mint, align: 'left' });
  words(ctx, right, SCREEN.x + SCREEN.w - 2, y, { size: 2, color: colors.muted, align: 'right' });
}

/** A rounded button, its words centred. */
function button(
  ctx: CanvasRenderingContext2D,
  area: typeof CARD_BUTTON,
  text: string,
  size: number,
) {
  ctx.fillStyle = colors.mint;
  ctx.beginPath();
  ctx.roundRect(area.x, area.y, area.w, area.h, area.h / 2);
  ctx.fill();
  words(ctx, text, area.x + area.w / 2, area.y + area.h / 2, {
    size,
    color: colors.ink,
    max: area.w - 3,
  });
}

function howTo(ctx: CanvasRenderingContext2D, game: Game, time: number) {
  header(ctx, 'Keynote');
  words(ctx, 'Keep the room buzzing', MID, 14, { size: 4.2, color: colors.gold, max: WIDE });
  words(ctx, 'Pass the mic to questions about AI dev', MID, 20, {
    size: 2.6,
    color: colors.text,
    max: WIDE,
  });
  words(ctx, "Leave the off-topic ones, and don't let the hype run out", MID, 24, {
    size: 2.2,
    color: colors.muted,
    max: WIDE,
  });
  const breathe = 1 + Math.sin(time / 600) * 0.03;
  ctx.save();
  ctx.translate(MID, 30.5);
  ctx.scale(breathe, breathe);
  button(ctx, { x: -11, y: -3, w: 22, h: 6 }, 'Tap to play', 3);
  ctx.restore();
  if (game.best > 0) {
    words(ctx, `Best ${String(game.best)}`, MID, 36.5, { size: 2.2, color: colors.gold });
  }
}

function slide(ctx: CanvasRenderingContext2D, answered: number, time: number, since: number) {
  const n = talkAfter(answered);
  const talk = talkOf(n);
  header(ctx, `Talk ${String(n + 1)} of ${String(TALKS.length)}`);
  ctx.globalAlpha = fadeIn(since, time);
  words(ctx, talk.title, MID, 13.5, { size: 4.2, color: colors.text, max: WIDE });
  words(ctx, talk.subtitle, MID, 18.3, { size: 2.5, color: colors.mint, max: WIDE });
  const shown = pointsShown(answered);
  talk.points.forEach((point, k) => {
    const y = 23 + k * 4;
    if (k < shown) {
      ctx.fillStyle = colors.mint;
      ctx.fillRect(SCREEN.x + 7, y - 1, 2, 2);
      words(ctx, point, SCREEN.x + 11, y, { size: 2.5, color: colors.text, align: 'left' });
    } else {
      ctx.fillStyle = colors.muted;
      ctx.globalAlpha *= 0.25;
      ctx.fillRect(SCREEN.x + 7, y - 0.6, 26 - k * 4, 1.2);
      ctx.globalAlpha = fadeIn(since, time);
    }
  });
  words(ctx, `Speaker: ${talk.speaker}`, MID, 35.4, { size: 2, color: colors.muted });
  ctx.globalAlpha = 1;
  // How far through the keynote: a segment per talk.
  const segment = SCREEN.w / TALKS.length;
  for (let k = 0; k < TALKS.length; k++) {
    const done = Math.max(0, Math.min(1, answered / (KEYNOTE / TALKS.length) - k));
    ctx.fillStyle = colors.night;
    ctx.fillRect(SCREEN.x + k * segment + 0.4, 38.4, segment - 0.8, 0.9);
    ctx.fillStyle = colors.gold;
    ctx.fillRect(SCREEN.x + k * segment + 0.4, 38.4, (segment - 0.8) * done, 0.9);
  }
}

function ending(ctx: CanvasRenderingContext2D, game: Game, time: number) {
  const won = game.mode === 'won';
  header(ctx, won ? 'Encore!' : 'Keynote');
  ctx.globalAlpha = fadeIn(game.endedAt, time);
  if (won) glow(ctx, MID, 13.5, 16, 0.7);
  words(ctx, won ? 'Standing ovation!' : 'The room went quiet', MID, 13.5, {
    size: 4.4,
    color: won ? colors.gold : colors.text,
    max: WIDE,
  });
  words(ctx, `Score ${String(game.score)} · Best ${String(game.best)}`, MID, 18.5, {
    size: 3,
    color: colors.text,
  });
  words(ctx, `${EVENT.title} · ${EVENT.next}`, MID, 22.4, { size: 2.4, color: colors.mint });
  words(ctx, EVENT.when, MID, 25.4, { size: 2.4, color: colors.snowLit });
  button(ctx, CARD_BUTTON, EVENT.tickets, 3.2);
  if (time - game.endedAt >= RESTART_AFTER) {
    words(ctx, 'Tap anywhere else to play again', MID, 37, { size: 2.1, color: colors.muted });
  }
  ctx.globalAlpha = 1;
}

/** Draws the screen as the game stands at `time`. */
export function screen(ctx: CanvasRenderingContext2D, game: Game, time: number) {
  frame(ctx, time);
  if (game.mode === 'won' || game.mode === 'lost') ending(ctx, game, time);
  else if (game.mode === 'play') slide(ctx, game.answered, time, game.talkAt);
  else if (howToShows(time)) howTo(ctx, game, time);
  else slide(ctx, game.answered, time, time - (time % 10_000) + 6_000);
}
