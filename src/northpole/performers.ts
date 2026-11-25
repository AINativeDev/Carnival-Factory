/**
 * The performers a level may place on the snow: the fire-breather, the
 * juggler and the stilt-walker. Each moves only from `time` and its variant,
 * in slow loops a few seconds long, and none of them flashes: the flame and
 * its glow swell and fade over seconds (docs/style.md, Motion).
 */
import { block, glow, shadow } from './brushes';
import { elf, outfit, phase, swing } from './elf';
import { theme } from './theme';
import { toScreen, type Thing } from './world';

const { colors } = theme;

/** How long a fire-breather's puff takes, from a breath in to the flame dying away. */
const PUFF = 4200;

/**
 * How big the flame is, from 0 to 1, `at` from 0 to 1 through the puff: nothing
 * for the first half while the elf breathes in, then it swells and fades.
 */
export function flameSize(at: number): number {
  if (at < 0.5) return 0;
  return Math.sin(((at - 0.5) / 0.5) * Math.PI);
}

/** An elf on a little crate, puffing a warm orange-gold flame now and then. */
export function drawFireBreather(ctx: CanvasRenderingContext2D, thing: Thing, time: number) {
  const { x, y } = toScreen(thing);
  const crate = { x: thing.x + 0.2, y: thing.y + 0.2, w: 0.6, h: 0.6 };
  const flame = flameSize(phase(time, PUFF, thing.seed));
  glow(ctx, x + 18, y - 48, 30, 0.3 + 0.7 * flame);
  shadow(ctx, x, y + 2, 18);
  block(ctx, crate, 12, colors.gingerbread, colors.wood, colors.cocoa);
  ctx.fillStyle = colors.cocoa;
  ctx.fillRect(x - 9, y - 4, 18, 2);
  const look = outfit(thing.seed);
  const torch = { x: 12, y: -14 + 6 * flame };
  const hands = elf(ctx, x, y - 12, { ...look, left: { x: -4, y: 12 }, right: torch });
  ctx.fillStyle = colors.cocoa;
  ctx.fillRect(hands.right.x - 1, hands.right.y - 8, 2, 10);
  ctx.fillStyle = colors.lantern;
  ctx.beginPath();
  ctx.arc(hands.right.x, hands.right.y - 10, 3, 0, Math.PI * 2);
  ctx.fill();
  if (!flame) return;
  // The flame, from the elf's mouth up and out to the right: lantern, then gold, then the glow at its heart.
  const mouth = { x: x + 6, y: y - 12 - 30 };
  const reach = 30 * flame;
  for (const [color, scale] of [
    [colors.lantern, 1],
    [colors.gold, 0.7],
    [colors.glow, 0.4],
  ] as const) {
    ctx.fillStyle = color;
    ctx.globalAlpha = 0.85;
    ctx.beginPath();
    ctx.ellipse(
      mouth.x + reach * 0.55,
      mouth.y - reach * 0.25,
      reach * 0.6 * scale + 2,
      reach * 0.28 * scale + 1,
      -0.4,
      0,
      Math.PI * 2,
    );
    ctx.fill();
  }
  ctx.globalAlpha = 1;
}

/** How long one ball takes round the juggler's arc. */
const THROW = 2600;
const BALLS = [colors.berry, colors.gold, colors.mint, colors.snow];

/**
 * Where ball `n` of `count` is, from the juggler's hands: up from one hand,
 * over the top and down to the other, then back low across.
 */
export function ballAt(time: number, seed: number, n: number, count: number) {
  const angle = (phase(time, THROW, seed) + n / count) * Math.PI * 2;
  return {
    x: Math.cos(angle) * 12,
    y: Math.sin(angle) < 0 ? Math.sin(angle) * 24 : Math.sin(angle) * 4,
  };
}

/** An elf juggling three balls in an arc, or four when its variant is high. */
export function drawJuggler(ctx: CanvasRenderingContext2D, thing: Thing, time: number) {
  const { x, y } = toScreen(thing);
  shadow(ctx, x, y + 2, 12);
  const count = thing.seed > 0.5 ? 4 : 3;
  const toss = swing(time, THROW / count, thing.seed);
  elf(ctx, x, y, {
    ...outfit(thing.seed),
    left: { x: -6, y: 2 - 4 * toss },
    right: { x: 6, y: -2 + 4 * toss },
  });
  for (const [n, color] of BALLS.slice(0, count).entries()) {
    const ball = ballAt(time, thing.seed, n, count);
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(x + ball.x, y - 30 + ball.y, 3, 0, Math.PI * 2);
    ctx.fill();
  }
}

/** How long a stilt-walker takes along its path and back. */
const STROLL = 9000;

/** An elf on tall striped stilts, striding back and forth along its two tiles. */
export function drawStiltWalker(ctx: CanvasRenderingContext2D, thing: Thing, time: number) {
  const along = swing(time, STROLL, thing.seed);
  const heading = Math.sin(((time + thing.seed * STROLL) / STROLL) * Math.PI * 2);
  const { x, y } = toScreen({ x: thing.x + along, y: thing.y });
  shadow(ctx, x, y + 2, 14);
  const stride = Math.sin(time / 260 + thing.seed * 9);
  const tall = 34;
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(heading < 0 ? -1 : 1, 1);
  for (const side of [-1, 1]) {
    const foot = side * stride * 6;
    for (let n = 0; n < 4; n++) {
      ctx.strokeStyle = n % 2 ? colors.snow : colors.berry;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(side * 3 + (foot * (4 - n)) / 4, -(tall * n) / 4);
      ctx.lineTo(side * 3 + (foot * (3 - n)) / 4, -(tall * (n + 1)) / 4);
      ctx.stroke();
    }
  }
  ctx.lineWidth = 1;
  elf(ctx, 0, -tall, {
    ...outfit(thing.seed),
    left: { x: -8, y: 6 - 3 * stride },
    right: { x: 8, y: 6 + 3 * stride },
  });
  ctx.restore();
}
