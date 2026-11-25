/**
 * The penguins on the workshop floor: where each one stands, shuffles, blinks
 * and hops, which one is under the pointer, and drawing them.
 */
import { theme } from '../../../src/northpole/theme';
import { circle, type Ctx } from './brushes';
import { wrap } from './motion';

const { colors } = theme;

/** The penguins on the workshop floor: where each stands, in hundredths of the square. */
export const PENGUINS: readonly { x: number }[] = [{ x: 19 }, { x: 35 }, { x: 51 }, { x: 66 }];
/** Every penguin's feet are on this line. */
export const PENGUIN_FEET = 95;
/** How long a penguin's hop lasts, in milliseconds. */
export const HOP = 650;

/** How far penguin `index` has shuffled from its spot at `time`, at most 1.5 either way. */
export function shuffleOf(index: number, time: number): number {
  return Math.sin(time / 2_300 + index * 1.9) * 1.5;
}

/** Whether penguin `index` has its eyes shut at `time`: a short blink every few seconds. */
export function blinking(index: number, time: number): boolean {
  return wrap(time + index * 1_300, 3_800 + index * 700) < 160;
}

/** How high a penguin is off the floor `since` milliseconds after it was tapped. */
export function hopHeight(since: number): number {
  return since >= 0 && since < HOP ? Math.sin((since / HOP) * Math.PI) * 6 : 0;
}

/**
 * Which penguin is at `x`, `y` (in hundredths of the square) at `time`, or -1 for none.
 * `lifts` is how high each penguin is off the floor, so a hopping one is found where it is.
 */
export function penguinAt(
  x: number,
  y: number,
  time: number,
  lifts: readonly number[] = [],
): number {
  return PENGUINS.findIndex((penguin, index) => {
    const feet = PENGUIN_FEET - (lifts[index] ?? 0);
    return (
      Math.abs(x - (penguin.x + shuffleOf(index, time))) <= 4.5 && y >= feet - 16 && y <= feet + 1.5
    );
  });
}

/** A flipper hanging from a shoulder at `x`, `y`, turned `angle` from straight down. */
function flipper(ctx: Ctx, u: number, x: number, y: number, angle: number) {
  ctx.save();
  ctx.translate(x * u, y * u);
  ctx.rotate(angle);
  ctx.beginPath();
  ctx.ellipse(0, 2.3 * u, 1.1 * u, 2.8 * u, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

/**
 * Penguin `index`, standing at `spot`, shuffling and blinking, waving while
 * `waving` and `lift` off the floor.
 */
export function drawPenguin(
  ctx: Ctx,
  u: number,
  spot: { x: number },
  index: number,
  time: number,
  waving: boolean,
  lift: number,
) {
  const x = spot.x + shuffleOf(index, time);
  const feet = PENGUIN_FEET;
  // Its shadow stays on the floor and shrinks while it hops.
  ctx.globalAlpha = 0.35;
  ctx.fillStyle = colors.cocoa;
  ctx.beginPath();
  ctx.ellipse(x * u, (feet + 0.6) * u, (4 - lift * 0.3) * u, 1.1 * u, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = 1;

  ctx.save();
  // A little waddle while it shuffles, rocking on its feet.
  const pace = Math.abs(Math.cos(time / 2_300 + index * 1.9));
  ctx.translate(x * u, (feet - lift) * u);
  ctx.rotate(Math.sin(time / 180 + index) * 0.07 * pace);

  ctx.fillStyle = colors.gold;
  for (const side of [-1, 1]) {
    ctx.beginPath();
    ctx.ellipse(side * 1.6 * u, 0, 1.5 * u, 0.6 * u, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.fillStyle = colors.night;
  ctx.beginPath();
  ctx.ellipse(0, -6 * u, 4 * u, 6 * u, 0, 0, Math.PI * 2);
  ctx.fill();
  flipper(ctx, u, -3.4, -9, 0.3);
  const wave = waving ? -2.4 + Math.sin(time / 110) * 0.45 : -0.3;
  flipper(ctx, u, 3.4, -9, wave);
  ctx.fillStyle = colors.snow;
  ctx.beginPath();
  ctx.ellipse(0, -5.2 * u, 2.7 * u, 4.6 * u, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = colors.night;
  circle(ctx, 0, -12.5 * u, 3.2 * u);

  // Its eyes, shut for a moment now and then.
  ctx.fillStyle = colors.snow;
  for (const side of [-1, 1]) {
    if (blinking(index, time)) {
      ctx.fillRect((side * 1.2 - 0.8) * u, -13 * u, 1.6 * u, 0.4 * u);
    } else {
      circle(ctx, side * 1.2 * u, -13 * u, 0.85 * u);
    }
  }
  if (!blinking(index, time)) {
    ctx.fillStyle = colors.night;
    for (const side of [-1, 1]) circle(ctx, side * 1.2 * u, -12.8 * u, 0.42 * u);
  }
  ctx.fillStyle = colors.gold;
  ctx.beginPath();
  ctx.moveTo(-1 * u, -11.8 * u);
  ctx.lineTo(1 * u, -11.8 * u);
  ctx.lineTo(0, -10.3 * u);
  ctx.fill();
  ctx.restore();
}
