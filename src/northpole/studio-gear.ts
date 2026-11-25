/**
 * A studio's gear on the floor of an indoor level (ADR 0040): a spotlight on
 * its stand, its lamp glowing warm, and a cable lying across the floor that
 * people step over. The spotlight's glow breathes slowly, and never flashes.
 */
import { glow, shadow } from './brushes';
import { theme } from './theme';
import { toScreen, type Thing } from './world';

const { colors } = theme;

/** A spotlight on a three-legged stand, its lamp tilted towards the room, glowing. */
export function drawSpotlight(ctx: CanvasRenderingContext2D, thing: Thing, time: number) {
  const { x, y } = toScreen(thing);
  shadow(ctx, x, y + 2, 14);
  ctx.strokeStyle = colors.ink;
  ctx.lineWidth = 2;
  ctx.beginPath();
  for (const dx of [-10, 0, 10]) {
    ctx.moveTo(x + dx, y + (dx === 0 ? 4 : 0));
    ctx.lineTo(x, y - 20);
  }
  ctx.lineTo(x, y - 58);
  ctx.stroke();
  ctx.lineWidth = 1;
  // The lamp points down and out, the way it lights the set.
  const lamp = { x: x + (thing.seed > 0.5 ? 6 : -6), y: y - 62 };
  const breath = 0.85 + 0.15 * Math.sin(time / 1100 + thing.seed * 20);
  glow(ctx, lamp.x, lamp.y + 6, 30, breath);
  ctx.fillStyle = colors.ink;
  ctx.fillRect(lamp.x - 8, lamp.y - 7, 16, 12);
  ctx.fillStyle = colors.glow;
  ctx.globalAlpha = breath;
  ctx.fillRect(lamp.x - 6, lamp.y + 3, 12, 3);
  ctx.globalAlpha = 1;
  ctx.fillStyle = colors.slabShade;
  ctx.fillRect(lamp.x - 9, lamp.y - 9, 18, 3);
}

/** A cable lying in loose curves across its tile, from one side to the other. */
export function drawCable(ctx: CanvasRenderingContext2D, thing: Thing) {
  const { x, y } = toScreen(thing);
  const bend = (thing.seed - 0.5) * 16;
  ctx.strokeStyle = colors.ink;
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(x - 24, y - 4);
  ctx.bezierCurveTo(x - 8, y + 10 + bend, x + 4, y - 12 - bend, x + 24, y + 6);
  ctx.stroke();
  ctx.lineWidth = 1;
}
