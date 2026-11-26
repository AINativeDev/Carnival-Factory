/**
 * The big chalkboard during a question: which question it is, the streak and
 * the score along its top, the chalk timer running down under them, the
 * question chalked in as if written there and then, and under it a hint, why
 * the answer is right, or what it was when time ran out. The report card,
 * which the board turns into at the end, is in report.ts.
 */
import { theme } from '../../../src/northpole/theme';
import { chalkLines, letters, rounded, smooth, tick, wrap } from './chalk';
import type { Shown } from './demo';
import { BOARD } from './layout';
import { ROUND } from './questions';
import { multiplierOf, scoreText } from './score';
import { timeLeft } from './state';

const { colors } = theme;

/** How long the question takes to be chalked in, in ms. */
const WRITE = 900;

/** The frame, the green slate with old chalk smudged on it, and the tray of chalk under it. */
function slate(ctx: CanvasRenderingContext2D) {
  const { x, y, w, h } = BOARD;
  ctx.fillStyle = colors.shadow;
  ctx.globalAlpha = 0.5;
  ctx.fillRect(x - 1.2, y + h + 0.8, w + 4, 2.2);
  ctx.globalAlpha = 1;
  ctx.fillStyle = colors.gingerbread;
  ctx.fillRect(x - 2, y - 2, w + 4, h + 4);
  ctx.fillStyle = colors.wood;
  ctx.fillRect(x - 0.6, y - 0.6, w + 1.2, h + 1.2);
  const green = ctx.createLinearGradient(x, y, x + w, y + h);
  green.addColorStop(0, colors.pine);
  green.addColorStop(0.55, colors.pineDark);
  green.addColorStop(1, colors.pineDark);
  ctx.fillStyle = green;
  ctx.fillRect(x, y, w, h);
  ctx.fillStyle = colors.snow;
  ctx.globalAlpha = 0.05;
  for (const [sx, sy, rw] of [
    [30, 17, 9],
    [62, 38, 12],
    [44, 44, 7],
  ] as const) {
    ctx.beginPath();
    ctx.ellipse(sx, sy, rw, rw / 3, -0.2, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
  ctx.fillStyle = colors.gingerbread;
  ctx.fillRect(x + 4, y + h + 1.4, w - 8, 1.6);
  [colors.snow, colors.gold, colors.ice].forEach((colour, n) => {
    ctx.fillStyle = colour;
    ctx.fillRect(x + 10 + n * 4, y + h + 0.6, 2.6, 0.9);
  });
  ctx.fillStyle = colors.ink;
  ctx.fillRect(x + w - 14, y + h + 0.1, 5, 1.4);
}

/** The top line: which question it is, the streak's multiplier, and the score. */
function header({ quiz, demo }: Shown) {
  const left = demo ? 'POP QUIZ' : `QUESTION ${String(quiz.step + 1)} / ${String(ROUND)}`;
  const right = demo && quiz.best > 0 ? `BEST ${scoreText(quiz.best)}` : scoreText(quiz.score);
  const streak = quiz.streak >= 2 ? `STREAK ×${String(multiplierOf(quiz.streak))}` : '';
  return { left, streak, right };
}

/** The chalk timer: a bar that runs down, gold once half is gone and red near the end. */
function timer(ctx: CanvasRenderingContext2D, left: number) {
  const x = BOARD.x + 3;
  const y = BOARD.y + 8.2;
  const w = BOARD.w - 6;
  ctx.strokeStyle = colors.snow;
  ctx.globalAlpha = 0.35;
  ctx.lineWidth = 0.3;
  rounded(ctx, x, y, w, 2, 1);
  ctx.stroke();
  ctx.globalAlpha = 0.9;
  ctx.fillStyle = left > 0.5 ? colors.snow : left > 0.25 ? colors.gold : colors.berry;
  if (left > 0) {
    rounded(ctx, x + 0.4, y + 0.4, Math.max((w - 0.8) * left, 1.2), 1.2, 0.6);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
}

/** The line under the question: the demo's invitation, a hint, why it is right, or the answer missed. */
function footnote(ctx: CanvasRenderingContext2D, shown: Shown, time: number) {
  const { quiz, question, demo } = shown;
  if (!question) return;
  const mid = BOARD.x + BOARD.w / 2;
  const y = BOARD.y + 35;
  letters(ctx, 3.7);
  const fit = (text: string) => wrap(text, BOARD.w - 8, (line) => ctx.measureText(line).width);
  const shownFor = (from: number) => smooth((time - from) / 500);
  if (quiz.phase === 'right' && quiz.pick) {
    const lines = fit(question.why);
    ctx.fillStyle = colors.mint;
    ctx.strokeStyle = colors.mint;
    ctx.lineWidth = 0.7;
    const first = ctx.measureText(lines[0] ?? '').width;
    if (lines.length === 1) tick(ctx, mid - first / 2 - 3.4, y, 1.3);
    chalkLines(ctx, lines, mid, y, 4.6, shownFor(quiz.pick.at + 200));
  } else if (quiz.phase === 'timeout') {
    ctx.fillStyle = colors.gold;
    const answer = question.answers.at(question.right) ?? '';
    chalkLines(ctx, fit(`The answer: ${answer}`), mid, y, 4.6, shownFor(quiz.at));
  } else if (quiz.phase === 'out') {
    ctx.fillStyle = colors.gold;
    chalkLines(ctx, ['Out of apples! Let’s see your report…'], mid, y, 4.6, shownFor(quiz.at));
  } else if (quiz.pick) {
    ctx.fillStyle = colors.gold;
    chalkLines(ctx, fit(`Hint: ${question.hint}`), mid, y, 4.6, shownFor(quiz.pick.at));
  } else if (demo) {
    ctx.fillStyle = colors.snow;
    ctx.globalAlpha = 0.7 + 0.25 * Math.sin(time / 700);
    chalkLines(ctx, ['Tap any card to play!'], mid, y + 2, 4.6);
    ctx.globalAlpha = 1;
  }
}

/** The board during a question, or the demo's. */
export function board(ctx: CanvasRenderingContext2D, shown: Shown, time: number) {
  const { quiz, question } = shown;
  slate(ctx);
  if (!question) return;
  const { left, streak, right } = header(shown);
  const top = BOARD.y + 4.2;
  ctx.textBaseline = 'middle';
  letters(ctx, 3.1);
  ctx.fillStyle = colors.ice;
  ctx.textAlign = 'left';
  ctx.fillText(left, BOARD.x + 3, top);
  ctx.fillStyle = colors.gold;
  ctx.textAlign = 'center';
  ctx.fillText(streak, BOARD.x + BOARD.w / 2 + 6, top);
  letters(ctx, 3.8);
  ctx.fillStyle = colors.snow;
  ctx.textAlign = 'right';
  ctx.fillText(right, BOARD.x + BOARD.w - 3, top);
  timer(ctx, timeLeft(quiz, time));
  letters(ctx, 5.2);
  ctx.fillStyle = colors.snow;
  const lines = wrap(question.ask, BOARD.w - 7, (line) => ctx.measureText(line).width);
  const first = BOARD.y + 21.5 - ((lines.length - 1) * 6.3) / 2;
  chalkLines(ctx, lines, BOARD.x + BOARD.w / 2, first, 6.3, (time - quiz.since) / WRITE);
  footnote(ctx, shown, time);
}
