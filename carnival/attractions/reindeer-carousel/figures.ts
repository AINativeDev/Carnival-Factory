/**
 * The carousel's figures: a reindeer on its pole, and the elf a visitor seats
 * on one. Kept apart from the scene so each file stays small.
 */
import { theme } from '../../../src/northpole/theme';

const { colors } = theme;

/** A wooden reindeer with gold antlers and a red nose, facing right (1) or left (-1). */
export function reindeer(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  u: number,
  facing: number,
) {
  ctx.fillStyle = colors.wood;
  ctx.beginPath();
  ctx.ellipse(x, y, 6 * u, 3.5 * u, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillRect(x + facing * 4 * u - 1.2 * u, y - 6 * u, 2.4 * u, 5 * u);
  ctx.beginPath();
  ctx.arc(x + facing * 5 * u, y - 7 * u, 2.4 * u, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillRect(x - 5 * u, y + 2 * u, 1.4 * u, 4 * u);
  ctx.fillRect(x + 3.6 * u, y + 2 * u, 1.4 * u, 4 * u);
  // Antlers and a red nose.
  ctx.strokeStyle = colors.gold;
  ctx.lineWidth = 0.8 * u;
  ctx.beginPath();
  ctx.moveTo(x + facing * 4.5 * u, y - 9 * u);
  ctx.lineTo(x + facing * 3 * u, y - 13 * u);
  ctx.moveTo(x + facing * 5.5 * u, y - 9 * u);
  ctx.lineTo(x + facing * 7 * u, y - 13 * u);
  ctx.stroke();
  ctx.fillStyle = colors.berry;
  ctx.beginPath();
  ctx.arc(x + facing * 7.4 * u, y - 7 * u, 1 * u, 0, Math.PI * 2);
  ctx.fill();
}

/**
 * An elf in green with a red pointed hat, sitting on the reindeer at `x`, `y`,
 * leaning a little into the turn as the ride speeds up (`pace` from 1 to 3).
 */
export function ridingElf(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  u: number,
  facing: number,
  pace: number,
) {
  const lean = (pace - 1) * 0.8 * u * facing;
  const seat = y - 3 * u;
  // A leg down each side of the reindeer.
  ctx.fillStyle = colors.pine;
  ctx.fillRect(x - 1.6 * u, seat, 1.2 * u, 4 * u);
  ctx.fillRect(x + 0.6 * u, seat, 1.2 * u, 4 * u);
  // The body, a little tunic.
  ctx.beginPath();
  ctx.moveTo(x - 2.4 * u, seat + 0.6 * u);
  ctx.lineTo(x + 2.4 * u, seat + 0.6 * u);
  ctx.lineTo(x + 1.4 * u + lean, seat - 4.4 * u);
  ctx.lineTo(x - 1.4 * u + lean, seat - 4.4 * u);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = colors.gold;
  ctx.fillRect(x - 2 * u + lean / 3, seat - 1.4 * u, 4 * u, 0.7 * u);
  // The face, and the hat with its bobble.
  const head = { x: x + lean * 1.3, y: seat - 6.2 * u };
  ctx.fillStyle = colors.cream;
  ctx.beginPath();
  ctx.arc(head.x, head.y, 1.8 * u, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = colors.berry;
  ctx.beginPath();
  ctx.moveTo(head.x - 2 * u, head.y - 0.8 * u);
  ctx.lineTo(head.x + 2 * u, head.y - 0.8 * u);
  ctx.lineTo(head.x - facing * 2.6 * u, head.y - 4.6 * u);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = colors.snow;
  ctx.beginPath();
  ctx.arc(head.x - facing * 2.6 * u, head.y - 4.6 * u, 0.7 * u, 0, Math.PI * 2);
  ctx.fill();
}
