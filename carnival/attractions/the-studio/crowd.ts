/**
 * The cosy crowd of elves watching from the front, seen from behind and dark
 * against the lit stage, their hats the only colour: still while the episode
 * records, nodding along to the playback and hopping when cheered on. They
 * stand along the scene's foot, so they never reach the footer.
 */
import { theme } from '../../../src/northpole/theme';
import { SCENE } from './layout';

const { colors } = theme;

/** Each elf in the front row: where, how much lower than the tallest, and its hat. */
const ELVES = [
  { x: 13, drop: 1.2, hat: colors.berry },
  { x: 29, drop: 0, hat: colors.pine },
  { x: 45, drop: 1.6, hat: colors.violet },
  { x: 61, drop: 0.4, hat: colors.berry },
  { x: 77, drop: 1.4, hat: colors.pine },
] as const;

/** The front row: `nod` how hard they nod along, `hop` how high they jump. */
export function crowd(ctx: CanvasRenderingContext2D, time: number, nod: number, hop: number) {
  const foot = SCENE.y + SCENE.h;
  ctx.save();
  // The scene's own foot: their shoulders end where the studio does.
  ctx.beginPath();
  ctx.rect(SCENE.x, SCENE.y, SCENE.w, SCENE.h);
  ctx.clip();
  ELVES.forEach((elf, n) => {
    const bob = Math.abs(Math.sin(time / 260 + n * 0.7)) * nod * 1.2 + hop * (2 + (n % 2));
    const tilt = nod * Math.sin(time / 260 + n) * 0.06;
    const [x, y] = [elf.x, foot - 5 + elf.drop - bob];
    ctx.fillStyle = colors.night;
    ctx.beginPath();
    ctx.ellipse(x, y + 7, 7, 5, 0, Math.PI, 0);
    ctx.fill();
    ctx.save();
    ctx.translate(x, y + 2);
    ctx.rotate(tilt);
    ctx.fillStyle = colors.ink;
    for (const side of [-1, 1]) {
      ctx.beginPath();
      ctx.moveTo(side * 2.6, -2.2);
      ctx.lineTo(side * 5.4, -4);
      ctx.lineTo(side * 3, 0);
      ctx.fill();
    }
    ctx.beginPath();
    ctx.arc(0, -2, 3.5, 0, Math.PI * 2);
    ctx.fill();
    // Only the key light from the upper left rims their heads.
    ctx.strokeStyle = colors.lantern;
    ctx.globalAlpha = 0.5;
    ctx.lineWidth = 0.5;
    ctx.beginPath();
    ctx.arc(0, -2, 3.3, Math.PI * 1.05, Math.PI * 1.45);
    ctx.stroke();
    ctx.globalAlpha = 0.85;
    ctx.fillStyle = elf.hat;
    ctx.beginPath();
    ctx.moveTo(-3.9, -3.4);
    ctx.quadraticCurveTo(-0.8, -9.5, 2.4, -10.8);
    ctx.lineTo(3.9, -3.4);
    ctx.fill();
    ctx.fillStyle = colors.snowShade;
    ctx.fillRect(-4.1, -4.2, 8.2, 1.5);
    ctx.beginPath();
    ctx.arc(2.4, -10.8, 1.1, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
    ctx.restore();
  });
  ctx.restore();
}
