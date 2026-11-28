/**
 * After the recording: the take played back on the screen as a waveform built
 * from the words said, a playhead running over it; then the end card, in the
 * Tessl places' shared shape: an eyebrow, the grade as the title, a one-line
 * result, the podcast as the hero, YouTube and "Play again ▶" side by side,
 * and one quiet line naming the keys.
 */
import { theme } from '../../../src/northpole/theme';
import { buttonsFor } from './buttons';
import { LISTEN, type Game } from './game';
import { button } from './footer';
import { LANE, SCENE } from './layout';
import { caps, letter, rounded, TYPE } from './lettering';
import { grade, grouped, saidCount, SLOTS, waveOf } from './score';

const { colors } = theme;

/** How far through the playback `time` is, from 0 to 1. */
export const played = (game: Game, time: number) =>
  game.ended === null ? 0 : Math.min(1, Math.max(0, (time - game.ended) / LISTEN));

/** How loud the playback is at `time`: the bar under the playhead. */
export function playbackLoudness(game: Game, time: number): number {
  return waveOf(game).at(Math.min(SLOTS - 1, Math.floor(played(game, time) * SLOTS))) ?? 0;
}

/** The waveform of the take on the screen, lit up to the playhead, at `on` from 0 to 1. */
export function playback(ctx: CanvasRenderingContext2D, game: Game, time: number, on: number) {
  if (on <= 0) return;
  const [x, w, h] = [LANE.left + 3, LANE.right - LANE.left - 6, LANE.half * 2 - 4];
  ctx.save();
  ctx.globalAlpha = on;
  const done = played(game, time);
  const step = w / SLOTS;
  waveOf(game).forEach((level, n) => {
    ctx.fillStyle = n / SLOTS <= done ? colors.aurora : colors.slabShade;
    const tall = Math.max(0.6, level * h);
    rounded(ctx, x + n * step + step * 0.15, LANE.y - tall / 2, step * 0.7, tall, step * 0.3);
    ctx.fill();
  });
  ctx.fillStyle = colors.gold;
  ctx.fillRect(x + done * w - 0.3, LANE.y - h / 2 - 0.5, 0.6, h + 1);
  ctx.restore();
}

/** The card's box, over the scene. */
const CARD = { x: 8, y: 20, w: 84, h: 63 } as const;

/** The card's eyebrow, title and result line for `game`. */
function wording(game: Game, best: number) {
  const { letter: mark, title } = grade(game);
  const said = `${String(saidCount(game))} of ${String(game.beats.length)} words`;
  const points = `${grouped(game.score)} points`;
  const record = game.visitor && best > 0 && game.score >= best ? 'New best · ' : '';
  const eyebrow = !game.visitor
    ? 'HOST’S DEMO'
    : `EPISODE ${String(game.episode)} ${game.lost ? 'OFF AIR' : 'RECORDED'}`;
  return { mark, title, eyebrow, result: `${record}${points} · ${said}` };
}

/** The end card, rising a unit as it fades in by `on`, with its buttons drawn at `time`. */
export function wrapCard(
  ctx: CanvasRenderingContext2D,
  game: Game,
  best: number,
  time: number,
  on: number,
) {
  if (on <= 0) return;
  ctx.save();
  ctx.globalAlpha = on * 0.55;
  ctx.fillStyle = colors.night;
  rounded(ctx, SCENE.x, SCENE.y, SCENE.w, SCENE.h, 2.2);
  ctx.fill();
  ctx.globalAlpha = on;
  ctx.translate(0, 1 - on);
  ctx.globalAlpha = on * 0.7;
  ctx.fillStyle = colors.shadow;
  rounded(ctx, CARD.x, CARD.y + 0.6, CARD.w, CARD.h, 2.2);
  ctx.fill();
  ctx.globalAlpha = on * 0.92;
  ctx.fillStyle = colors.night;
  rounded(ctx, CARD.x, CARD.y, CARD.w, CARD.h, 2.2);
  ctx.fill();
  ctx.globalAlpha = on;
  const text = wording(game, best);
  const left = CARD.x + 6;
  caps(ctx, text.eyebrow, { x: left, y: CARD.y + 6, height: TYPE.micro, colour: colors.muted });
  ctx.fillStyle = colors.gold;
  ctx.fillRect(left, CARD.y + 8.4, 8, 0.5);
  ctx.fillStyle = game.lost ? colors.berry : colors.gold;
  ctx.beginPath();
  ctx.arc(left + 5, CARD.y + 18.5, 5, 0, Math.PI * 2);
  ctx.fill();
  letter(ctx, text.mark, {
    x: left + 5,
    y: CARD.y + 18.8,
    height: TYPE.title,
    colour: colors.night,
  });
  const words = { x: left + 13, align: 'left' as const, width: CARD.w - 25 };
  letter(ctx, text.title, { ...words, y: CARD.y + 16, height: TYPE.title, colour: colors.snowLit });
  letter(ctx, text.result, {
    ...words,
    y: CARD.y + 22.4,
    height: TYPE.body,
    colour: colors.muted,
    bold: false,
  });
  for (const b of buttonsFor('wrap', game.visitor)) button(ctx, b, time);
  const keys = game.visitor ? 'Space or Enter plays again' : 'Space or Enter goes on air';
  letter(ctx, keys, {
    x: 50,
    y: CARD.y + CARD.h - 5,
    height: TYPE.body,
    colour: colors.muted,
    bold: false,
  });
  ctx.restore();
}
