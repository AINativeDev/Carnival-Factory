/**
 * The visitor, as a ticket: a little paper ticket with notched sides,
 * googly eyes that jiggle as it bobs, and a grin, carrying its booth's
 * picture and "My booth: …", with its labels hanging off it (booth-request,
 * then tessl once accepted) and the assessment's ACCEPTED stamp once it has
 * been thunked on. Everything moves from `time`.
 */
import { theme } from '../../../src/northpole/theme';
import { letters, rounded, TYPE } from './kit';
import { boothIcon } from './icons';
import { BOOTHS } from './steps';

const { colors } = theme;

/** What the ticket wears and carries. */
export interface TicketLook {
  booth: number;
  look: number;
  /** Its labels, top first. */
  labels: readonly string[];
  /** How far the ACCEPTED stamp has come down, 0 (none) to 1. */
  stamp: number;
}

/** A googly eye: a white ball and a black pupil that rolls round with `roll`. */
function googly(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, roll: number) {
  ctx.fillStyle = colors.snowLit;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = colors.ink;
  ctx.lineWidth = r * 0.15;
  ctx.stroke();
  ctx.fillStyle = colors.ink;
  ctx.beginPath();
  ctx.arc(
    x + Math.cos(roll) * r * 0.4,
    y + 0.3 * r + Math.sin(roll) * r * 0.25,
    r * 0.5,
    0,
    Math.PI * 2,
  );
  ctx.fill();
}

/** The paper: a cream card with a half-circle bite out of each side. */
function paperShape(ctx: CanvasRenderingContext2D, w: number, h: number) {
  ctx.beginPath();
  ctx.moveTo(-w / 2, -h / 2);
  ctx.lineTo(w / 2, -h / 2);
  ctx.arc(w / 2, 0, h * 0.16, -Math.PI / 2, Math.PI / 2, true);
  ctx.lineTo(w / 2, h / 2);
  ctx.lineTo(-w / 2, h / 2);
  ctx.arc(-w / 2, 0, h * 0.16, Math.PI / 2, -Math.PI / 2, true);
  ctx.closePath();
}

/** A label tag hanging from the ticket's foot. */
function tag(ctx: CanvasRenderingContext2D, text: string, y: number, s: number, gold: boolean) {
  letters(ctx, s * 0.11);
  const w = ctx.measureText(text).width + s * 0.12;
  ctx.fillStyle = gold ? colors.gold : colors.ice;
  rounded(ctx, -w / 2, y, w, s * 0.17, s * 0.05);
  ctx.fill();
  ctx.fillStyle = colors.ink;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, 0, y + s * 0.09);
}

/** The ACCEPTED stamp, slammed down at an angle: big and faint at first, then small and solid. */
function stampMark(ctx: CanvasRenderingContext2D, s: number, down: number) {
  if (down <= 0) return;
  ctx.save();
  // Over the picture, on the right, so "My booth" still reads under it.
  ctx.translate(s * 0.22, -s * 0.06);
  ctx.rotate(-0.3);
  // Settles at a size whose letters still read (TYPE.micro or more) on a station's ticket.
  const grow = 0.9 * (1 + (1 - Math.min(down, 1)) * 1.5);
  ctx.scale(grow, grow);
  ctx.globalAlpha = Math.min(down, 1);
  ctx.strokeStyle = colors.berry;
  ctx.lineWidth = s * 0.025;
  rounded(ctx, -s * 0.36, -s * 0.09, s * 0.72, s * 0.18, s * 0.03);
  ctx.stroke();
  ctx.fillStyle = colors.berry;
  letters(ctx, s * 0.12);
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('ACCEPTED', 0, s * 0.01);
  ctx.restore();
}

/**
 * What's written on the ticket: "My booth:" and the booth's name, on a
 * ticket big enough for them to read (no text below TYPE.micro), or a line
 * of handwriting on a smaller one.
 */
function writing(ctx: CanvasRenderingContext2D, s: number, h: number, booth: number) {
  if (s * 0.075 < TYPE.micro) {
    ctx.fillStyle = colors.slabShade;
    rounded(ctx, -s * 0.36, h * 0.16, s * 0.4, s * 0.035, s * 0.02);
    ctx.fill();
    rounded(ctx, -s * 0.36, h * 0.3, s * 0.3, s * 0.035, s * 0.02);
    ctx.fill();
    return;
  }
  ctx.fillStyle = colors.wood;
  letters(ctx, s * 0.075);
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('MY BOOTH:', -s * 0.16, h * 0.18, s * 0.45);
  ctx.fillStyle = colors.ink;
  letters(ctx, s * 0.085);
  ctx.fillText(BOOTHS.at(booth) ?? '', -s * 0.16, h * 0.32, s * 0.5);
}

/** The ticket, `s` wide, its middle at `x`, `y`, bobbing and blinking at `time`. */
export function ticket(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  s: number,
  look: TicketLook,
  time: number,
) {
  const h = s * 0.62;
  ctx.save();
  ctx.translate(x, y + Math.sin(time / 420) * s * 0.03);
  ctx.rotate(Math.sin(time / 700) * 0.05);
  look.labels.forEach((label, n) => {
    tag(ctx, label, h / 2 + s * 0.03 + n * s * 0.2, s, label === 'tessl');
  });
  ctx.fillStyle = colors.shadow;
  ctx.globalAlpha = 0.4;
  ctx.translate(s * 0.03, s * 0.04);
  paperShape(ctx, s, h);
  ctx.fill();
  ctx.translate(-s * 0.03, -s * 0.04);
  ctx.globalAlpha = 1;
  ctx.fillStyle = colors.cream;
  paperShape(ctx, s, h);
  ctx.fill();
  boothIcon(ctx, look.booth, look.look, s * 0.25, h * 0.08, s * 0.34, time);
  const roll = time / 260;
  const blink = (time / 3_100) % 1 > 0.96;
  if (blink) {
    ctx.fillStyle = colors.ink;
    ctx.fillRect(-s * 0.33, -h * 0.25, s * 0.14, s * 0.02);
    ctx.fillRect(-s * 0.13, -h * 0.25, s * 0.14, s * 0.02);
  } else {
    googly(ctx, -s * 0.26, -h * 0.22, s * 0.08, roll);
    googly(ctx, -s * 0.06, -h * 0.22, s * 0.08, roll + 1.3);
  }
  ctx.strokeStyle = colors.ink;
  ctx.lineWidth = s * 0.02;
  ctx.beginPath();
  ctx.arc(-s * 0.16, -h * 0.05, s * 0.07, 0.15 * Math.PI, 0.85 * Math.PI);
  ctx.stroke();
  writing(ctx, s, h, look.booth);
  stampMark(ctx, s, look.stamp);
  ctx.restore();
}
