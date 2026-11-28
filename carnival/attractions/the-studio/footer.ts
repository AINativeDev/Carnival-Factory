/**
 * The footer under the scene, and how every button in the studio looks. The
 * footer holds the hint on the left, at most two short lines that name both
 * a tap and the keys, and the one button on the right. Buttons follow the
 * Tessl places' language: one gold primary that breathes gently, light
 * secondaries, and underlined text for a quiet link out.
 */
import { theme } from '../../../src/northpole/theme';
import { buttonsFor, type Button } from './buttons';
import { appear, breath } from './cues';
import { phaseOf, type Game } from './game';
import { FOOTER, MARGIN } from './layout';
import { letter, measure, rounded, TYPE } from './lettering';

const { colors } = theme;

/** A button drawn at `time`: its shape and weight, its label, and a glow if it's the primary. */
export function button(ctx: CanvasRenderingContext2D, b: Button, time: number) {
  const mid = b.y + b.h / 2 + 0.2;
  if (b.weight === 'tertiary') {
    const right = b.x + b.w;
    const look = {
      x: right,
      y: mid,
      height: TYPE.body,
      colour: colors.gold,
      align: 'right' as const,
    };
    letter(ctx, b.label, look);
    ctx.fillStyle = colors.gold;
    ctx.fillRect(
      right - measure(ctx, b.label, TYPE.body),
      mid + 1.9,
      measure(ctx, b.label, TYPE.body),
      0.3,
    );
    return;
  }
  const primary = b.weight === 'primary';
  const alpha = ctx.globalAlpha;
  if (primary) {
    // A soft halo, fading out in three steps, that swells and settles every 2 s.
    ctx.fillStyle = colors.gold;
    for (const k of [1, 2, 3]) {
      ctx.globalAlpha = alpha * (0.05 + 0.05 * breath(time)) * (1 - k / 4);
      rounded(ctx, b.x - k * 0.7, b.y - k * 0.7, b.w + k * 1.4, b.h + k * 1.4, 2.2 + k * 0.7);
      ctx.fill();
    }
  }
  ctx.globalAlpha = alpha * 0.7;
  ctx.fillStyle = colors.shadow;
  rounded(ctx, b.x, b.y + 0.6, b.w, b.h, 2.2);
  ctx.fill();
  ctx.globalAlpha = alpha * (primary ? 1 : 0.92);
  ctx.fillStyle = primary ? colors.gold : colors.snowLit;
  rounded(ctx, b.x, b.y, b.w, b.h, 2.2);
  ctx.fill();
  ctx.globalAlpha = alpha;
  const height = primary ? TYPE.lead : TYPE.body;
  letter(ctx, b.label, { x: b.x + b.w / 2, y: mid, height, colour: colors.night, width: b.w - 3 });
}

/** The hint's lines for `game` at `time`: what to do now, and with which keys. */
function hintOf(game: Game, time: number): readonly string[] {
  const phase = phaseOf(game, time);
  if (!game.visitor)
    return ['Say each word as it hits the ring', 'Tap, Space or Enter on the beat'];
  if (phase === 'record')
    return ['Tap, Space or Enter on the beat', 'Hold the gold words to the end'];
  const take = game.lost ? 'Signal lost. Here’s your take' : 'Your take, played back';
  return [take, 'Tap or Space to cheer'];
}

/** When the footer's lines last changed, so they ease in: the episode's start, or its end. */
const since = (game: Game, time: number) =>
  game.visitor && game.ended !== null ? time - game.ended : time - game.start;

/** The footer: the hint easing in on the left, and the one button on the right. */
export function footer(ctx: CanvasRenderingContext2D, game: Game, time: number) {
  const phase = phaseOf(game, time);
  if (phase === 'wrap') return;
  const lines = hintOf(game, time);
  const shown = game.visitor ? appear(since(game, time)) : 1;
  ctx.save();
  ctx.globalAlpha = shown;
  lines.forEach((line, n) => {
    const y = FOOTER.mid + (n - (lines.length - 1) / 2) * 4.6 + (1 - shown);
    const colour = n ? colors.muted : colors.snowLit;
    letter(ctx, line, { x: MARGIN, y, height: TYPE.body, colour, bold: !n, align: 'left' });
  });
  ctx.restore();
  for (const b of buttonsFor(phase, game.visitor)) button(ctx, b, time);
}
