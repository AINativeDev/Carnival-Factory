/**
 * Drawing the ferris wheel itself, in the square's 0 to 100 units: its wooden
 * A-frame, the rims and spokes, the bauble cars in red, gold, mint and violet
 * with their riders peeking out, and the glowing marker at the gate that says
 * when to send the next elf.
 */
import { glow, stringLights } from '../../../src/northpole/diorama';
import { theme } from '../../../src/northpole/theme';
import { elfHead } from './elves';
import type { Riders } from './game';
import { CARS, FULL, GATE, HUB, baubleOf, carSpots, type Spot } from './ride';

const { colors } = theme;

/** The baubles' colours, round the rim. */
const BAUBLES = [colors.berry, colors.gold, colors.mint, colors.violet];
/** How big a bauble car is. */
const BAUBLE = 4.6;
/** Where the A-frame's feet stand. */
const FOOT = 76;

/** The A-frame's two legs, offset by (dx, dy). */
function legs(ctx: CanvasRenderingContext2D, dx: number, dy: number, color: string) {
  ctx.strokeStyle = color;
  ctx.lineWidth = 2.4;
  ctx.beginPath();
  ctx.moveTo(HUB.x + dx - 19, FOOT + dy);
  ctx.lineTo(HUB.x + dx, HUB.y + dy);
  ctx.lineTo(HUB.x + dx + 19, FOOT + dy);
  ctx.stroke();
  // A cross brace, as a wooden frame has.
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.moveTo(HUB.x + dx - 12, FOOT + dy - 13);
  ctx.lineTo(HUB.x + dx + 12, FOOT + dy - 13);
  ctx.stroke();
}

/** A rim and its spokes to each hook, offset by (dx, dy). */
function rim(ctx: CanvasRenderingContext2D, hooks: readonly Spot[], dx: number, dy: number) {
  const near = dx === 0;
  ctx.strokeStyle = near ? colors.snowShade : colors.mountain;
  ctx.lineWidth = 0.7;
  ctx.beginPath();
  for (const { x, y } of hooks) {
    ctx.moveTo(HUB.x + dx, HUB.y + dy);
    ctx.lineTo(x + dx, y + dy);
  }
  ctx.stroke();
  ctx.strokeStyle = near ? colors.gold : colors.mountain;
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.arc(HUB.x + dx, HUB.y + dy, HUB.radius, 0, FULL);
  ctx.stroke();
}

/**
 * The glowing ring at the gate, where a car's middle must be when the elf is
 * sent: gold while an empty car is in reach, berry while a full one is, and dim
 * between cars. Its dashes creep slowly round, and its middle dot is perfect.
 */
function gateRing(ctx: CanvasRenderingContext2D, ready: number, full: boolean, time: number) {
  const tint = full ? colors.berry : colors.gold;
  if (ready > 0 && !full) glow(ctx, GATE.x, GATE.y, 10, ready);
  ctx.globalAlpha = 0.5 + ready * 0.5;
  ctx.strokeStyle = ready > 0 ? tint : colors.snowLit;
  ctx.lineWidth = 0.6 + ready * 0.6;
  ctx.setLineDash([1.6, 1.1]);
  ctx.lineDashOffset = -time / 250;
  ctx.beginPath();
  ctx.arc(GATE.x, GATE.y, 6.4, 0, FULL);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.fillStyle = ready > 0 ? tint : colors.snowLit;
  ctx.beginPath();
  ctx.arc(GATE.x, GATE.y + 8.2, 0.9, 0, FULL);
  ctx.moveTo(GATE.x - 1.4, GATE.y - 8.6);
  ctx.lineTo(GATE.x + 1.4, GATE.y - 8.6);
  ctx.lineTo(GATE.x, GATE.y - 7);
  ctx.fill();
  ctx.globalAlpha = 1;
}

/** One bauble car hanging from its hook, open at the top, with its riders' heads over its rim. */
function car(ctx: CanvasRenderingContext2D, hook: Spot, n: number, riders: Riders, time: number) {
  const g = { x: hook.x + HUB.depth.x / 2, y: hook.y + HUB.depth.y / 2 };
  const b = baubleOf(hook);
  const lip = b.y - 1.6;
  const half = Math.sqrt(BAUBLE ** 2 - 1.6 ** 2);
  ctx.strokeStyle = colors.snowShade;
  ctx.lineWidth = 0.5;
  ctx.beginPath();
  ctx.moveTo(b.x - half, lip);
  ctx.lineTo(g.x, g.y);
  ctx.lineTo(b.x + half, lip);
  ctx.stroke();
  ctx.fillStyle = colors.shadow;
  ctx.beginPath();
  ctx.ellipse(b.x, lip, half, 1.1, 0, 0, FULL);
  ctx.fill();
  if (riders !== 'empty') elfHead(ctx, b.x, lip, riders === 'guests', time + n * 400);
  ctx.fillStyle = BAUBLES.at(n % BAUBLES.length) ?? colors.berry;
  ctx.beginPath();
  ctx.arc(b.x, b.y, BAUBLE, -0.356, Math.PI + 0.356);
  ctx.closePath();
  ctx.fill();
  // Shaded on the right, a highlight where the light falls on the upper left, and a gold band.
  ctx.fillStyle = colors.shadow;
  ctx.globalAlpha = 0.3;
  ctx.beginPath();
  ctx.arc(b.x, b.y, BAUBLE, -0.356, Math.PI / 2);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = colors.snowLit;
  ctx.globalAlpha = 0.6;
  ctx.beginPath();
  ctx.arc(b.x - 2, b.y + 0.2, 0.9, 0, FULL);
  ctx.fill();
  ctx.globalAlpha = 1;
  ctx.fillStyle = colors.gold;
  ctx.fillRect(b.x - BAUBLE + 0.4, b.y + 1.4, BAUBLE * 2 - 0.8, 0.9);
  ctx.fillRect(b.x - half, lip - 0.3, half * 2, 0.6);
}

/** What the wheel shows besides its angle: who's in each car, and how ready the gate is. */
export interface WheelLook {
  cars: readonly Riders[];
  /** The car hidden while its elf is still hopping in, or -1. */
  hopping: number;
  /** From 0 to 1, how near the gate's reach a car is, and whether that car is full. */
  ready: number;
  full: boolean;
  /** From 0 to 1, the warm light of a full wheel's victory lap. */
  cheer: number;
}

/** The wheel at `angle`: far frame, rims, lights, marker, cars and the near frame. */
export function drawWheel(
  ctx: CanvasRenderingContext2D,
  angle: number,
  time: number,
  look: WheelLook,
) {
  const hooks = carSpots(angle);
  const { depth } = HUB;
  legs(ctx, depth.x, depth.y, colors.night);
  rim(ctx, hooks, depth.x, depth.y);
  ctx.strokeStyle = colors.gold;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(HUB.x, HUB.y);
  ctx.lineTo(HUB.x + depth.x, HUB.y + depth.y);
  ctx.stroke();
  if (look.cheer > 0) glow(ctx, HUB.x, HUB.y, HUB.radius + 6, look.cheer * 0.6);
  rim(ctx, hooks, 0, 0);
  const between = Array.from({ length: CARS * 2 }, (_, n) => {
    const a = angle + ((n + 0.5) / (CARS * 2)) * FULL;
    return { x: HUB.x + Math.cos(a) * HUB.radius, y: HUB.y + Math.sin(a) * HUB.radius };
  });
  stringLights(ctx, between, look.cheer > 0 ? [colors.gold] : [colors.lantern], time);
  legs(ctx, 0, 0, colors.wood);
  hooks.forEach((hook, n) => {
    const riders = n === look.hopping ? 'empty' : (look.cars.at(n) ?? 'empty');
    car(ctx, hook, n, riders, time);
  });
  gateRing(ctx, look.ready, look.full, time);
  ctx.fillStyle = colors.berry;
  ctx.beginPath();
  ctx.arc(HUB.x, HUB.y, 2.4, 0, FULL);
  ctx.fill();
}
