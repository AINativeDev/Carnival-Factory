/**
 * The workshop itself, behind everything that moves: the walls and floor, the
 * string of lights, the big sign, the window, the fireplace, the mail slot,
 * the "maybe later" tray and the sacks counter.
 */
import { theme } from '../../../src/northpole/theme';
import { circle, words, type Ctx } from './brushes';
import { wrap } from './motion';
import { sacksFilled } from './sleigh';
import { envelope } from './toys';

const { colors } = theme;

/** Snowflake `index` falling past the window, as 0 to 1 across and down it. */
export function snowflake(index: number, time: number): { x: number; y: number } {
  const fall = 5_000 + (index % 3) * 1_200;
  const y = wrap(time / fall + index * 0.37, 1);
  const x = wrap(index * 0.29 + Math.sin(time / 1_400 + index) * 0.06, 1);
  return { x, y };
}

/** How bright string light `index` is: between 0.55 and 1, slowly. */
export function twinkle(index: number, time: number): number {
  return 0.775 + 0.225 * Math.sin(time / 1_600 + index * 1.7);
}

/** The room at `time`, filling the whole square. */
export function drawRoom(ctx: Ctx, u: number, size: number, time: number) {
  ctx.fillStyle = colors.gingerbread;
  ctx.fillRect(0, 0, size, size);
  ctx.fillStyle = colors.wood;
  ctx.fillRect(0, 80 * u, size, 20 * u);
  ctx.fillStyle = colors.cocoa;
  for (let x = 0; x < 100; x += 12.5) ctx.fillRect(x * u, 80 * u, 0.5 * u, 20 * u);
  ctx.fillRect(0, 0, size, 5 * u);

  // The string of lights along the beam.
  ctx.strokeStyle = colors.pineDark;
  ctx.lineWidth = 0.5 * u;
  ctx.beginPath();
  for (let x = 0; x <= 100; x += 2) {
    const y = 5.5 + Math.abs(Math.sin((x / 100) * Math.PI * 4)) * 2;
    if (x === 0) ctx.moveTo(x * u, y * u);
    else ctx.lineTo(x * u, y * u);
  }
  ctx.stroke();
  const bulbs = [colors.berry, colors.gold, colors.mint, colors.violet, colors.ice];
  for (let i = 0; i < 9; i++) {
    const x = 6 + i * 11;
    ctx.globalAlpha = twinkle(i, time);
    ctx.fillStyle = bulbs[i % bulbs.length] ?? colors.berry;
    circle(ctx, x * u, (6.5 + Math.abs(Math.sin((x / 100) * Math.PI * 4)) * 2 + 1) * u, 1.3 * u);
  }
  ctx.globalAlpha = 1;

  // The big sign.
  ctx.fillStyle = colors.gold;
  ctx.fillRect(19 * u, 10 * u, 62 * u, 11 * u);
  ctx.fillStyle = colors.berry;
  ctx.fillRect(20 * u, 11 * u, 60 * u, 9 * u);
  ctx.fillStyle = colors.snow;
  words(ctx, "Santa's Toy Factory", 50 * u, 15.7 * u, 6.5 * u, 56 * u);

  // The window, with snow falling past it.
  ctx.fillStyle = colors.night;
  ctx.fillRect(46 * u, 23 * u, 14 * u, 17 * u);
  ctx.fillStyle = colors.snow;
  for (let i = 0; i < 9; i++) {
    const flake = snowflake(i, time);
    circle(ctx, (46.6 + flake.x * 12.8) * u, (23 + flake.y * 17) * u, 0.6 * u);
  }
  ctx.fillStyle = colors.snowShade;
  ctx.fillRect(46 * u, 37.5 * u, 14 * u, 2.5 * u);
  ctx.strokeStyle = colors.wood;
  ctx.lineWidth = 1.2 * u;
  ctx.strokeRect(46 * u, 23 * u, 14 * u, 17 * u);
  ctx.beginPath();
  ctx.moveTo(53 * u, 23 * u);
  ctx.lineTo(53 * u, 40 * u);
  ctx.moveTo(46 * u, 31.5 * u);
  ctx.lineTo(60 * u, 31.5 * u);
  ctx.stroke();

  // The fireplace, its flames flickering gently.
  ctx.fillStyle = colors.snowShade;
  ctx.fillRect(26 * u, 41 * u, 14 * u, 24 * u);
  ctx.fillStyle = colors.wood;
  ctx.fillRect(24.5 * u, 38.5 * u, 17 * u, 3 * u);
  ctx.fillStyle = colors.night;
  ctx.fillRect(29 * u, 47 * u, 8 * u, 18 * u);
  for (let i = 0; i < 3; i++) {
    const flicker = 1 + 0.15 * Math.sin(time / (260 + i * 70) + i * 2);
    const fx = 30.8 + i * 2.2;
    const h = (i === 1 ? 9 : 6.5) * flicker;
    for (const [color, scale] of [
      [colors.berry, 1],
      [colors.gold, 0.6],
    ] as const) {
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.moveTo((fx - 1.5 * scale) * u, 64 * u);
      ctx.quadraticCurveTo(
        (fx - 1.5 * scale) * u,
        (64 - h * scale * 0.6) * u,
        fx * u,
        (64 - h * scale) * u,
      );
      ctx.quadraticCurveTo(
        (fx + 1.5 * scale) * u,
        (64 - h * scale * 0.6) * u,
        (fx + 1.5 * scale) * u,
        64 * u,
      );
      ctx.fill();
    }
  }

  // The mail slot, the crate the letters land on and the pile on it.
  ctx.fillStyle = colors.wood;
  ctx.fillRect(2 * u, 19 * u, 12 * u, 8 * u);
  ctx.fillStyle = colors.night;
  ctx.fillRect(3.5 * u, 22.5 * u, 9 * u, 1.6 * u);
  ctx.fillStyle = colors.cocoa;
  ctx.fillRect(1.5 * u, 72 * u, 13 * u, 8 * u);
  envelope(ctx, u, 7, 70.8);
  envelope(ctx, u, 9.5, 69.6);

  // The "maybe later" tray, up on its shelf.
  ctx.fillStyle = colors.wood;
  ctx.fillRect(12.5 * u, 36 * u, 14 * u, 1.4 * u);
  ctx.fillStyle = colors.snowShade;
  ctx.fillRect(13.5 * u, 33 * u, 12 * u, 3 * u);
  ctx.fillStyle = colors.cocoa;
  words(ctx, 'maybe later', 19.5 * u, 39.3 * u, 2.6 * u, 14 * u);

  // The counter, with how many sacks the sleigh has filled.
  ctx.fillStyle = colors.surface;
  ctx.fillRect(80 * u, 23 * u, 17 * u, 10 * u);
  ctx.fillStyle = colors.glow;
  words(ctx, String(sacksFilled(time) % 1000), 88.5 * u, 28.3 * u, 7 * u, 15 * u);
}
