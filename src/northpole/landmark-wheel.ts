/**
 * The Ferris Wheel stands as a big wheel on an A-frame, turning once every
 * fifty seconds with its cars hanging level and its rim strung with lights:
 * the tallest ride on the midway, so it reads from across the map. Its
 * square's drawing hangs on a sign at the spot's front (ADR 0042).
 */
import { bulb, corners, middle, twinkle } from './brushes';
import { signPost, stage, type LandmarkDrawer } from './landmark-parts';
import { fillShape } from './landmark-kit';
import { inTurn } from './rounds';
import { standing } from './stall-plan';
import { theme } from './theme';
import type { Tile } from './world';

const { colors } = theme;

/** The wheel's size in world pixels: its hub above the stage, its radius, and how long one turn takes. */
const WHEEL = { hub: 196, radius: 88, turn: 50_000 };

/** The cars' colours round the wheel. */
const CARS = [colors.berry, colors.pine, colors.gold, colors.violet, colors.mint] as const;
const CAR_COUNT = 10;

/** A leg of the A-frame from its foot on the stage to the hub, on a little concrete pad. */
function leg(ctx: CanvasRenderingContext2D, foot: Tile, hub: Tile, color: string) {
  ctx.strokeStyle = color;
  ctx.lineWidth = 6;
  ctx.beginPath();
  ctx.moveTo(foot.x, foot.y);
  ctx.lineTo(hub.x, hub.y);
  ctx.stroke();
  ctx.lineWidth = 1;
  ctx.fillStyle = colors.slabShade;
  ctx.fillRect(foot.x - 7, foot.y - 3, 14, 6);
}

/** The rim: two rings joined by braces, and the spokes from the hub, all turning by `turn`. */
function rim(ctx: CanvasRenderingContext2D, hub: Tile, turn: number) {
  ctx.strokeStyle = colors.slabShade;
  ctx.lineWidth = 2;
  ctx.beginPath();
  for (let n = 0; n < 20; n++) {
    const a = turn + (n / 20) * Math.PI * 2;
    const along = (r: number) => ({ x: hub.x + Math.cos(a) * r, y: hub.y + Math.sin(a) * r });
    const inner = along(WHEEL.radius * 0.86);
    const outer = along(WHEEL.radius);
    if (n % 2 === 0) ctx.moveTo(hub.x, hub.y);
    else ctx.moveTo(inner.x, inner.y);
    ctx.lineTo(outer.x, outer.y);
  }
  ctx.stroke();
  for (const [r, color] of [
    [WHEEL.radius, colors.surface],
    [WHEEL.radius * 0.86, colors.mountain],
  ] as const) {
    ctx.strokeStyle = color;
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(hub.x, hub.y, r, 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.lineWidth = 1;
}

/** One car hanging level from its pin on the rim: a hanger, a cabin in its colour with a lit window, a roof. */
function car(ctx: CanvasRenderingContext2D, pin: Tile, color: string) {
  ctx.fillStyle = colors.cocoa;
  ctx.fillRect(pin.x - 1, pin.y, 2, 6);
  fillShape(
    ctx,
    [
      { x: pin.x - 9, y: pin.y + 6 },
      { x: pin.x + 9, y: pin.y + 6 },
      { x: pin.x + 7, y: pin.y + 20 },
      { x: pin.x - 7, y: pin.y + 20 },
    ],
    color,
  );
  ctx.fillStyle = colors.glow;
  ctx.fillRect(pin.x - 6, pin.y + 9, 12, 5);
  ctx.fillStyle = colors.snow;
  ctx.fillRect(pin.x - 10, pin.y + 4, 20, 3);
}

export const drawBigWheel: LandmarkDrawer = (ctx, spot, square, paint, time) => {
  const ground = stage(ctx, spot, 70);
  const { x } = middle(spot);
  const hub = { x, y: ground.y - 10 - WHEEL.hub };
  const turn = ((time / WHEEL.turn) % 1) * Math.PI * 2;
  // The A-frame's back legs in shade behind the wheel, its front legs lit in front of it.
  for (const side of [-1, 1]) leg(ctx, { x: x + side * 54, y: ground.y - 22 }, hub, colors.night);
  rim(ctx, hub, turn);
  for (let n = 0; n < 24; n++) {
    const a = turn + ((n + 0.5) / 24) * Math.PI * 2;
    const at = { x: hub.x + Math.cos(a) * WHEEL.radius, y: hub.y + Math.sin(a) * WHEEL.radius };
    bulb(ctx, at.x, at.y, colors.lantern, twinkle(time, n * 3.1));
  }
  for (let n = 0; n < CAR_COUNT; n++) {
    const a = turn + (n / CAR_COUNT) * Math.PI * 2;
    const pin = { x: hub.x + Math.cos(a) * WHEEL.radius, y: hub.y + Math.sin(a) * WHEEL.radius };
    car(ctx, pin, inTurn(CARS, n));
  }
  for (const side of [-1, 1]) leg(ctx, { x: x + side * 66, y: ground.y }, hub, colors.surface);
  ctx.fillStyle = colors.gold;
  ctx.beginPath();
  ctx.arc(hub.x, hub.y, 8, 0, Math.PI * 2);
  ctx.fill();
  signPost(ctx, spot, square, paint, { from: 0.12, to: 0.82, low: 16, outward: 0.15 });
  return standing(spot, corners(spot).top.y - (hub.y - WHEEL.radius) + 14);
};
