/**
 * The people and the party in the Year in Review (ADR 0047): the gallery's
 * guard elf, hands behind its back, and a visitor elf listening to an audio
 * guide; and for seeing the year out, a bunch of balloons, confetti on the
 * floor and a mirrorball overhead whose sparkles drift slowly round the room.
 * Nothing flashes: the sparkles fade in and out over seconds.
 */
import { glow, shadow } from './brushes';
import { elf, swing } from './elf';
import { inTurn } from './rounds';
import { theme } from './theme';
import { toScreen, type Thing } from './world';

const { colors } = theme;

/** The guard, standing still in a night-blue coat, or a visitor swaying a little with an audio guide. */
export function drawGalleryElf(ctx: CanvasRenderingContext2D, thing: Thing, time: number) {
  const { x, y } = toScreen(thing);
  shadow(ctx, x, y + 1, 10);
  if (thing.seed < 0.5) {
    elf(ctx, x, y, {
      coat: colors.surface,
      hat: colors.night,
      left: { x: 4, y: 12 },
      right: { x: -4, y: 12 },
    });
    ctx.fillStyle = colors.gold;
    ctx.fillRect(x - 3, y - 22, 3, 3);
    return;
  }
  const sway = (swing(time, 4000, thing.seed) - 0.5) * 2;
  const { right } = elf(ctx, x + sway, y, {
    coat: colors.violet,
    hat: colors.berry,
    left: { x: -2, y: 14 },
    right: { x: 0, y: -8 },
  });
  // The audio guide held to its ear.
  ctx.fillStyle = colors.ink;
  ctx.fillRect(right.x - 2, right.y - 6, 4, 9);
}

/** A bunch of three balloons on strings, bobbing slowly. */
export function drawBalloons(ctx: CanvasRenderingContext2D, thing: Thing, time: number) {
  const { x, y } = toScreen(thing);
  shadow(ctx, x, y + 1, 8);
  for (const [n, color] of [colors.berry, colors.gold, colors.mint].entries()) {
    const lift = 54 + n * 8 + swing(time, 3600, thing.seed + n / 3) * 4;
    const at = { x: x + (n - 1) * 9, y: y - lift };
    ctx.strokeStyle = colors.snowShade;
    ctx.beginPath();
    ctx.moveTo(x, y - 2);
    ctx.lineTo(at.x, at.y + 9);
    ctx.stroke();
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.ellipse(at.x, at.y, 7, 9, 0, 0, Math.PI * 2);
    ctx.fill();
  }
}

/** Confetti lying on the floor: small flecks of colour, the same every time. */
export function drawConfetti(ctx: CanvasRenderingContext2D, thing: Thing) {
  const { x, y } = toScreen(thing);
  const flecks = [colors.berry, colors.gold, colors.mint, colors.violet, colors.ice] as const;
  for (let n = 0; n < 14; n++) {
    ctx.fillStyle = inTurn(flecks, n);
    const dx = (((n * 37 + thing.seed * 100) % 40) - 20) * 0.9;
    const dy = (((n * 23 + thing.seed * 50) % 20) - 10) * 0.7;
    ctx.fillRect(x + dx, y + dy, 3, 2);
  }
}

/** How long a mirrorball's sparkles take to go round the room, in milliseconds. */
const ROUND = 20_000;

/** A mirrorball hanging high overhead, turning, its sparkles drifting softly round it. */
export function drawMirrorball(ctx: CanvasRenderingContext2D, thing: Thing, time: number) {
  const { x, y } = toScreen(thing);
  const ball = { x, y: y - 110 };
  ctx.strokeStyle = colors.ink;
  ctx.beginPath();
  ctx.moveTo(ball.x, ball.y - 40);
  ctx.lineTo(ball.x, ball.y - 10);
  ctx.stroke();
  glow(ctx, ball.x, ball.y, 22, 0.6);
  ctx.fillStyle = colors.snowShade;
  ctx.beginPath();
  ctx.arc(ball.x, ball.y, 10, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = colors.snow;
  for (let n = 0; n < 8; n++) {
    const a = (time / ROUND + n / 8) * Math.PI * 2;
    ctx.globalAlpha = 0.35 + 0.3 * Math.sin(time / 1800 + n);
    ctx.fillRect(ball.x + Math.cos(a) * 60, y - 20 + Math.sin(a) * 26, 3, 3);
  }
  ctx.globalAlpha = 1;
}
