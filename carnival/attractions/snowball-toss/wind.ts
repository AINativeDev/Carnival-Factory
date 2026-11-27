/**
 * Which way the wind blows, and how hard: a sign at the top right with an
 * arrow as long as the wind is strong, and snowflakes drifting across the
 * booth with it. Throws bend the way the arrow points.
 */
import { theme } from '../../../src/northpole/theme';
import { letter, panel } from './lettering';

const { colors } = theme;

/** How many snowflakes drift across the booth. */
const FLAKES = 12;

/** What the sign calls a wind of `wind`, from -1 to 1. */
export function windWord(wind: number): string {
  const strength = Math.abs(wind);
  if (strength < 0.15) return 'Calm';
  return strength < 0.55 ? 'Breeze' : 'Strong';
}

/** The wind sign: the word for it and an arrow as long as it's strong, pointing the way it blows. */
export function windSign(ctx: CanvasRenderingContext2D, wind: number) {
  panel(ctx, 70, 3, 27, 13);
  letter(ctx, `WIND · ${windWord(wind)}`, {
    ...{ x: 83.5, y: 6.8, height: 2.6, colour: colors.muted, width: 24 },
  });
  const length = Math.max(1.5, Math.abs(wind) * 10);
  const way = Math.sign(wind) || 1;
  const tip = 83.5 + (way * length) / 2;
  const tail = 83.5 - (way * length) / 2;
  ctx.strokeStyle = colors.mint;
  ctx.fillStyle = colors.mint;
  ctx.lineWidth = 1.2;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(tail, 11.6);
  ctx.lineTo(tip, 11.6);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(tip + way * 1.8, 11.6);
  ctx.lineTo(tip - way * 0.6, 9.6);
  ctx.lineTo(tip - way * 0.6, 13.6);
  ctx.closePath();
  ctx.fill();
}

/** Snowflakes falling and drifting the way the wind blows, as fast as it blows. */
export function flakes(ctx: CanvasRenderingContext2D, wind: number, time: number) {
  ctx.fillStyle = colors.snowLit;
  ctx.globalAlpha = 0.75;
  const seconds = time / 1_000;
  for (let k = 0; k < FLAKES; k++) {
    const fall = (k * 53 + seconds * (7 + (k % 3) * 2)) % 100;
    const drift = (((k * 37 + seconds * wind * 16 + Math.sin(seconds + k) * 2) % 100) + 100) % 100;
    ctx.beginPath();
    ctx.arc(drift, fall, 0.45 + (k % 3) * 0.15, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
}
