/**
 * The silly booths a ticket can ask for, in chalk-box shapes: a penguin DJ
 * in headphones, a cocoa volcano spitting marshmallows and a snowball cannon
 * mid-shot; and the three looks the form offers, drawn over any of them:
 * the house diorama (a soft shadow), pixel art (a pixel grid) or papercut (a
 * paper edge round it).
 */
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

/** A penguin in gold headphones, nodding to the beat. */
function penguinDj(ctx: CanvasRenderingContext2D, s: number, time: number) {
  ctx.rotate(Math.sin(time / 180) * 0.08);
  ctx.fillStyle = colors.ink;
  ctx.beginPath();
  ctx.ellipse(0, 0.05 * s, 0.28 * s, 0.4 * s, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = colors.snow;
  ctx.beginPath();
  ctx.ellipse(0, 0.12 * s, 0.17 * s, 0.28 * s, 0, 0, Math.PI * 2);
  ctx.fill();
  disc(ctx, -0.08 * s, -0.2 * s, 0.045 * s, colors.snow);
  disc(ctx, 0.08 * s, -0.2 * s, 0.045 * s, colors.snow);
  ctx.fillStyle = colors.gold;
  ctx.beginPath();
  ctx.moveTo(-0.06 * s, -0.12 * s);
  ctx.lineTo(0.06 * s, -0.12 * s);
  ctx.lineTo(0, -0.03 * s);
  ctx.fill();
  ctx.strokeStyle = colors.gold;
  ctx.lineWidth = 0.05 * s;
  ctx.beginPath();
  ctx.arc(0, -0.15 * s, 0.27 * s, Math.PI * 1.1, Math.PI * 1.9);
  ctx.stroke();
  disc(ctx, -0.27 * s, -0.12 * s, 0.08 * s, colors.berry);
  disc(ctx, 0.27 * s, -0.12 * s, 0.08 * s, colors.berry);
}

/** A cocoa volcano, marshmallows popping out of its top. */
function cocoaVolcano(ctx: CanvasRenderingContext2D, s: number, time: number) {
  ctx.fillStyle = colors.wood;
  ctx.beginPath();
  ctx.moveTo(-0.42 * s, 0.42 * s);
  ctx.lineTo(-0.12 * s, -0.12 * s);
  ctx.lineTo(0.12 * s, -0.12 * s);
  ctx.lineTo(0.42 * s, 0.42 * s);
  ctx.fill();
  ctx.fillStyle = colors.cocoa;
  ctx.beginPath();
  ctx.moveTo(-0.13 * s, -0.12 * s);
  ctx.lineTo(0.13 * s, -0.12 * s);
  ctx.lineTo(0.18 * s, 0.05 * s);
  ctx.lineTo(0.05 * s, 0);
  ctx.lineTo(-0.02 * s, 0.12 * s);
  ctx.lineTo(-0.16 * s, 0.02 * s);
  ctx.fill();
  for (let n = 0; n < 3; n++) {
    const t = (time / 900 + n / 3) % 1;
    const x = (n - 1) * 0.16 * s * t;
    const y = -0.15 * s - Math.sin(t * Math.PI) * 0.3 * s;
    ctx.fillStyle = colors.cream;
    rounded(ctx, x - 0.05 * s, y - 0.05 * s, 0.1 * s, 0.1 * s, 0.02 * s);
    ctx.fill();
  }
}

/** A snowball cannon, a snowball flying out of it. */
function snowballCannon(ctx: CanvasRenderingContext2D, s: number, time: number) {
  const t = (time / 700) % 1;
  disc(ctx, 0.22 * s + t * 0.3 * s, -0.25 * s - t * 0.12 * s, 0.09 * s, colors.snow);
  ctx.save();
  ctx.rotate(-0.4);
  ctx.fillStyle = colors.ink;
  rounded(ctx, -0.3 * s, -0.11 * s, 0.6 * s, 0.22 * s, 0.08 * s);
  ctx.fill();
  ctx.fillStyle = colors.slabShade;
  ctx.fillRect(0.22 * s, -0.12 * s, 0.06 * s, 0.24 * s);
  ctx.restore();
  disc(ctx, -0.05 * s, 0.2 * s, 0.17 * s, colors.wood);
  disc(ctx, -0.05 * s, 0.2 * s, 0.06 * s, colors.gingerbread);
  for (const [x, y] of [
    [0.28, 0.32],
    [0.4, 0.32],
    [0.34, 0.22],
  ] as const) {
    disc(ctx, x * s, y * s, 0.06 * s, colors.snow);
  }
}

/** Look `look` round a picture `s` across centred on the origin, behind (`under`) or over it. */
function lookLayer(ctx: CanvasRenderingContext2D, look: number, s: number, under: boolean) {
  if (look === 0 && under) {
    ctx.fillStyle = colors.shadow;
    ctx.globalAlpha = 0.35;
    ctx.beginPath();
    ctx.ellipse(0.06 * s, 0.45 * s, 0.4 * s, 0.07 * s, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
  } else if (look === 2 && under) {
    ctx.fillStyle = colors.snowLit;
    rounded(ctx, -0.5 * s, -0.5 * s, s, s, 0.2 * s);
    ctx.fill();
    ctx.strokeStyle = colors.slabShade;
    ctx.setLineDash([0.04 * s, 0.03 * s]);
    ctx.lineWidth = 0.02 * s;
    ctx.stroke();
    ctx.setLineDash([]);
  } else if (look === 1 && !under) {
    ctx.strokeStyle = colors.ink;
    ctx.globalAlpha = 0.3;
    ctx.lineWidth = 0.015 * s;
    ctx.beginPath();
    for (let n = -5; n <= 5; n++) {
      ctx.moveTo(n * 0.09 * s, -0.48 * s);
      ctx.lineTo(n * 0.09 * s, 0.48 * s);
      ctx.moveTo(-0.48 * s, n * 0.09 * s);
      ctx.lineTo(0.48 * s, n * 0.09 * s);
    }
    ctx.stroke();
    ctx.globalAlpha = 1;
  }
}

/** Booth `booth`'s picture in look `look`, `s` across, round `x`, `y`; a look of -1 is the plain picture. */
export function boothIcon(
  ctx: CanvasRenderingContext2D,
  booth: number,
  look: number,
  x: number,
  y: number,
  s: number,
  time: number,
) {
  ctx.save();
  ctx.translate(x, y);
  lookLayer(ctx, look, s, true);
  ctx.save();
  if (booth === 1) cocoaVolcano(ctx, s, time);
  else if (booth === 2) snowballCannon(ctx, s, time);
  else penguinDj(ctx, s, time);
  ctx.restore();
  lookLayer(ctx, look, s, false);
  ctx.restore();
}
