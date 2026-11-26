/**
 * The game's feedback: a burst of chalk dust and the points rising off a
 * right card, the streak's multiplier under them, a gold star for a first
 * try, an apple lost off a wrong card, and the apples on the teacher's desk,
 * each lost one rolling off the edge. All from `time`, so it never flashes.
 */
import { glow } from '../../../src/northpole/diorama';
import { theme } from '../../../src/northpole/theme';
import { letters, scatter, smooth, star } from './chalk';
import type { Shown } from './demo';
import { BOARD, type Box, CARDS } from './layout';
import { multiplierOf } from './score';
import { LIVES } from './state';

const { colors } = theme;

/** How long the chalk dust drifts, in ms. */
const DUST = 1_800;
const DUST_COLOURS = [colors.snow, colors.gold, colors.mint, colors.violet, colors.ice];

/** A burst of `count` flecks of chalk dust from `x`, `y`, `since` ms ago, falling and fading. */
function chalkDust(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  since: number,
  count: number,
) {
  if (since < 0 || since > DUST) return;
  const t = since / 1_000;
  for (let n = 0; n < count; n++) {
    const angle = -Math.PI / 2 + (scatter(n) - 0.5) * 2.6;
    const speed = 22 + scatter(n + 50) * 34;
    const px = x + Math.cos(angle) * speed * t;
    const py = y + Math.sin(angle) * speed * t + 34 * t * t;
    ctx.globalAlpha = 1 - since / DUST;
    ctx.fillStyle = DUST_COLOURS[n % DUST_COLOURS.length] ?? colors.snow;
    ctx.save();
    ctx.translate(px, py);
    ctx.rotate(n + t * 5);
    ctx.fillRect(-0.6, -0.35, 1.2, 0.7);
    ctx.restore();
  }
  ctx.globalAlpha = 1;
}

/** An apple, `r` across, or its core once eaten. */
function apple(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, core = false) {
  ctx.fillStyle = core ? colors.cream : colors.berry;
  ctx.beginPath();
  if (core) ctx.ellipse(x, y, r * 0.35, r * 0.8, 0, 0, Math.PI * 2);
  else ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();
  if (!core) {
    ctx.fillStyle = colors.glow;
    ctx.globalAlpha *= 0.5;
    ctx.beginPath();
    ctx.arc(x - r * 0.4, y - r * 0.35, r * 0.28, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha /= 0.5;
  }
  ctx.fillStyle = colors.cocoa;
  ctx.fillRect(x - r * 0.08, y - r * 1.35, r * 0.16, r * 0.5);
  ctx.fillStyle = colors.pine;
  ctx.beginPath();
  ctx.ellipse(x + r * 0.35, y - r * 1.1, r * 0.35, r * 0.16, -0.5, 0, Math.PI * 2);
  ctx.fill();
}

/** The teacher's desk by the window, with an apple on it for each life; lost ones roll off and leave a core. */
export function desk(ctx: CanvasRenderingContext2D, lost: readonly number[], time: number) {
  const top = 52.5;
  glow(ctx, 91, top - 4, 12, 0.7);
  ctx.fillStyle = colors.wood;
  ctx.fillRect(84.5, top + 1.4, 1.4, 63 - top - 1.4);
  ctx.fillRect(97, top + 1.4, 1.4, 63 - top - 1.4);
  ctx.fillStyle = colors.gingerbread;
  ctx.fillRect(83.5, top, 16, 1.6);
  for (let n = 0; n < LIVES; n++) {
    const x = 87.4 + n * 4.3;
    // The apples go from the right, so the last one left is nearest the board.
    const fell = lost.at(LIVES - 1 - n);
    if (fell === undefined) {
      apple(ctx, x, top - 1.9, 1.9);
      continue;
    }
    const t = (time - fell) / 700;
    apple(ctx, x, top - 1.2, 1.4, true);
    if (t >= 1) continue;
    ctx.save();
    ctx.globalAlpha = 1 - smooth(t);
    apple(ctx, x + t * 6, top - 1.9 + t * t * 14, 1.9);
    ctx.restore();
  }
}

/** Big chalk numbers with a dark edge so they read over the wall and the floor alike. */
function shout(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  px: number,
  fill: string,
) {
  letters(ctx, px);
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.lineJoin = 'round';
  ctx.strokeStyle = colors.ink;
  ctx.lineWidth = px * 0.22;
  ctx.strokeText(text, x, y);
  ctx.fillStyle = fill;
  ctx.fillText(text, x, y);
}

/** What rises off the card just picked: the points and a star when right, an apple lost when wrong. */
export function feedback(ctx: CanvasRenderingContext2D, shown: Shown, time: number) {
  const { quiz } = shown;
  if (quiz.phase === 'report') {
    chalkDust(ctx, BOARD.x + BOARD.w / 2, BOARD.y + 20, time - quiz.at - 1_500, 60);
    return;
  }
  const pick = quiz.pick;
  const box: Box | undefined = pick ? CARDS.at(pick.card) : undefined;
  if (!pick || !box) return;
  const since = time - pick.at;
  const cx = box.x + box.w / 2;
  if (pick.right) {
    chalkDust(ctx, cx, box.y + 6, since, 40);
    const rise = smooth(since / 900);
    ctx.globalAlpha = 1 - smooth((since - 1_900) / 600);
    shout(ctx, `+${String(quiz.gained)}`, cx, box.y - 4 - rise * 8, 6.5, colors.gold);
    const times = multiplierOf(quiz.streak);
    if (times > 1)
      shout(ctx, `×${String(times)} streak!`, cx, box.y + 2 - rise * 8, 3.6, colors.snow);
    if (quiz.wrong.length === 0) {
      ctx.save();
      ctx.translate(box.x + box.w - 2, box.y + 2);
      ctx.rotate(0.3);
      const grow = Math.min(since / 300, 1);
      star(ctx, 0, 0, 4.4 * grow);
      ctx.restore();
    }
    ctx.globalAlpha = 1;
    return;
  }
  if (since > 1_400) return;
  const rise = smooth(since / 1_000);
  ctx.globalAlpha = 1 - smooth((since - 900) / 500);
  apple(ctx, cx - 3.4, box.y - 3 - rise * 6, 1.8);
  shout(ctx, '−1', cx + 2, box.y - 3 - rise * 6, 4.4, colors.snow);
  ctx.globalAlpha = 1;
}
