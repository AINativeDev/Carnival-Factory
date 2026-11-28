/**
 * The factory's helpers, as the stations' little cast: the elf who reads
 * every request and thunks the stamp down, the agent (a boxy bot with a
 * glowing antenna) who builds it, and the shepherd, a woolly sheep with a
 * crook, who answers the reviewer's findings. Each is `s` tall, standing on
 * `x`, `y` with a cool shadow under it, and moves from `time`.
 */
import { shadow } from '../../../src/northpole/diorama';
import { theme } from '../../../src/northpole/theme';
import { rounded } from './kit';

const { colors } = theme;

/** A disc. */
function disc(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, fill: string) {
  ctx.fillStyle = fill;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();
}

/** Two dot eyes and a smile on a face round 0, `r` across. */
function face(ctx: CanvasRenderingContext2D, r: number) {
  disc(ctx, -r * 0.35, -r * 0.1, r * 0.12, colors.ink);
  disc(ctx, r * 0.35, -r * 0.1, r * 0.12, colors.ink);
  ctx.strokeStyle = colors.ink;
  ctx.lineWidth = r * 0.1;
  ctx.beginPath();
  ctx.arc(0, r * 0.1, r * 0.35, 0.2 * Math.PI, 0.8 * Math.PI);
  ctx.stroke();
}

/** The elf, its stamp raised by `raise` (1 up, 0 slammed down). */
export function elf(ctx: CanvasRenderingContext2D, x: number, y: number, s: number, raise: number) {
  ctx.save();
  ctx.translate(x, y);
  shadow(ctx, 0, 0, s * 0.55);
  ctx.fillStyle = colors.pine;
  rounded(ctx, -s * 0.2, -s * 0.5, s * 0.4, s * 0.5, s * 0.08);
  ctx.fill();
  ctx.fillStyle = colors.gold;
  ctx.fillRect(-s * 0.2, -s * 0.2, s * 0.4, s * 0.05);
  ctx.save();
  ctx.translate(-s * 0.2, -s * 0.62);
  disc(ctx, 0, 0, s * 0.17, colors.snowLit);
  face(ctx, s * 0.17);
  ctx.fillStyle = colors.berry;
  ctx.beginPath();
  ctx.moveTo(-s * 0.18, -s * 0.08);
  ctx.lineTo(s * 0.18, -s * 0.08);
  ctx.lineTo(s * 0.32, -s * 0.36);
  ctx.fill();
  disc(ctx, s * 0.32, -s * 0.36, s * 0.05, colors.snow);
  ctx.restore();
  ctx.translate(s * 0.15, -s * 0.38);
  ctx.rotate(-0.4 - raise * 1.1);
  ctx.fillStyle = colors.pine;
  ctx.fillRect(0, -s * 0.04, s * 0.3, s * 0.08);
  ctx.fillStyle = colors.wood;
  ctx.fillRect(s * 0.28, -s * 0.03, s * 0.12, s * 0.06);
  ctx.fillStyle = colors.berry;
  ctx.fillRect(s * 0.38, -s * 0.1, s * 0.08, s * 0.2);
  ctx.restore();
}

/** The agent: a boxy bot with a glowing antenna, its arms busy while `busy`. */
export function bot(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  s: number,
  busy: boolean,
  time: number,
) {
  ctx.save();
  ctx.translate(x, y);
  shadow(ctx, 0, 0, s * 0.6);
  ctx.translate(0, busy ? Math.sin(time / 90) * s * 0.02 : 0);
  ctx.fillStyle = colors.slabShade;
  rounded(ctx, -s * 0.22, -s * 0.48, s * 0.44, s * 0.44, s * 0.06);
  ctx.fill();
  ctx.fillStyle = colors.slab;
  rounded(ctx, -s * 0.2, -s * 0.9, s * 0.4, s * 0.34, s * 0.08);
  ctx.fill();
  ctx.fillStyle = colors.night;
  rounded(ctx, -s * 0.15, -s * 0.84, s * 0.3, s * 0.2, s * 0.05);
  ctx.fill();
  disc(ctx, -s * 0.06, -s * 0.74, s * 0.035, colors.mint);
  disc(ctx, s * 0.06, -s * 0.74, s * 0.035, colors.mint);
  ctx.strokeStyle = colors.slabShade;
  ctx.lineWidth = s * 0.03;
  ctx.beginPath();
  ctx.moveTo(0, -s * 0.9);
  ctx.lineTo(0, -s * 1.02);
  ctx.stroke();
  // The antenna glows softly up and down, never blinking.
  ctx.globalAlpha = 0.25 + 0.2 * Math.sin(time / 600);
  disc(ctx, 0, -s * 1.04, s * 0.09, colors.glow);
  ctx.globalAlpha = 1;
  disc(ctx, 0, -s * 1.04, s * 0.04, colors.lantern);
  const swing = busy ? Math.sin(time / 70) * 0.6 : 0;
  for (const side of [-1, 1]) {
    ctx.save();
    ctx.translate(side * s * 0.22, -s * 0.4);
    ctx.rotate(side * (0.5 + swing));
    ctx.fillStyle = colors.slabShade;
    ctx.fillRect(-s * 0.03, 0, s * 0.06, s * 0.26);
    ctx.restore();
  }
  ctx.fillRect(-s * 0.16, -s * 0.06, s * 0.08, s * 0.06);
  ctx.fillRect(s * 0.08, -s * 0.06, s * 0.08, s * 0.06);
  ctx.restore();
}

/** The shepherd: a woolly sheep holding a crook, trotting in by `arrive` (0 off to the right, 1 there). */
export function sheep(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  s: number,
  arrive: number,
  time: number,
) {
  if (arrive <= 0) return;
  ctx.save();
  ctx.translate(
    x + (1 - arrive) * 40,
    y - Math.abs(Math.sin(time / 120)) * s * 0.04 * (1 - arrive),
  );
  shadow(ctx, 0, 0, s * 0.7);
  ctx.fillStyle = colors.ink;
  for (const lx of [-0.18, -0.06, 0.08, 0.2]) ctx.fillRect(lx * s, -s * 0.18, s * 0.05, s * 0.18);
  for (const [bx, by, r] of [
    [-0.15, -0.36, 0.17],
    [0.05, -0.4, 0.19],
    [0.2, -0.33, 0.15],
    [-0.02, -0.26, 0.16],
  ] as const) {
    disc(ctx, bx * s, by * s, r * s, colors.snowLit);
  }
  ctx.save();
  ctx.translate(-s * 0.3, -s * 0.42);
  disc(ctx, 0, 0, s * 0.13, colors.ink);
  disc(ctx, -s * 0.04, -s * 0.02, s * 0.03, colors.snow);
  disc(ctx, s * 0.05, -s * 0.02, s * 0.03, colors.snow);
  ctx.restore();
  ctx.strokeStyle = colors.wood;
  ctx.lineWidth = s * 0.04;
  ctx.beginPath();
  ctx.moveTo(-s * 0.45, 0);
  ctx.lineTo(-s * 0.45, -s * 0.75);
  ctx.arc(-s * 0.37, -s * 0.75, s * 0.08, Math.PI, 0);
  ctx.stroke();
  ctx.restore();
}
