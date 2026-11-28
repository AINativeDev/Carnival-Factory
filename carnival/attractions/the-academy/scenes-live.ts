/**
 * The end of the journey. On the map (station 7, the hall's last bay, its
 * big doors open on the snowy dusk): the booth springs up on a patch of snow
 * in its look, under drifting confetti. Same loop, your repo: one card over
 * the dimmed hall that sets the North Pole beside any repository, row by row.
 */
import { glow } from '../../../src/northpole/diorama';
import { theme } from '../../../src/northpole/theme';
import { boothIcon } from './icons';
import { easeIn, eyebrow, letters, popIn, scatter, TYPE } from './kit';
import { FOOTER } from './layout';
import type { Moment } from './moment';
import { block } from './props';
import { surface } from './ui';

const { colors } = theme;

/** Confetti drifting down the bay, a steady scatter from `since`. */
function confetti(ctx: CanvasRenderingContext2D, since: number) {
  const colours = [colors.berry, colors.gold, colors.mint, colors.violet, colors.ice];
  for (let n = 0; n < 28; n++) {
    const fall = ((since / (2_800 + scatter(n) * 1_800) + scatter(n + 40)) % 1) * 38;
    const x = 6 + scatter(n + 7) * 88 + Math.sin(since / 500 + n) * 2;
    ctx.save();
    ctx.translate(x, 24 + fall);
    ctx.rotate(since / 300 + n);
    ctx.fillStyle = colours.at(n % colours.length) ?? colors.gold;
    ctx.fillRect(-0.8, -0.4, 1.6, 0.8);
    ctx.restore();
  }
}

/** The booth's stall: a lit block, its picture in the window on its lit side, and a berry roof. */
function stall(ctx: CanvasRenderingContext2D, moment: Moment) {
  const { visit, time } = moment;
  const front = { x: 64, y: 58 };
  const w = 13;
  const d = 9;
  const h = 10;
  block(ctx, front.x, front.y, { w, d, h });
  ctx.save();
  // The lit side's own slant, so the window and the picture sit flat on it.
  ctx.translate(front.x - w, front.y - w / 2 - h);
  ctx.transform(1, 0.5, 0, 1, 0, 0);
  ctx.fillStyle = colors.lantern;
  ctx.fillRect(1.6, 1.8, w - 3.2, h - 3.4);
  boothIcon(ctx, visit.booth, visit.look, w / 2, h / 2 - 0.4, 7, time);
  ctx.restore();
  const top = front.y - h;
  const apex = { x: front.x + (d - w) / 2, y: top - (w + d) / 4 - 9 };
  ctx.fillStyle = colors.berry;
  ctx.beginPath();
  ctx.moveTo(apex.x, apex.y);
  ctx.lineTo(front.x - w - 1.5, top - w / 2 + 0.5);
  ctx.lineTo(front.x, top + 1.2);
  ctx.fill();
  ctx.fillStyle = colors.cocoa;
  ctx.globalAlpha = 0.85;
  ctx.beginPath();
  ctx.moveTo(apex.x, apex.y);
  ctx.lineTo(front.x, top + 1.2);
  ctx.lineTo(front.x + d + 1.5, top - d / 2 + 0.5);
  ctx.fill();
  ctx.globalAlpha = 1;
  ctx.strokeStyle = colors.snowLit;
  ctx.lineWidth = 0.7;
  ctx.beginPath();
  ctx.moveTo(front.x - w - 1.5, top - w / 2 + 0.5);
  ctx.lineTo(front.x, top + 1.2);
  ctx.stroke();
}

/** On the map: the booth springing up with a warm glow behind it, and confetti. */
export function liveScene(ctx: CanvasRenderingContext2D, moment: Moment) {
  const { since } = moment;
  const grow = popIn(since / 600);
  if (grow > 0) {
    ctx.save();
    ctx.translate(60, 56);
    ctx.scale(grow, grow);
    ctx.translate(-60, -56);
    glow(ctx, 58, 46, 24, 0.8);
    stall(ctx, moment);
    ctx.restore();
  }
  confetti(ctx, since);
}

/** Each row of the your-repo card: the North Pole's side, and yours. */
const ROWS = [
  ['Your booth form', 'GitHub or Linear issue'],
  ['The factory’s loops', 'Loops in tessl.json'],
  ['Review + shepherd', 'Review with lenses'],
  ['Booth on the map', 'Reviewed pull request'],
] as const;

/** Same loop, your repo: the hall dimmed, and one card of the two sides, row by row. */
export function repoCard(ctx: CanvasRenderingContext2D, moment: Moment) {
  const { since } = moment;
  ctx.globalAlpha = 0.5;
  ctx.fillStyle = colors.night;
  ctx.fillRect(0, 23, 100, FOOTER - 23);
  surface(ctx, { x: 4, y: 26, w: 92, h: 50 });
  ctx.fillStyle = colors.muted;
  eyebrow(ctx, 'At the North Pole', 9, 32.5);
  ctx.fillStyle = colors.gold;
  eyebrow(ctx, 'In your repo', 55, 32.5);
  ROWS.forEach(([pole, yours], n) => {
    const { alpha, rise } = easeIn(since - 150 - n * 160);
    const y = 41 + n * 9 + rise;
    ctx.globalAlpha = alpha;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    letters(ctx, TYPE.body, false);
    ctx.fillStyle = colors.snow;
    ctx.fillText(pole, 9, y, 38);
    letters(ctx, TYPE.body);
    ctx.fillStyle = colors.snowLit;
    ctx.fillText(yours, 55, y, 38);
    ctx.strokeStyle = colors.gold;
    ctx.globalAlpha = alpha * 0.7;
    ctx.lineWidth = 0.4;
    ctx.beginPath();
    ctx.moveTo(48.4, y - 1);
    ctx.lineTo(49.6, y);
    ctx.lineTo(48.4, y + 1);
    ctx.stroke();
  });
  ctx.globalAlpha = 1;
}
