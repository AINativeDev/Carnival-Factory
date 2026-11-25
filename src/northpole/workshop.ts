/**
 * The factory dressing a level may place: a conveyor belt with parcels on it,
 * a giant turning cog, a candy-striped pipe that lets off steam, and a paper
 * lantern floating overhead. Like the performers and rides, each moves only
 * from `time` and its variant, slowly, and nothing flashes.
 */
import { block, glow, middle, shadow } from './brushes';
import { phase, swing } from './elf';
import { theme } from './theme';
import { toScreen, type Thing } from './world';

const { colors } = theme;

/** How long a parcel takes from one end of the belt to the other. */
const BELT = 6000;
const PARCELS = [colors.berry, colors.gold, colors.berry];

/** A belt on legs, three tiles long, with parcels sliding along it. */
export function drawConveyor(ctx: CanvasRenderingContext2D, thing: Thing, time: number) {
  const { x, y } = middle(thing);
  shadow(ctx, x, y + 4, 40);
  ctx.fillStyle = colors.night;
  for (let n = 0; n < thing.h; n++) {
    const leg = toScreen({ x: thing.x, y: thing.y + n });
    ctx.fillRect(leg.x - 8, leg.y - 14, 3, 14);
    ctx.fillRect(leg.x + 6, leg.y - 14, 3, 14);
  }
  const belt = { x: thing.x + 0.2, y: thing.y, w: 0.6, h: thing.h };
  block(ctx, belt, 5, colors.ink, colors.surface, colors.night, 14);
  for (const [n, color] of PARCELS.entries()) {
    const along = phase(time, BELT, thing.seed + n / PARCELS.length) * (thing.h - 0.4);
    const parcel = { x: thing.x + 0.3, y: thing.y + along, w: 0.4, h: 0.4 };
    block(ctx, parcel, 10, colors.snow, color, colors.cocoa, 19);
  }
}

/** How long the cog takes to go round once. */
const TURN = 16000;
const TEETH = 10;

/** A giant gold cog on a post, turning slowly. */
export function drawCog(ctx: CanvasRenderingContext2D, thing: Thing, time: number) {
  const { x, y } = toScreen(thing);
  shadow(ctx, x, y + 2, 16);
  ctx.fillStyle = colors.night;
  ctx.fillRect(x - 2, y - 30, 4, 30);
  const hub = { x, y: y - 38 };
  const turn = phase(time, TURN, thing.seed) * Math.PI * 2;
  ctx.fillStyle = colors.gold;
  ctx.beginPath();
  for (let n = 0; n < TEETH * 4; n++) {
    const a = turn + (n / (TEETH * 4)) * Math.PI * 2;
    const r = n % 4 < 2 ? 18 : 14;
    ctx.lineTo(hub.x + Math.cos(a) * r, hub.y + Math.sin(a) * r);
  }
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = colors.gingerbread;
  ctx.beginPath();
  ctx.arc(hub.x, hub.y, 8, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = colors.night;
  ctx.beginPath();
  ctx.arc(hub.x, hub.y, 3, 0, Math.PI * 2);
  ctx.fill();
}

/** How long between the pipe's puffs of steam. */
const PUFF = 5000;

/** A candy-striped pipe arching over its two tiles, letting off a puff of steam now and then. */
export function drawCandyPipe(ctx: CanvasRenderingContext2D, thing: Thing, time: number) {
  const a = toScreen(thing);
  const b = toScreen({ x: thing.x + thing.w - 1, y: thing.y });
  shadow(ctx, (a.x + b.x) / 2, (a.y + b.y) / 2 + 2, 30);
  // Up from one tile, 40 pixels over the top, and down into the other.
  const point = (t: number) => ({
    x: a.x + (b.x - a.x) * t,
    y: a.y + (b.y - a.y) * t - Math.sin(t * Math.PI) * 40,
  });
  const pieces = 12;
  ctx.lineWidth = 7;
  for (let n = 0; n < pieces; n++) {
    const from = point(n / pieces);
    const to = point((n + 1) / pieces);
    ctx.strokeStyle = n % 2 ? colors.snow : colors.berry;
    ctx.beginPath();
    ctx.moveTo(from.x, from.y);
    ctx.lineTo(to.x, to.y);
    ctx.stroke();
  }
  ctx.lineWidth = 1;
  const vent = point(0.5);
  ctx.fillStyle = colors.gold;
  ctx.fillRect(vent.x - 4, vent.y - 8, 8, 5);
  // The puff rises and thins out over the second half of each wait.
  const at = phase(time, PUFF, thing.seed);
  if (at < 0.5) return;
  const rise = (at - 0.5) * 2;
  ctx.fillStyle = colors.snow;
  ctx.globalAlpha = 0.7 * (1 - rise);
  for (let n = 0; n < 3; n++) {
    ctx.beginPath();
    ctx.arc(
      vent.x + (n - 1) * 4 * rise,
      vent.y - 10 - rise * 24 - n * 4,
      4 + rise * 6,
      0,
      Math.PI * 2,
    );
    ctx.fill();
  }
  ctx.globalAlpha = 1;
}

/** How long the lantern takes to bob up and down again. */
const BOB = 4600;

/** A paper lantern floating over the path with a warm glow, high enough to walk under. */
export function drawLantern(ctx: CanvasRenderingContext2D, thing: Thing, time: number) {
  const { x, y } = toScreen(thing);
  const lift = 52 + 8 * swing(time, BOB, thing.seed);
  ctx.fillStyle = colors.night;
  ctx.globalAlpha = 0.12;
  ctx.beginPath();
  ctx.ellipse(x, y, 8, 3.5, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = 1;
  glow(ctx, x, y - lift, 24, 0.8);
  ctx.fillStyle = thing.seed > 0.5 ? colors.berry : colors.lantern;
  ctx.beginPath();
  ctx.ellipse(x, y - lift, 8, 10, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = colors.glow;
  ctx.globalAlpha = 0.6;
  ctx.beginPath();
  ctx.ellipse(x - 2, y - lift - 1, 4, 7, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = 1;
  ctx.fillStyle = colors.cocoa;
  ctx.fillRect(x - 5, y - lift - 12, 10, 2);
  ctx.fillRect(x - 5, y - lift + 10, 10, 2);
}
