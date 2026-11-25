/**
 * Drawing the strolling elf, on the snow and stretched in the mirrors, and the
 * treats visitors stick on the house. All in the scene's 0 to 100 units.
 */
import { glow, iso, shadow, type Point } from '../../../src/northpole/diorama';
import { theme } from '../../../src/northpole/theme';
import { popScale, type Decoration } from './decorating';
import { GUMDROPS } from './house';
import { PATH, reflection, strollAt, type MIRRORS } from './mirrors';

const { colors } = theme;

/** A little elf about 9 units tall with its feet at (x, y), `wide` and `tall` times its size. */
function elf(
  ctx: CanvasRenderingContext2D,
  at: Point,
  stride: number,
  facing: number,
  stretch = { wide: 1, tall: 1 },
) {
  ctx.save();
  ctx.translate(at.x, at.y);
  ctx.scale(stretch.wide * facing, stretch.tall);
  ctx.fillStyle = colors.night;
  ctx.fillRect(-1.6 + stride * 0.6, -2.4, 1.2, 2.4);
  ctx.fillRect(0.4 - stride * 0.6, -2.4, 1.2, 2.4);
  ctx.fillStyle = colors.pine;
  ctx.beginPath();
  ctx.moveTo(-2.4, -2.2);
  ctx.lineTo(2.4, -2.2);
  ctx.lineTo(1.3, -6.2);
  ctx.lineTo(-1.3, -6.2);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = colors.gold;
  ctx.fillRect(-2, -3.6, 4, 0.6);
  ctx.fillStyle = colors.glow;
  ctx.beginPath();
  ctx.arc(0, -7.4, 1.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = colors.berry;
  ctx.beginPath();
  ctx.moveTo(-1.6, -8.2);
  ctx.lineTo(1.6, -8.2);
  ctx.lineTo(2.8, -11);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = colors.snowLit;
  ctx.fillRect(-1.8, -8.8, 3.6, 0.8);
  ctx.restore();
}

/** The elf strolling along the snow in front of the house at `time`. */
export function strollingElf(ctx: CanvasRenderingContext2D, time: number) {
  const { gx, facing, stride } = strollAt(time);
  const feet = iso(gx, PATH.along);
  shadow(ctx, feet.x + 1, feet.y, 8);
  elf(ctx, feet, stride, facing);
}

/** The elf's reflection in `mirror`, whose window is at `at`, `r` wide, stretched as that mirror bends it. */
export function mirrored(
  ctx: CanvasRenderingContext2D,
  time: number,
  at: Point,
  r: number,
  mirror: (typeof MIRRORS)[number],
) {
  const { gx, facing, stride } = strollAt(time);
  const seen = reflection(mirror, gx, time);
  if (seen.shown <= 0) return;
  ctx.globalAlpha = seen.shown * 0.85;
  elf(ctx, { x: at.x + seen.across, y: at.y + r * 1.1 }, stride, -facing, seen);
  ctx.globalAlpha = 1;
}

/** One treat stuck on the house, popping on as it's placed. */
export function treat(ctx: CanvasRenderingContext2D, placed: Decoration, time: number) {
  const s = popScale(placed.at, time);
  if (s <= 0) return;
  const color = GUMDROPS[placed.tint % GUMDROPS.length] ?? colors.berry;
  ctx.save();
  ctx.translate(placed.x, placed.y);
  ctx.scale(s, s);
  glow(ctx, 0, 0, 3.5, 0.35);
  if (placed.treat === 'gumdrop') {
    // A sugared dome, lit on its upper left.
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(0, 0.8, 2, Math.PI, 0);
    ctx.lineTo(2, 1.2);
    ctx.lineTo(-2, 1.2);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = colors.snowLit;
    ctx.fillRect(-1.1, -0.6, 0.7, 0.7);
  } else if (placed.treat === 'swirl') {
    // Piped icing, curling in on itself, with a coloured sprinkle on top.
    ctx.strokeStyle = colors.snowLit;
    ctx.lineWidth = 0.9;
    ctx.lineCap = 'round';
    ctx.beginPath();
    for (let a = 0; a <= Math.PI * 4; a += 0.4) {
      const d = 2.2 - a * 0.16;
      ctx.lineTo(Math.cos(a) * d, Math.sin(a) * d * 0.7);
    }
    ctx.stroke();
    ctx.fillStyle = color;
    ctx.fillRect(-0.4, -0.4, 0.8, 0.8);
  } else {
    // A wrapped boiled sweet: a round middle with its twists either side.
    ctx.fillStyle = color;
    for (const side of [-1, 1]) {
      ctx.beginPath();
      ctx.moveTo(side * 1.4, 0);
      ctx.lineTo(side * 2.8, -1.2);
      ctx.lineTo(side * 2.8, 1.2);
      ctx.closePath();
      ctx.fill();
    }
    ctx.beginPath();
    ctx.arc(0, 0, 1.6, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = colors.snowLit;
    ctx.lineWidth = 0.5;
    ctx.beginPath();
    ctx.arc(0, 0, 1, Math.PI * 1.1, Math.PI * 1.6);
    ctx.stroke();
  }
  ctx.restore();
}
