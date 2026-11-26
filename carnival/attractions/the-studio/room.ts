/**
 * The studio itself, seen from the front at dusk: a padded wall with a window
 * onto the snowy hills, the lit sign over the stage, the warm spotlight on
 * the host, the speakers either side and the desk with its faders and meter.
 */
import { glow } from '../../../src/northpole/diorama';
import { theme } from '../../../src/northpole/theme';
import { letter, rounded } from './lettering';

const { colors } = theme;

/** The wall, its foam pads and the window onto the dusk. */
export function wall(ctx: CanvasRenderingContext2D, time: number) {
  const paint = ctx.createLinearGradient(0, 0, 0, 72);
  paint.addColorStop(0, colors.night);
  paint.addColorStop(0.55, colors.surface);
  paint.addColorStop(1, colors.dusk);
  ctx.fillStyle = paint;
  ctx.fillRect(0, 0, 100, 72);
  // Foam pads in a grid, each lit along its top and left like the world.
  for (let x = 2; x < 98; x += 8) {
    for (let y = 18; y < 68; y += 8) {
      ctx.fillStyle = colors.shadow;
      ctx.globalAlpha = 0.55;
      rounded(ctx, x, y, 7, 7, 1.2);
      ctx.fill();
      ctx.fillStyle = colors.mountain;
      ctx.globalAlpha = 0.25;
      ctx.fillRect(x + 1, y + 0.6, 5, 0.7);
    }
  }
  ctx.globalAlpha = 1;
  outlook(ctx, time);
}

/** The window high on the left: the dusk sky, the far hills and the northern lights drifting. */
function outlook(ctx: CanvasRenderingContext2D, time: number) {
  const [x, y, w, h] = [5, 3, 26, 13];
  ctx.fillStyle = colors.wood;
  rounded(ctx, x - 1, y - 1, w + 2, h + 2, 1.2);
  ctx.fill();
  const sky = ctx.createLinearGradient(0, y, 0, y + h);
  sky.addColorStop(0, colors.dusk);
  sky.addColorStop(0.6, colors.duskLow);
  sky.addColorStop(1, colors.horizon);
  ctx.fillStyle = sky;
  ctx.fillRect(x, y, w, h);
  ctx.save();
  ctx.beginPath();
  ctx.rect(x, y, w, h);
  ctx.clip();
  ctx.strokeStyle = colors.aurora;
  ctx.lineWidth = 1.6;
  ctx.globalAlpha = 0.45;
  ctx.beginPath();
  for (let i = 0; i <= 26; i++) ctx.lineTo(x + i, y + 4 + Math.sin(i / 4 + time / 1_400) * 1.6);
  ctx.stroke();
  ctx.globalAlpha = 1;
  ctx.fillStyle = colors.mountain;
  ctx.beginPath();
  ctx.moveTo(x, y + h);
  for (const [px, py] of [
    [4, 8],
    [9, 10.5],
    [15, 6.5],
    [21, 10],
    [26, 8.5],
  ] as const)
    ctx.lineTo(x + px, y + py);
  ctx.lineTo(x + w, y + h);
  ctx.fill();
  ctx.fillStyle = colors.snow;
  ctx.fillRect(x, y + h - 2, w, 2);
  ctx.restore();
  // The cross of the window frame.
  ctx.fillStyle = colors.wood;
  ctx.fillRect(x + w / 2 - 0.5, y, 1, h);
}

/** A lit sign over the stage, `lit` from 0 (off) to 1 (on). */
export function sign(
  ctx: CanvasRenderingContext2D,
  text: string,
  at: { x: number; w: number; colour: string },
  lit: number,
) {
  const { x, w, colour } = at;
  const [y, h] = [4, 10];
  if (lit > 0) glow(ctx, x + w / 2, y + h / 2, w * 0.75, lit);
  ctx.fillStyle = colors.ink;
  rounded(ctx, x - 0.8, y - 0.8, w + 1.6, h + 1.6, 2);
  ctx.fill();
  ctx.fillStyle = colour;
  ctx.globalAlpha = 0.25 + lit * 0.75;
  rounded(ctx, x, y, w, h, 1.5);
  ctx.fill();
  ctx.globalAlpha = 0.35 + lit * 0.65;
  letter(ctx, text, {
    x: x + w / 2,
    y: y + h / 2 + 0.3,
    height: 6.4,
    colour: colors.snowLit,
    width: w - 3,
  });
  ctx.globalAlpha = 1;
}

/** The warm spotlight falling on the host from above. */
export function spotlight(ctx: CanvasRenderingContext2D) {
  const beam = ctx.createLinearGradient(0, 16, 0, 70);
  beam.addColorStop(0, colors.lantern);
  beam.addColorStop(1, colors.glow);
  ctx.fillStyle = beam;
  ctx.globalAlpha = 0.12;
  ctx.beginPath();
  ctx.moveTo(19, 16);
  ctx.lineTo(31, 16);
  ctx.lineTo(44, 70);
  ctx.lineTo(6, 70);
  ctx.fill();
  ctx.globalAlpha = 1;
  glow(ctx, 26, 50, 20, 0.9);
}

/** A speaker cabinet centred on `x`, its cone thumping out by `beat` from 0 to 1. */
export function speaker(ctx: CanvasRenderingContext2D, x: number, beat: number) {
  ctx.fillStyle = colors.ink;
  rounded(ctx, x - 6, 42, 12, 24, 1.5);
  ctx.fill();
  ctx.fillStyle = colors.shadow;
  ctx.fillRect(x - 6, 42, 1.2, 24);
  for (const [y, r] of [
    [48, 2.6],
    [58.5, 4.2],
  ] as const) {
    const swell = r * (1 + beat * 0.12);
    ctx.fillStyle = colors.night;
    ctx.beginPath();
    ctx.arc(x, y, swell, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = colors.mountain;
    ctx.beginPath();
    ctx.arc(x, y, swell * 0.35, 0, Math.PI * 2);
    ctx.fill();
  }
}

/** The desk across the front, with faders and a level meter on its right. */
export function desk(ctx: CanvasRenderingContext2D, level: number, time: number) {
  ctx.fillStyle = colors.gingerbread;
  ctx.fillRect(8, 66, 84, 3);
  ctx.fillStyle = colors.wood;
  ctx.fillRect(8, 69, 84, 9);
  ctx.fillStyle = colors.cocoa;
  ctx.fillRect(8, 77, 84, 1.2);
  // The faders, drifting gently as if someone rides the levels.
  ctx.fillStyle = colors.ink;
  rounded(ctx, 54, 61, 22, 5, 1);
  ctx.fill();
  for (let n = 0; n < 6; n++) {
    const x = 56.5 + n * 3.5;
    ctx.fillStyle = colors.night;
    ctx.fillRect(x, 62, 0.6, 3);
    ctx.fillStyle = n === 2 ? colors.berry : colors.snowShade;
    ctx.fillRect(x - 0.7, 62.4 + (Math.sin(time / 1_300 + n) + 1) * 0.9, 2, 0.9);
  }
  // The level meter: lit bars up to how loud it is now.
  ctx.fillStyle = colors.ink;
  rounded(ctx, 78, 60, 14, 6, 1);
  ctx.fill();
  for (let n = 0; n < 6; n++) {
    const on = n / 6 < level;
    ctx.fillStyle = n < 3 ? colors.mint : n < 5 ? colors.gold : colors.berry;
    ctx.globalAlpha = on ? 1 : 0.18;
    ctx.fillRect(79.5 + n * 2, 61.2, 1.4, 3.6);
  }
  ctx.globalAlpha = 1;
}
