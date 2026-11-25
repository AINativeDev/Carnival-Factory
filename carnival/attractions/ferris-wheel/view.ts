/**
 * The view from the top of the ferris wheel: a little North Pole skyline at
 * dusk, its windows and its tree twinkling slowly, seen past the car's rail.
 * It opens out as a round window from the boarded car and closes the same way.
 */
import { backdrop, glow } from '../../../src/northpole/diorama';
import { theme } from '../../../src/northpole/theme';

const { colors } = theme;

/** The rooftops along the skyline: left edge, width, wall height and roof colour. */
const HOUSES: readonly (readonly [x: number, w: number, h: number, roof: string])[] = [
  [2, 14, 12, colors.berry],
  [18, 10, 16, colors.pine],
  [58, 12, 14, colors.violet],
  [72, 14, 10, colors.berry],
  [88, 11, 15, colors.pine],
];

/** Where the street meets the houses' feet. */
const STREET = 74;

/**
 * How bright twinkling light `n` is at `time`: a slow swell over several
 * seconds, so the town glimmers and never blinks (docs/style.md, Motion).
 */
export function twinkle(time: number, n: number): number {
  return 0.55 + 0.45 * Math.sin(time / 1_300 + n * 2.3);
}

function house(ctx: CanvasRenderingContext2D, time: number, index: number) {
  const [x, w, h, roof] = HOUSES[index] ?? [0, 0, 0, colors.berry];
  const top = STREET - h;
  ctx.fillStyle = colors.slab;
  ctx.fillRect(x, top, w, h);
  // The shaded side, on the right, away from the light.
  ctx.fillStyle = colors.slabShade;
  ctx.fillRect(x + w * 0.7, top, w * 0.3, h);
  ctx.fillStyle = roof;
  ctx.beginPath();
  ctx.moveTo(x - 1.5, top);
  ctx.lineTo(x + w / 2, top - w * 0.45);
  ctx.lineTo(x + w + 1.5, top);
  ctx.fill();
  ctx.fillStyle = colors.snow;
  ctx.beginPath();
  ctx.moveTo(x + w * 0.2, top - w * 0.36);
  ctx.lineTo(x + w / 2, top - w * 0.45);
  ctx.lineTo(x + w * 0.8, top - w * 0.36);
  ctx.fill();
  for (let row = 0; row < 2; row++) {
    for (let col = 0; col < 2; col++) {
      const n = index * 4 + row * 2 + col;
      ctx.globalAlpha = twinkle(time, n);
      ctx.fillStyle = colors.lantern;
      ctx.fillRect(x + w * (0.18 + col * 0.38), top + 2.5 + row * (h / 2.4), 2.4, 2.6);
    }
  }
  ctx.globalAlpha = 1;
}

/** The town's great tree in the square between the houses, hung with slowly twinkling lights. */
function tree(ctx: CanvasRenderingContext2D, time: number) {
  glow(ctx, 44, 58, 22, 0.5);
  ctx.fillStyle = colors.pineDark;
  ctx.beginPath();
  ctx.moveTo(44, 34);
  ctx.lineTo(34, STREET - 2);
  ctx.lineTo(54, STREET - 2);
  ctx.fill();
  ctx.fillStyle = colors.pine;
  ctx.beginPath();
  ctx.moveTo(44, 34);
  ctx.lineTo(34, STREET - 2);
  ctx.lineTo(44, STREET - 2);
  ctx.fill();
  ctx.fillStyle = colors.gold;
  ctx.beginPath();
  ctx.arc(44, 33.5, 1.8, 0, Math.PI * 2);
  ctx.fill();
  const bulbs = [colors.berry, colors.gold, colors.mint, colors.violet];
  for (let n = 0; n < 14; n++) {
    const down = 0.15 + (n / 14) * 0.8;
    const across = ((n * 0.37) % 1) - 0.5;
    ctx.globalAlpha = twinkle(time, n + 20);
    ctx.fillStyle = bulbs[n % bulbs.length] ?? colors.gold;
    ctx.beginPath();
    ctx.arc(44 + across * down * 18, 34 + down * (STREET - 36), 0.9, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
}

/** The skyline itself: the dusk, the factory's tower far off, the houses, the tree and the street. */
function skyline(ctx: CanvasRenderingContext2D, time: number) {
  backdrop(ctx);
  // The factory's tower in the distance, its lamp glowing at the top.
  ctx.fillStyle = colors.mountain;
  ctx.fillRect(28, 30, 7, STREET - 30);
  ctx.fillRect(26.5, 28, 10, 3);
  glow(ctx, 31.5, 26, 7, twinkle(time, 40));
  for (let i = 0; i < HOUSES.length; i++) house(ctx, time, i);
  tree(ctx, time);
  ctx.fillStyle = colors.snow;
  ctx.fillRect(0, STREET, 100, 100 - STREET);
  ctx.fillStyle = colors.snowShade;
  ctx.fillRect(0, STREET + 6, 100, 1.2);
}

/**
 * Opens the view out from the car at (x, y), `open` from 0 to 1, as a round
 * window that grows until it fills the square. The car's rail and a bauble's
 * rim frame the bottom, and the whole view sways a little, as a car does.
 */
export function drawView(
  ctx: CanvasRenderingContext2D,
  time: number,
  open: number,
  x: number,
  y: number,
) {
  if (open <= 0) return;
  const radius = open * 105;
  ctx.save();
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  ctx.clip();
  ctx.save();
  ctx.translate(0, Math.sin(time / 1_600) * 0.8);
  skyline(ctx, time);
  ctx.restore();
  // The car: its gold rail across the front and its rounded rim below.
  ctx.fillStyle = colors.berry;
  ctx.beginPath();
  ctx.ellipse(50, 108, 62, 22, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = colors.shadow;
  ctx.globalAlpha = 0.3;
  ctx.fillRect(50, 86, 50, 14);
  ctx.globalAlpha = 1;
  ctx.fillStyle = colors.gold;
  ctx.fillRect(0, 86, 100, 2.4);
  ctx.restore();
  // A thin gold edge round the window while it opens and closes.
  if (open < 1) {
    ctx.strokeStyle = colors.gold;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.stroke();
  }
}
