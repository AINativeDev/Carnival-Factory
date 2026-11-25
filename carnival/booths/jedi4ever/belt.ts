/**
 * The conveyor belt and everything on its way through the factory: the
 * letters and toys, the hammer's sparks and the brush's dabs, and the tick
 * over a toy that passed its check.
 */
import { theme } from '../../../src/northpole/theme';
import { circle, type Ctx } from './brushes';
import { buildOf, HAMMER_X, PAINT_X, placeOf, type Letter } from './letters';
import { ease, wrap } from './motion';
import { envelope, toy } from './toys';

const { colors } = theme;

/** The belt on its legs, its rollers turning. */
export function drawBelt(ctx: Ctx, u: number, time: number) {
  ctx.fillStyle = colors.cocoa;
  ctx.fillRect(25 * u, 70 * u, 1.5 * u, 10 * u);
  ctx.fillRect(74 * u, 70 * u, 1.5 * u, 10 * u);
  ctx.fillStyle = colors.surface;
  ctx.fillRect(23 * u, 65 * u, 54 * u, 5 * u);
  ctx.fillStyle = colors.muted;
  const roll = wrap(time / 120, 6);
  for (let x = 24 + roll; x < 76; x += 6) circle(ctx, x * u, 67.5 * u, 0.7 * u);
}

/** Every letter and toy on its way, stamped once sorted, and fading as it settles in the tray. */
export function drawLetters(ctx: Ctx, u: number, letters: readonly Letter[]) {
  for (const letter of letters) {
    const { x, y } = placeOf(letter);
    const build = buildOf(letter);
    if (letter.stage === 'tray') ctx.globalAlpha = 1 - ease((letter.progress - 0.85) / 0.15);
    if (build === 0 || !letter.toy) {
      envelope(ctx, u, x, y);
      const stamped =
        letter.stage === 'belt' ||
        letter.stage === 'float' ||
        letter.stage === 'tray' ||
        (letter.stage === 'sort' && letter.progress > 0.6);
      if (stamped) {
        ctx.fillStyle = letter.toy ? colors.pine : colors.berry;
        circle(ctx, (x + 2) * u, (y - 1) * u, 1 * u);
      }
    } else {
      toy(ctx, u, letter.toy, x, y, build === 2);
    }
    ctx.globalAlpha = 1;
  }
}

/** Sparks from the hammer, dabs from the brush, round whatever is passing each elf. */
export function drawSparks(ctx: Ctx, u: number, time: number, letters: readonly Letter[]) {
  for (const letter of letters) {
    if (letter.stage !== 'belt') continue;
    const { x, y } = placeOf(letter);
    const [color, spots] =
      Math.abs(x - HAMMER_X) < 4
        ? [colors.glow, 4]
        : Math.abs(x - PAINT_X) < 4
          ? [colors.violet, 3]
          : [null, 0];
    if (!color) continue;
    ctx.fillStyle = color;
    for (let i = 0; i < spots; i++) {
      const angle = time / 300 + (i / spots) * Math.PI * 2;
      circle(ctx, (x + Math.cos(angle) * 4) * u, (y - 3 + Math.sin(angle) * 2.5) * u, 0.55 * u);
    }
  }
}

/** The tick over a toy that passed its check. */
export function drawTick(ctx: Ctx, u: number, letters: readonly Letter[]) {
  const checked = letters.find((l) => l.stage === 'check' && l.progress >= 0.5);
  if (!checked) return;
  ctx.globalAlpha = ease((checked.progress - 0.5) / 0.2);
  ctx.strokeStyle = colors.pine;
  ctx.lineWidth = 1.4 * u;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(68.5 * u, 49 * u);
  ctx.lineTo(70.5 * u, 51 * u);
  ctx.lineTo(74 * u, 46.5 * u);
  ctx.stroke();
  ctx.globalAlpha = 1;
}
