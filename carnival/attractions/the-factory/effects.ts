/**
 * What answers the visitor on the slab: a sparkle where each tap lands, points
 * floating up from a station that got its skill, a puff of smoke and JAM! where
 * the belt jams, and each shipped booth flying from merge into the sleigh at
 * the slab's left corner, where the round's booths pile up.
 */
import { iso, shadow } from '../../../src/northpole/diorama';
import { theme } from '../../../src/northpole/theme';
import type { Game } from './game';
import { POP_LIFE, type Pop, STATIONS } from './rules';
import { gift, sparks, words } from './text';
import { onLoop } from './track';

const { colors } = theme;

/** How long a shipped booth takes to fly from merge into the sleigh, in ms. */
export const GIFT_FLIGHT = 900;

/** Where the sleigh stands, at the slab's left corner beside merge. */
export const SLEIGH = iso(-13, 19);

/** Where a booth that left merge `t` of its flight ago is: up and over into the sleigh. */
export function giftFlight(t: number) {
  const from = onLoop(STATIONS[3], 0, 2);
  return {
    x: from.x + (SLEIGH.x - from.x) * t,
    y: from.y + (SLEIGH.y - 3 - from.y) * t - Math.sin(t * Math.PI) * 16,
  };
}

/** The sleigh: a berry body on gold runners, the round's booths piled in it. */
export function sleigh(ctx: CanvasRenderingContext2D, shipped: number) {
  const { x, y } = SLEIGH;
  shadow(ctx, x, y + 1, 14);
  ctx.strokeStyle = colors.gold;
  ctx.lineWidth = 0.7;
  ctx.beginPath();
  ctx.moveTo(x - 6, y);
  ctx.lineTo(x + 5, y);
  ctx.quadraticCurveTo(x + 7.5, y, x + 7, y - 2.2);
  ctx.stroke();
  for (let n = 0; n < Math.min(shipped, 5); n++) {
    gift(ctx, x - 3 + (n % 3) * 2.8, y - 3.2 - Math.floor(n / 3) * 2.4, 2.4);
  }
  ctx.fillStyle = colors.berry;
  ctx.beginPath();
  ctx.moveTo(x - 6, y - 1);
  ctx.lineTo(x + 3.5, y - 1);
  ctx.quadraticCurveTo(x + 6, y - 1.5, x + 5.5, y - 6);
  ctx.lineTo(x + 3.8, y - 4);
  ctx.lineTo(x - 5, y - 4);
  ctx.quadraticCurveTo(x - 7, y - 6, x - 6, y - 1);
  ctx.fill();
  ctx.fillStyle = colors.gold;
  ctx.fillRect(x - 5, y - 3.2, 8.5, 0.5);
  if (shipped > 0) words(ctx, `${String(shipped)} shipped`, x, y + 3.8, 3, colors.ink);
}

/** The booths still in flight from merge to the sleigh. */
export function flyingGifts(ctx: CanvasRenderingContext2D, game: Game, time: number) {
  for (const at of game.gifts) {
    const t = (time - at) / GIFT_FLIGHT;
    if (t < 0 || t >= 1) continue;
    const p = giftFlight(t);
    gift(ctx, p.x, p.y, 3.2, t * 4);
  }
}

/** One pop, `t` of the way through its life. */
function pop(ctx: CanvasRenderingContext2D, p: Pop, t: number) {
  // Words rise over the bubble, but a jam's smoke and shout stay down at the belt.
  const station = onLoop(STATIONS.at(p.leg ?? 0) ?? 0, 0, (p.kind === 'jam' ? 6 : 27) + t * 6);
  ctx.globalAlpha = 1 - t * t;
  if (p.kind === 'tap') {
    sparks(ctx, p.x ?? 0, p.y ?? 0, t * 2, 8, 4, [colors.glow, colors.snowLit]);
  } else if (p.kind === 'right') {
    sparks(ctx, station.x, station.y + 10, t, 10, 9, [colors.mint, colors.glow]);
    ctx.globalAlpha = 1 - t * t;
    if (p.points) words(ctx, `+${String(p.points)}`, station.x, station.y, 4, colors.mint);
  } else if (p.kind === 'ship') {
    // A shipped booth cheers over the sleigh it lands in.
    const over = { x: SLEIGH.x + 4, y: SLEIGH.y - 9 - t * 3 };
    sparks(ctx, SLEIGH.x, SLEIGH.y - 4, t, 14, 11, [colors.gold, colors.berry, colors.glow]);
    ctx.globalAlpha = 1 - t * t;
    const text = p.points ? `+${String(p.points)} BOOTH!` : 'BOOTH!';
    words(ctx, text, over.x, over.y, 3.6, colors.gold);
  } else {
    ctx.fillStyle = colors.cloud;
    for (let n = 0; n < 4; n++) {
      ctx.globalAlpha = 0.6 * (1 - t);
      ctx.beginPath();
      ctx.arc(station.x - 4 + n * 2.6, station.y + 8 - t * 6 - (n % 2) * 2, 2 + t * 3, 0, 7);
      ctx.fill();
    }
    ctx.globalAlpha = 1 - t * t;
    const wobble = Math.sin(t * 30) * (1 - t) * 0.8;
    words(ctx, 'JAM!', station.x + wobble, station.y, 5, colors.berry);
  }
  ctx.globalAlpha = 1;
}

/** Every pop still showing at `time`. */
export function pops(ctx: CanvasRenderingContext2D, game: Game, time: number) {
  for (const p of game.pops) {
    const t = (time - p.at) / POP_LIFE;
    if (t >= 0 && t < 1) pop(ctx, p, t);
  }
}
