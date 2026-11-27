/**
 * The feedback on every tap, on the house: a ring of icing spreading from
 * where you tapped, in the note's colour for a right note, berry for a wrong
 * one and snow for a tap between notes, and a right note's symbol floating up
 * as it sounds. Each lasts well under a second and fades as it goes.
 */
import { theme } from '../../../src/northpole/theme';
import type { Echo } from './echo';
import { noteSymbol } from './notes';
import { TONE_COLOURS } from './slots';

const { colors } = theme;

/** How long a tap's ring spreads, in ms. */
const RING = 480;
/** How long a right note's symbol floats up. */
const FLOAT = 900;

/** Every recent tap's ring, and the notes floating up from right ones. */
export function sparkles(ctx: CanvasRenderingContext2D, echo: Echo, time: number) {
  ctx.save();
  for (const tap of echo.taps) {
    const age = (time - tap.at) / RING;
    const colour =
      tap.kind === 'right'
        ? (TONE_COLOURS.at(tap.note) ?? colors.gold)
        : tap.kind === 'wrong'
          ? colors.berry
          : colors.snowLit;
    if (age >= 0 && age < 1) {
      ctx.globalAlpha = 0.9 * (1 - age);
      ctx.strokeStyle = colour;
      ctx.lineWidth = 0.9 * (1 - age) + 0.2;
      ctx.beginPath();
      ctx.arc(tap.x, tap.y, 1.5 + age * 6, 0, Math.PI * 2);
      ctx.stroke();
    }
    const rise = (time - tap.at) / FLOAT;
    if (tap.kind === 'right' && rise >= 0 && rise < 1) {
      ctx.globalAlpha = 1 - rise * rise;
      noteSymbol(ctx, tap.note, tap.x + 3 + rise * 2, tap.y - 5 - rise * 9, 5, colour);
    }
  }
  ctx.restore();
}
