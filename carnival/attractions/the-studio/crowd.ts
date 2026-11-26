/**
 * The cosy crowd of elves watching from the front, dark against the stage: swaying
 * while the episode records, nodding along to the playback and hopping when
 * cheered on; and the sound rippling out of the speakers to them.
 */
import { theme } from '../../../src/northpole/theme';

const { colors } = theme;

/** Each elf in the front row: where, how tall, and its hat. */
const ELVES = [
  { x: 6, lift: 2, hat: colors.berry },
  { x: 21, lift: 0, hat: colors.pine },
  { x: 37, lift: 3, hat: colors.violet },
  { x: 53, lift: 1, hat: colors.berry },
  { x: 69, lift: 3.5, hat: colors.pine },
] as const;

/** The front row: `nod` how hard they nod along, `hop` how high they jump. */
export function crowd(ctx: CanvasRenderingContext2D, time: number, nod: number, hop: number) {
  // The floor in front of the desk, in the warm spill of the stage.
  ctx.fillStyle = colors.shadow;
  ctx.fillRect(0, 78, 100, 22);
  ELVES.forEach((elf, n) => {
    const bob = Math.abs(Math.sin(time / 260 + n * 0.7)) * nod * 1.6 + hop * (3 + (n % 2) * 1.5);
    const sway = Math.sin(time / 1_400 + n * 1.3) * 0.06 + nod * Math.sin(time / 260 + n) * 0.05;
    const [x, y] = [elf.x, 92 + elf.lift - bob];
    ctx.fillStyle = colors.night;
    ctx.beginPath();
    ctx.ellipse(x, y + 9, 9, 7, 0, Math.PI, 0);
    ctx.fill();
    ctx.save();
    ctx.translate(x, y + 3);
    ctx.rotate(sway);
    ctx.fillStyle = colors.ink;
    for (const side of [-1, 1]) {
      ctx.beginPath();
      ctx.moveTo(side * 3.5, -3);
      ctx.lineTo(side * 7, -5.5);
      ctx.lineTo(side * 4, 0);
      ctx.fill();
    }
    // Dark against the lit stage, as an audience is: only the stage light rims their heads.
    ctx.fillStyle = colors.ink;
    ctx.beginPath();
    ctx.arc(0, -2.5, 4.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = colors.lantern;
    ctx.globalAlpha = 0.45;
    ctx.lineWidth = 0.6;
    ctx.beginPath();
    ctx.arc(0, -2.5, 4.3, Math.PI * 1.05, Math.PI * 1.45);
    ctx.stroke();
    ctx.globalAlpha = 1;
    ctx.fillStyle = elf.hat;
    ctx.beginPath();
    ctx.moveTo(-5, -4);
    ctx.quadraticCurveTo(-1, -12, 3 + Math.sin(time / 700 + n) * 0.8, -14);
    ctx.lineTo(5, -4);
    ctx.fill();
    ctx.fillStyle = colors.snowLit;
    ctx.fillRect(-5.3, -5, 10.6, 2);
    ctx.beginPath();
    ctx.arc(3 + Math.sin(time / 700 + n) * 0.8, -14, 1.4, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  });
}

/** Rings of sound spreading from a speaker's cone at (`x`, `y`), as loud as `loud`. */
export function ripples(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  loud: number,
  time: number,
) {
  if (loud <= 0) return;
  ctx.strokeStyle = colors.aurora;
  ctx.lineWidth = 0.6;
  for (let k = 0; k < 3; k++) {
    const t = (time / 900 + k / 3) % 1;
    ctx.globalAlpha = (1 - t) * 0.7 * loud;
    ctx.beginPath();
    ctx.arc(x, y, 5 + t * 14, 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.globalAlpha = 1;
}

/** Music notes drifting up from the speakers while the take plays back. */
export function notes(ctx: CanvasRenderingContext2D, time: number, on: number) {
  if (on <= 0) return;
  ctx.fillStyle = colors.gold;
  ctx.strokeStyle = colors.gold;
  ctx.lineWidth = 0.5;
  for (let k = 0; k < 4; k++) {
    const t = (time / 2_200 + k / 4) % 1;
    const x = (k % 2 ? 92 : 8) + Math.sin(t * 6 + k) * 3;
    const y = 44 - t * 20;
    ctx.globalAlpha = on * Math.min(1, (1 - t) * 3, t * 6);
    ctx.beginPath();
    ctx.ellipse(x, y, 1.2, 0.85, -0.4, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(x + 1.05, y);
    ctx.lineTo(x + 1.05, y - 4);
    ctx.lineTo(x + 2.6, y - 3);
    ctx.stroke();
  }
  ctx.globalAlpha = 1;
}
