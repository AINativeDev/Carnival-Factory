/**
 * The show's cast and kit, drawn in scene units: the elves, the springboard,
 * the juggled balls and the drum that beats the drum roll. Kept apart from the
 * ring and the tent so attraction.ts stays a list of what stands where.
 */
import { theme } from '../../../src/northpole/theme';
import { DRUMROLL, juggledBall } from './show';

const { colors } = theme;

/** An elf's head and pointed green hat, at `u` times the usual size. */
function elf(ctx: CanvasRenderingContext2D, x: number, y: number, u: number) {
  ctx.fillStyle = colors.glow;
  ctx.beginPath();
  ctx.arc(x, y, 3.5 * u, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = colors.pine;
  ctx.beginPath();
  ctx.moveTo(x - 4 * u, y - 2 * u);
  ctx.lineTo(x + 4 * u, y - 2 * u);
  ctx.lineTo(x + 5 * u, y - 10 * u);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = colors.snow;
  ctx.beginPath();
  ctx.arc(x + 5 * u, y - 10 * u, 1.3 * u, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = colors.night;
  ctx.fillRect(x - 1.8 * u, y - 0.5 * u, 1 * u, 1 * u);
  ctx.fillRect(x + 0.8 * u, y - 0.5 * u, 1 * u, 1 * u);
}

/** An elf standing, its feet at (x, y): a red tunic under its head. */
export function standingElf(ctx: CanvasRenderingContext2D, x: number, y: number) {
  ctx.fillStyle = colors.berry;
  ctx.beginPath();
  ctx.moveTo(x - 3, y);
  ctx.lineTo(x + 3, y);
  ctx.lineTo(x + 1.6, y - 7);
  ctx.lineTo(x - 1.6, y - 7);
  ctx.closePath();
  ctx.fill();
  elf(ctx, x, y - 10, 0.8);
}

/** A juggling elf, its feet at (x, y), with three balls going round. */
export function juggler(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  time: number,
  lift: number,
) {
  standingElf(ctx, x, y);
  const hands = y - 7;
  const balls = [colors.gold, colors.aurora, colors.berry];
  balls.forEach((colour, ball) => {
    const p = juggledBall(ball, x, hands, time, lift);
    ctx.fillStyle = colour;
    ctx.beginPath();
    ctx.arc(p.x, p.y, 1.3, 0, Math.PI * 2);
    ctx.fill();
  });
}

/** The springboard: a plank on a wooden block, its end dipped `dip` from 0 to 1 just after a leap. */
export function springboard(ctx: CanvasRenderingContext2D, x: number, y: number, dip: number) {
  ctx.fillStyle = colors.wood;
  ctx.fillRect(x - 1, y - 3, 4, 3);
  ctx.strokeStyle = colors.gingerbread;
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.moveTo(x - 7, y - 0.5);
  ctx.lineTo(x + 6, y - 4 + dip * 2.5);
  ctx.stroke();
}

/** The acrobat elf in the air, curled and turned `turn` radians round their somersault. */
export function acrobat(ctx: CanvasRenderingContext2D, x: number, y: number, turn: number) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(turn);
  ctx.fillStyle = colors.berry;
  ctx.beginPath();
  ctx.ellipse(0, 3, 2.6, 3.4, 0, 0, Math.PI * 2);
  ctx.fill();
  elf(ctx, 0, -2, 0.7);
  ctx.restore();
}

/**
 * The drum at the ringside, its foot at (x, y), with a gold lamp lit above it
 * for each beat of the drum roll so far. `beat` from 0 to 1 lifts the sticks
 * just after a tap.
 */
export function drumRoll(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  beats: number,
  beat: number,
) {
  ctx.fillStyle = colors.berry;
  ctx.fillRect(x - 5, y - 7, 10, 7);
  ctx.fillStyle = colors.gold;
  ctx.fillRect(x - 5, y - 7, 10, 1);
  ctx.fillRect(x - 5, y - 1, 10, 1);
  ctx.fillStyle = colors.snowLit;
  ctx.beginPath();
  ctx.ellipse(x, y - 7, 5, 1.8, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = colors.wood;
  ctx.lineWidth = 0.8;
  for (const side of [-1, 1]) {
    ctx.beginPath();
    ctx.moveTo(x + side * 1.5, y - 7.5 - beat * 2);
    ctx.lineTo(x + side * 5, y - 12 - beat * 3);
    ctx.stroke();
  }
  for (let n = 0; n < DRUMROLL - 1; n++) {
    ctx.fillStyle = n < beats ? colors.lantern : colors.slabShade;
    ctx.beginPath();
    ctx.arc(x - 4.5 + n * 3, y - 16, 1, 0, Math.PI * 2);
    ctx.fill();
  }
}
