/**
 * The midway's big rides: the ferris wheel turning over the town with its lit
 * gondolas, and the domed tents in candy-cane stripes.
 */
import { block, bulb, glow, middle, quad, shadow, twinkle } from './brushes';
import { inTurn } from './rounds';
import { theme } from './theme';
import type { Thing, Tile } from './world';

const { colors } = theme;

/** The big ferris wheel: a turning wheel of lit gondolas on an A-frame, rising over the town. */
export function drawWheel(ctx: CanvasRenderingContext2D, thing: Thing, time: number) {
  const { x, y } = middle(thing);
  shadow(ctx, x, y + 6, 70);
  block(ctx, thing, 8, colors.snowShade, colors.surface, colors.night);
  const radius = 108;
  const hub = { x, y: y - 8 - radius - 34 };
  const depth = { x: 14, y: -7 };
  const turn = time / 9000;
  const spokes = 12;
  const rim = (offset: Tile, color: string, width: number) => {
    ctx.strokeStyle = color;
    ctx.lineWidth = width;
    ctx.beginPath();
    ctx.arc(hub.x + offset.x, hub.y + offset.y, radius, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    for (let n = 0; n < spokes; n++) {
      const a = turn + (n / spokes) * Math.PI * 2;
      ctx.moveTo(hub.x + offset.x, hub.y + offset.y);
      ctx.lineTo(hub.x + offset.x + Math.cos(a) * radius, hub.y + offset.y + Math.sin(a) * radius);
    }
    ctx.lineWidth = width / 2;
    ctx.stroke();
  };
  // The far legs and rim, then the axle across, then the near ones.
  const legs = (offset: Tile, color: string) => {
    ctx.strokeStyle = color;
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.moveTo(hub.x + offset.x - 52, y + offset.y);
    ctx.lineTo(hub.x + offset.x, hub.y + offset.y);
    ctx.lineTo(hub.x + offset.x + 52, y + offset.y);
    ctx.stroke();
  };
  legs(depth, colors.night);
  rim(depth, colors.mountain, 4);
  ctx.strokeStyle = colors.gold;
  ctx.lineWidth = 6;
  ctx.beginPath();
  ctx.moveTo(hub.x, hub.y);
  ctx.lineTo(hub.x + depth.x, hub.y + depth.y);
  ctx.stroke();
  rim({ x: 0, y: 0 }, colors.snow, 5);
  legs({ x: 0, y: 0 }, colors.surface);
  ctx.lineWidth = 1;
  gondolas(ctx, { hub, depth, radius, turn, spokes }, time);
  ctx.fillStyle = colors.gold;
  ctx.beginPath();
  ctx.arc(hub.x, hub.y, 9, 0, Math.PI * 2);
  ctx.fill();
}

/** The ferris wheel's shape: its hub, how far its far rim stands back, its radius, how far it has turned and its spokes. */
interface Wheel {
  hub: Tile;
  depth: Tile;
  radius: number;
  turn: number;
  spokes: number;
}

/** The gondolas hang level as the wheel turns, and lights twinkle round the rim. */
function gondolas(ctx: CanvasRenderingContext2D, wheel: Wheel, time: number) {
  const { hub, depth, radius, turn, spokes } = wheel;
  const cars = [colors.berry, colors.gold, colors.pine, colors.violet] as const;
  for (let n = 0; n < spokes; n++) {
    const a = turn + (n / spokes) * Math.PI * 2;
    const gx = hub.x + depth.x / 2 + Math.cos(a) * radius;
    const gy = hub.y + depth.y / 2 + Math.sin(a) * radius;
    ctx.fillStyle = colors.cocoa;
    ctx.fillRect(gx - 1, gy, 2, 8);
    ctx.fillStyle = inTurn(cars, n);
    ctx.beginPath();
    ctx.moveTo(gx - 11, gy + 8);
    ctx.lineTo(gx + 11, gy + 8);
    ctx.lineTo(gx + 8, gy + 22);
    ctx.lineTo(gx - 8, gy + 22);
    ctx.fill();
    ctx.fillStyle = colors.snow;
    ctx.fillRect(gx - 12, gy + 6, 24, 3);
    bulb(
      ctx,
      hub.x + Math.cos(a + 0.26) * radius,
      hub.y + Math.sin(a + 0.26) * radius,
      colors.lantern,
      twinkle(time, n),
    );
  }
}

/** A domed tent in candy-cane stripes, its doorway dark and a pennant on top. */
export function drawTent(ctx: CanvasRenderingContext2D, thing: Thing, time: number) {
  const { x, y } = middle(thing);
  const rx = 52;
  const ry = 26;
  const wall = 26;
  const dome = 58;
  shadow(ctx, x, y + 6, 58);
  ctx.save();
  ctx.beginPath();
  ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI);
  ctx.lineTo(x - rx, y - wall);
  ctx.ellipse(x, y - wall, rx, dome, 0, Math.PI, Math.PI * 2);
  ctx.closePath();
  ctx.clip();
  ctx.fillStyle = colors.snow;
  ctx.fillRect(x - rx, y - wall - dome, 2 * rx, wall + dome + ry);
  ctx.fillStyle = thing.seed > 0.5 ? colors.berry : colors.violet;
  for (let n = -6; n < 6; n++) {
    ctx.beginPath();
    ctx.moveTo(x + n * 18, y + ry);
    ctx.lineTo(x + n * 18 + 9, y + ry);
    ctx.lineTo(x + n * 18 + 9 + 60, y - wall - dome);
    ctx.lineTo(x + n * 18 + 60, y - wall - dome);
    ctx.fill();
  }
  // The dome's shaded side, and its lit one.
  ctx.fillStyle = colors.night;
  ctx.globalAlpha = 0.2;
  ctx.fillRect(x + rx * 0.25, y - wall - dome, rx, wall + dome + ry);
  ctx.fillStyle = colors.glow;
  ctx.globalAlpha = 0.15;
  ctx.fillRect(x - rx, y - wall - dome, rx * 0.5, wall + dome + ry);
  ctx.globalAlpha = 1;
  ctx.restore();
  // The doorway, with warm light inside.
  ctx.fillStyle = colors.ink;
  ctx.beginPath();
  ctx.moveTo(x - 12, y + ry);
  ctx.lineTo(x - 12, y + ry - 18);
  ctx.quadraticCurveTo(x, y + ry - 40, x + 12, y + ry - 18);
  ctx.lineTo(x + 12, y + ry);
  ctx.fill();
  glow(ctx, x, y + ry - 10, 22, 0.8);
  ctx.fillStyle = colors.gold;
  ctx.fillRect(x - rx, y - wall - 2, 2 * rx, 3);
  const top = y - wall - dome;
  ctx.fillStyle = colors.cocoa;
  ctx.fillRect(x - 1, top - 18, 2, 18);
  ctx.fillStyle = colors.gold;
  quad(ctx, [
    { x: x + 1, y: top - 18 },
    { x: x + 15, y: top - 14 + Math.sin(time / 380 + thing.seed * 9) * 2 },
    { x: x + 1, y: top - 10 },
  ]);
  ctx.fill();
}
