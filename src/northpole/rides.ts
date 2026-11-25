/**
 * The rides a level may place: a small ferris wheel and a tethered hot-air
 * balloon (the carousel is in `carousel.ts`). Bigger than the performers, on
 * 3 by 3 and 2 by 2 footprints, and slower: the wheel takes most of a minute
 * to go round, and its lights only shimmer (docs/style.md, Motion).
 */
import { block, bulb, glow, middle, quad, shadow, twinkle } from './brushes';
import { phase, swing } from './elf';
import { theme } from './theme';
import type { Thing } from './world';

const { colors } = theme;

const WHEEL = { radius: 58, turn: 40000 };
const CARS = [colors.berry, colors.gold, colors.pine, colors.violet];
const SPOKES = 2 * CARS.length;

/** A small ferris wheel turning slowly on its frame, its cars hanging level and lit. */
export function drawFerrisWheel(ctx: CanvasRenderingContext2D, thing: Thing, time: number) {
  const { x, y } = middle(thing);
  const base = { x: thing.x + 0.6, y: thing.y + 0.6, w: thing.w - 1.2, h: thing.h - 1.2 };
  shadow(ctx, x, y + 6, 46);
  block(ctx, base, 6, colors.snowShade, colors.surface, colors.night);
  const hub = { x, y: y - 6 - WHEEL.radius - 18 };
  const turn = phase(time, WHEEL.turn, thing.seed) * Math.PI * 2;
  ctx.strokeStyle = colors.surface;
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(x - 30, y - 4);
  ctx.lineTo(hub.x, hub.y);
  ctx.lineTo(x + 30, y - 4);
  ctx.stroke();
  ctx.strokeStyle = colors.snow;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(hub.x, hub.y, WHEEL.radius, 0, Math.PI * 2);
  ctx.stroke();
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  for (let n = 0; n < SPOKES; n++) {
    const a = turn + (n / SPOKES) * Math.PI * 2;
    ctx.moveTo(hub.x, hub.y);
    ctx.lineTo(hub.x + Math.cos(a) * WHEEL.radius, hub.y + Math.sin(a) * WHEEL.radius);
  }
  ctx.stroke();
  ctx.lineWidth = 1;
  // Two of each car round the wheel, starting from a colour picked by the variant.
  const first = Math.floor(thing.seed * CARS.length);
  const ring = [...CARS.slice(first), ...CARS.slice(0, first)];
  const cars = [...ring, ...ring];
  for (const [n, color] of cars.entries()) {
    const a = turn + (n / cars.length) * Math.PI * 2;
    const cx = hub.x + Math.cos(a) * WHEEL.radius;
    const cy = hub.y + Math.sin(a) * WHEEL.radius;
    ctx.fillStyle = colors.cocoa;
    ctx.fillRect(cx - 1, cy, 2, 4);
    ctx.fillStyle = color;
    quad(ctx, [
      { x: cx - 7, y: cy + 4 },
      { x: cx + 7, y: cy + 4 },
      { x: cx + 5, y: cy + 13 },
      { x: cx - 5, y: cy + 13 },
    ]);
    ctx.fill();
    ctx.fillStyle = colors.glow;
    ctx.fillRect(cx - 4, cy + 6, 8, 3);
    bulb(
      ctx,
      hub.x + Math.cos(a + 0.4) * WHEEL.radius,
      hub.y + Math.sin(a + 0.4) * WHEEL.radius,
      colors.lantern,
      twinkle(time, n + thing.seed * 10),
    );
  }
  ctx.fillStyle = colors.gold;
  ctx.beginPath();
  ctx.arc(hub.x, hub.y, 5, 0, Math.PI * 2);
  ctx.fill();
}

/** How long the balloon takes to bob up and settle again on its tethers. */
const BOB = 5200;
const GORES = 6;

/** A tethered hot-air balloon bobbing above its basket, its burner glowing. */
export function drawBalloon(ctx: CanvasRenderingContext2D, thing: Thing, time: number) {
  const { x, y } = middle(thing);
  const rise = 22 + 10 * swing(time, BOB, thing.seed);
  shadow(ctx, x, y + 4, 30 - rise / 4);
  const basket = { x, y: y - rise };
  // The tethers to two stakes in the snow, slack as the balloon settles.
  ctx.strokeStyle = colors.cocoa;
  ctx.beginPath();
  for (const side of [-1, 1]) {
    ctx.moveTo(basket.x + side * 8, basket.y);
    ctx.quadraticCurveTo(x + side * 20, y - rise / 3, x + side * 30, y + 4);
  }
  ctx.stroke();
  ctx.fillStyle = colors.wood;
  ctx.fillRect(basket.x - 9, basket.y - 10, 18, 10);
  ctx.fillStyle = colors.cocoa;
  ctx.fillRect(basket.x - 9, basket.y - 6, 18, 2);
  ctx.fillRect(basket.x - 10, basket.y - 11, 20, 2);
  ctx.strokeStyle = colors.night;
  ctx.beginPath();
  ctx.moveTo(basket.x - 8, basket.y - 11);
  ctx.lineTo(basket.x - 16, basket.y - 28);
  ctx.moveTo(basket.x + 8, basket.y - 11);
  ctx.lineTo(basket.x + 16, basket.y - 28);
  ctx.stroke();
  glow(ctx, basket.x, basket.y - 22, 14, 0.6 + 0.3 * swing(time, BOB / 2, thing.seed));
  const envelope = { x: basket.x, y: basket.y - 62, rx: 30, ry: 36 };
  ctx.save();
  ctx.beginPath();
  ctx.ellipse(envelope.x, envelope.y, envelope.rx, envelope.ry, 0, 0, Math.PI * 2);
  ctx.moveTo(basket.x - 16, basket.y - 28);
  ctx.lineTo(envelope.x - 22, envelope.y + 22);
  ctx.lineTo(envelope.x + 22, envelope.y + 22);
  ctx.lineTo(basket.x + 16, basket.y - 28);
  ctx.clip();
  const stripe = thing.seed > 0.5 ? colors.violet : colors.berry;
  const width = (envelope.rx * 2) / GORES;
  for (let n = 0; n < GORES; n++) {
    ctx.fillStyle = n % 2 ? colors.snow : stripe;
    ctx.fillRect(
      envelope.x - envelope.rx + n * width,
      envelope.y - envelope.ry,
      width,
      2 * envelope.ry + 30,
    );
  }
  // Lit on the left, in shade on the right, as everything at dusk.
  ctx.fillStyle = colors.night;
  ctx.globalAlpha = 0.22;
  ctx.fillRect(
    envelope.x + envelope.rx * 0.3,
    envelope.y - envelope.ry,
    envelope.rx,
    2 * envelope.ry + 30,
  );
  ctx.fillStyle = colors.glow;
  ctx.globalAlpha = 0.18;
  ctx.fillRect(
    envelope.x - envelope.rx,
    envelope.y - envelope.ry,
    envelope.rx * 0.5,
    2 * envelope.ry,
  );
  ctx.globalAlpha = 1;
  ctx.restore();
  ctx.fillStyle = colors.gold;
  ctx.fillRect(envelope.x - 22, envelope.y + 20, 44, 3);
}
