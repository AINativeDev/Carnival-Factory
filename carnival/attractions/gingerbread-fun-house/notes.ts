/**
 * Each of the house's six notes has a musical symbol of its own, drawn in
 * shapes on a little iced badge, so a note reads by its shape as well as its
 * colour: a quaver, a crotchet, two beamed quavers, a minim, a semiquaver and
 * a semibreve.
 */
import { theme } from '../../../src/northpole/theme';
import { TONE_COLOURS } from './slots';

const { colors } = theme;

/** A note head: a tilted oval, filled or hollow, with its middle at `x`, `y`. */
function head(ctx: CanvasRenderingContext2D, x: number, y: number, h: number, hollow: boolean) {
  ctx.beginPath();
  ctx.ellipse(x, y, h * 0.24, h * 0.17, -0.4, 0, Math.PI * 2);
  if (hollow) {
    ctx.lineWidth = h * 0.08;
    ctx.stroke();
  } else ctx.fill();
}

/** A stem up from a head at `x`, `y`, and `flags` flags off its top. */
function stem(ctx: CanvasRenderingContext2D, x: number, y: number, h: number, flags: number) {
  const top = y - h * 0.78;
  ctx.fillRect(x + h * 0.17, top, h * 0.08, h * 0.78);
  for (let n = 0; n < flags; n++) {
    const at = top + n * h * 0.2;
    ctx.beginPath();
    ctx.moveTo(x + h * 0.25, at);
    ctx.quadraticCurveTo(x + h * 0.6, at + h * 0.18, x + h * 0.42, at + h * 0.42);
    ctx.lineTo(x + h * 0.38, at + h * 0.38);
    ctx.quadraticCurveTo(x + h * 0.48, at + h * 0.2, x + h * 0.25, at + h * 0.14);
    ctx.closePath();
    ctx.fill();
  }
}

/** Note `note`'s symbol, `h` units tall, centred on `x`, `y`, in `colour`. */
export function noteSymbol(
  ctx: CanvasRenderingContext2D,
  note: number,
  x: number,
  y: number,
  h: number,
  colour: string,
) {
  ctx.save();
  ctx.fillStyle = colour;
  ctx.strokeStyle = colour;
  const base = y + h * 0.36;
  const left = x - h * 0.12;
  switch (note) {
    case 0:
    case 4:
      head(ctx, left, base, h, false);
      stem(ctx, left, base, h, note === 0 ? 1 : 2);
      break;
    case 1:
      head(ctx, left, base, h, false);
      stem(ctx, left, base, h, 0);
      break;
    case 2:
      // Two quavers joined by a beam.
      for (const dx of [-0.26, 0.26]) {
        head(ctx, x + dx * h - h * 0.1, base, h, false);
        stem(ctx, x + dx * h - h * 0.1, base, h, 0);
      }
      ctx.fillRect(x - h * 0.2, y + h * 0.36 - h * 0.78, h * 0.52, h * 0.13);
      break;
    case 3:
      head(ctx, left, base, h, true);
      stem(ctx, left, base, h, 0);
      break;
    default:
      head(ctx, x, y, h * 1.25, true);
  }
  ctx.restore();
}

/**
 * Note `note`'s badge at `x`, `y`: an iced disc ringed in the note's colour
 * with its symbol on, filling with the colour and swelling as it's `lit`.
 */
export function badge(
  ctx: CanvasRenderingContext2D,
  note: number,
  x: number,
  y: number,
  lit: number,
) {
  const colour = TONE_COLOURS.at(note) ?? colors.gold;
  const r = 2.7 * (1 + 0.22 * lit);
  ctx.save();
  ctx.fillStyle = colors.ink;
  ctx.globalAlpha = 0.85;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = lit;
  ctx.fillStyle = colour;
  ctx.fill();
  ctx.globalAlpha = 1;
  ctx.strokeStyle = colour;
  ctx.lineWidth = 0.6;
  ctx.stroke();
  ctx.restore();
  noteSymbol(ctx, note, x, y - r * 0.05, r * 1.3, lit > 0.5 ? colors.ink : colors.snowLit);
}

/** A soft coloured halo round a lit note, at `strength` from 0 to 1. */
export function halo(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  r: number,
  colour: string,
  strength: number,
) {
  if (strength <= 0) return;
  ctx.save();
  ctx.fillStyle = colour;
  for (const k of [1, 0.7, 0.45]) {
    ctx.globalAlpha = 0.2 * strength;
    ctx.beginPath();
    ctx.arc(x, y, r * k, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}
