/**
 * The small pieces every part of the classroom shares: wrapping words to fit
 * the board or a card, chalk lettering, a star, a rounded card's outline,
 * easing and a steady scatter for the chalk dust. All in the square's 0 to
 * 100 units.
 */
import { signFont, theme } from '../../../src/northpole/theme';

const { colors } = theme;

/** Splits `text` into lines no wider than `width`, as `measure` says; a word too long stays whole. */
export function wrap(text: string, width: number, measure: (line: string) => number): string[] {
  const lines: string[] = [];
  let line = '';
  for (const word of text.split(/\s+/).filter(Boolean)) {
    const tried = line ? `${line} ${word}` : word;
    if (line && measure(tried) > width) {
      lines.push(line);
      line = word;
    } else line = tried;
  }
  if (line) lines.push(line);
  return lines;
}

/** A steady scatter from 0 to 1 for particle `n`: the same every frame, so the dust moves from time alone. */
export function scatter(n: number): number {
  const s = Math.sin(n * 12.9898 + 78.233) * 43_758.5453;
  return s - Math.floor(s);
}

/** Eases 0 to 1 with a little overshoot at the end, for things that pop in. */
export function popIn(t: number): number {
  const k = Math.min(Math.max(t, 0), 1);
  return 1 + 2.7 * (k - 1) ** 3 + 1.7 * (k - 1) ** 2;
}

/** Eases 0 to 1, slow at both ends. */
export function smooth(t: number): number {
  const k = Math.min(Math.max(t, 0), 1);
  return k * k * (3 - 2 * k);
}

/** Lettering at `px` units, round and bold like chalk on the board, or plain. */
export function letters(ctx: CanvasRenderingContext2D, px: number, bold = true) {
  ctx.font = signFont('rounded', px, bold);
}

/**
 * Chalked lines of text centred on `x`, the first at `y`, `gap` apart,
 * written in from the left: `written` runs 0 to 1 across all of them.
 */
export function chalkLines(
  ctx: CanvasRenderingContext2D,
  lines: readonly string[],
  x: number,
  y: number,
  gap: number,
  written = 1,
) {
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  lines.forEach((line, n) => {
    const shown = Math.min(Math.max(written * lines.length - n, 0), 1);
    if (shown <= 0) return;
    const width = ctx.measureText(line).width;
    ctx.save();
    ctx.beginPath();
    ctx.rect(x - width / 2 - 1, y + n * gap - gap, (width + 2) * shown, gap * 2);
    ctx.clip();
    ctx.fillText(line, x, y + n * gap);
    ctx.restore();
  });
}

/** A five-pointed star's outline round `x`, `y`, `r` to its points. */
function starPath(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, turn = 0) {
  ctx.beginPath();
  for (let n = 0; n < 10; n++) {
    const a = turn - Math.PI / 2 + (n * Math.PI) / 5;
    const reach = n % 2 ? r * 0.45 : r;
    ctx.lineTo(x + Math.cos(a) * reach, y + Math.sin(a) * reach);
  }
  ctx.closePath();
}

/** A gold star, lit on its upper left. */
export function star(ctx: CanvasRenderingContext2D, x: number, y: number, r: number) {
  starPath(ctx, x, y, r);
  ctx.fillStyle = colors.gold;
  ctx.fill();
  ctx.fillStyle = colors.glow;
  starPath(ctx, x - r * 0.12, y - r * 0.12, r * 0.45);
  ctx.fill();
}

/** A rounded rectangle's outline. */
export function rounded(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

/** A tick, as a teacher marks a right answer. */
export function tick(ctx: CanvasRenderingContext2D, x: number, y: number, r: number) {
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.beginPath();
  ctx.moveTo(x - r, y);
  ctx.lineTo(x - r * 0.3, y + r * 0.7);
  ctx.lineTo(x + r, y - r * 0.8);
  ctx.stroke();
}
