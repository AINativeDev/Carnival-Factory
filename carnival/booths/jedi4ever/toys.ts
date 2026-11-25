/** The letters and the toys the elves make of them, drawn wherever they are in the room. */
import { theme } from '../../../src/northpole/theme';
import { circle, type Ctx } from './brushes';
import type { Toy } from './letters';

const { colors } = theme;

/** A letter in its envelope, centred on `x`, `y`. */
export function envelope(ctx: Ctx, u: number, x: number, y: number) {
  ctx.fillStyle = colors.snow;
  ctx.fillRect((x - 3.5) * u, (y - 2.3) * u, 7 * u, 4.6 * u);
  ctx.strokeStyle = colors.muted;
  ctx.lineWidth = 0.6 * u;
  ctx.beginPath();
  ctx.moveTo((x - 3.5) * u, (y - 2.3) * u);
  ctx.lineTo(x * u, (y + 0.3) * u);
  ctx.lineTo((x + 3.5) * u, (y - 2.3) * u);
  ctx.stroke();
}

/** A train, a teddy or a rocket at `x`, `y`: bare wood until it's `painted`. */
export function toy(ctx: Ctx, u: number, kind: Toy, x: number, y: number, painted: boolean) {
  const paint = (color: string) => {
    ctx.fillStyle = painted ? color : colors.wood;
  };
  if (kind === 'train') {
    paint(colors.berry);
    ctx.fillRect((x - 4) * u, (y - 2) * u, 6 * u, 3.5 * u);
    paint(colors.pine);
    ctx.fillRect((x + 1) * u, (y - 4.5) * u, 3 * u, 6 * u);
    paint(colors.gold);
    ctx.fillRect((x - 3) * u, (y - 4) * u, 1.6 * u, 2 * u);
    ctx.fillStyle = colors.night;
    circle(ctx, (x - 2.5) * u, (y + 1.8) * u, 1.2 * u);
    circle(ctx, (x + 2.5) * u, (y + 1.8) * u, 1.2 * u);
  } else if (kind === 'teddy') {
    paint(colors.gingerbread);
    circle(ctx, (x - 2) * u, (y - 4.6) * u, 1.1 * u);
    circle(ctx, (x + 2) * u, (y - 4.6) * u, 1.1 * u);
    circle(ctx, x * u, (y - 3.3) * u, 2.2 * u);
    circle(ctx, x * u, (y + 0.6) * u, 2.6 * u);
    paint(colors.glow);
    circle(ctx, x * u, (y + 0.9) * u, 1.3 * u);
    paint(colors.berry);
    circle(ctx, x * u, (y - 1.2) * u, 0.8 * u);
  } else {
    paint(colors.berry);
    ctx.beginPath();
    ctx.moveTo((x - 3) * u, (y + 3) * u);
    ctx.lineTo((x + 3) * u, (y + 3) * u);
    ctx.lineTo(x * u, (y - 1) * u);
    ctx.fill();
    paint(colors.ice);
    ctx.fillRect((x - 1.6) * u, (y - 3) * u, 3.2 * u, 5.5 * u);
    paint(colors.berry);
    ctx.beginPath();
    ctx.moveTo((x - 1.6) * u, (y - 3) * u);
    ctx.lineTo((x + 1.6) * u, (y - 3) * u);
    ctx.lineTo(x * u, (y - 6) * u);
    ctx.fill();
    paint(colors.gold);
    circle(ctx, x * u, (y - 1) * u, 0.8 * u);
  }
}
