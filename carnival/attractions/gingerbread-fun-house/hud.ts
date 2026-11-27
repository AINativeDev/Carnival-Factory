/**
 * What Icing Echo tells you over the scene: the banner with what to do now,
 * the round and the best of the visit, a dot for each note of the tune as you
 * echo it, and the card when the icing cracks. Every card fades in, never
 * flashes.
 */
import { theme } from '../../../src/northpole/theme';
import { GUARD, phaseOf, type Echo, type Phase } from './echo';
import { letter, rounded } from './lettering';
import { TONE_COLOURS } from './slots';
import { ease, notesIn } from './tune';

const { colors } = theme;

/** The score a game shows: the rounds echoed. */
export function scoreOf(echo: Echo): number {
  return echo.round - (echo.doneAt === null ? 1 : 0);
}

/** What the banner says to do in `phase` of a visitor's game. */
export function instruction(echo: Echo, phase: Phase): string {
  const joins = notesIn(echo.round) > notesIn(echo.round - 1);
  if (phase === 'show') return joins ? 'A new note joins: watch!' : 'Watch the house…';
  if (phase === 'swap') return 'The mirrors swap two notes!';
  if (phase === 'echo') return `Your turn: ${String(echo.echoed)} of ${String(echo.tune.length)}`;
  return `Sweet! Round ${String(echo.round)} iced`;
}

/** The dark iced panel every card sits on. */
function panel(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number) {
  ctx.fillStyle = colors.ink;
  ctx.globalAlpha *= 0.86;
  rounded(ctx, x, y, w, h, 3);
  ctx.fill();
  ctx.globalAlpha /= 0.86;
  ctx.strokeStyle = colors.snowLit;
  ctx.lineWidth = 0.5;
  ctx.stroke();
}

/** A dot for each note of the tune: filled in its colour once echoed, hollow until then. */
function dots(ctx: CanvasRenderingContext2D, echo: Echo, y: number) {
  const gap = Math.min(3.2, 60 / echo.tune.length);
  const left = 50 - ((echo.tune.length - 1) * gap) / 2;
  echo.tune.forEach((note, n) => {
    ctx.beginPath();
    ctx.arc(left + n * gap, y, Math.min(1.05, gap * 0.35), 0, Math.PI * 2);
    if (n < echo.echoed) {
      ctx.fillStyle = TONE_COLOURS.at(note) ?? colors.gold;
      ctx.fill();
    } else {
      ctx.strokeStyle = colors.muted;
      ctx.lineWidth = 0.35;
      ctx.stroke();
    }
  });
}

/** The banner across the top: the game's name in the demo, or what to do now in a game. */
export function banner(ctx: CanvasRenderingContext2D, echo: Echo, time: number) {
  const phase = phaseOf(echo, time);
  if (phase === 'over') return;
  ctx.save();
  if (echo.mode === 'demo') {
    ctx.globalAlpha = 0.9 + 0.1 * Math.sin(time / 900);
    panel(ctx, 12, 3, 76, 15);
    letter(ctx, 'Icing Echo', { x: 50, y: 8.4, height: 5.4, colour: colors.gold, width: 70 });
    const how =
      phase === 'swap'
        ? 'The fun-house mirrors swap two notes! · Tap to play'
        : 'Watch the notes light up, then tap them back · Tap to play';
    letter(ctx, how, { x: 50, y: 14.2, height: 2.7, colour: colors.snowLit, width: 72 });
  } else {
    panel(ctx, 14, 3, 72, 16.5);
    const colour = phase === 'echo' ? colors.mint : colors.snowLit;
    letter(ctx, instruction(echo, phase), { x: 50, y: 7.8, height: 4.4, colour, width: 68 });
    const tally = `Round ${String(echo.round)}  ·  Best ${String(echo.best)}`;
    letter(ctx, tally, { x: 50, y: 12.5, height: 3, colour: colors.gold, width: 68 });
    dots(ctx, echo, 16.2);
  }
  ctx.restore();
}

/** The card once the icing cracks: the rounds echoed, the best of the visit and the tap to go again. */
export function overCard(ctx: CanvasRenderingContext2D, echo: Echo, time: number) {
  if (echo.mode !== 'over' || echo.overAt === null) return;
  const since = time - echo.overAt;
  const on = ease((since - 350) / 450);
  if (on <= 0) return;
  const score = scoreOf(echo);
  ctx.save();
  ctx.globalAlpha = on;
  panel(ctx, 16, 3, 68, 28);
  const line = (text: string, y: number, height: number, colour: string) => {
    letter(ctx, text, { x: 50, y, height, colour, width: 62 });
  };
  line('The icing cracked!', 8, 4.4, colors.horizon);
  line(`${String(score)} ${score === 1 ? 'round' : 'rounds'} echoed`, 14.4, 5.6, colors.snowLit);
  const record = score > 0 && score >= echo.best ? 'A new best this visit!' : '';
  line(record || `Best this visit: ${String(echo.best)}`, 20, 2.9, colors.gold);
  line('The glowing note was next', 23.9, 2.4, colors.muted);
  ctx.globalAlpha = on * ease((since - GUARD) / 400);
  line('Tap to go again', 27.8, 3, colors.mint);
  ctx.restore();
}
