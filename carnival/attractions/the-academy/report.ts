/**
 * The report card the chalkboard turns into at the end of a game: the score
 * counting up, the best of the visit, a grade stamped on like a sticker, a
 * tick or a cross for each question, and the way on to the real Academy,
 * the gold card on the floor below.
 */
import { theme } from '../../../src/northpole/theme';
import { chalkLines, letters, popIn, rounded, smooth, tick } from './chalk';
import { BOARD } from './layout';
import { ROUND } from './questions';
import { gradeOf, scoreText } from './score';
import type { Quiz } from './state';

const { colors } = theme;

/** How long the score takes to count up, in ms. */
const COUNT_UP = 1_200;

/** The grade's sticker: a cream disc with the letter, slapped on at an angle. */
function sticker(
  ctx: CanvasRenderingContext2D,
  letter: string,
  x: number,
  y: number,
  grow: number,
) {
  if (grow <= 0) return;
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(-0.18);
  ctx.scale(grow, grow);
  ctx.fillStyle = colors.shadow;
  ctx.globalAlpha = 0.4;
  ctx.beginPath();
  ctx.arc(0.6, 0.8, 7.4, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = 1;
  ctx.fillStyle = colors.cream;
  ctx.beginPath();
  ctx.arc(0, 0, 7.4, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = colors.berry;
  ctx.lineWidth = 0.7;
  ctx.beginPath();
  ctx.arc(0, 0, 6.2, 0, Math.PI * 2);
  ctx.stroke();
  ctx.fillStyle = colors.berry;
  letters(ctx, letter.length > 1 ? 6.4 : 8);
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(letter, 0, 0.4);
  ctx.restore();
}

/** A tick for each question answered right first time, a cross for the rest, a dash for those not reached. */
function marks(ctx: CanvasRenderingContext2D, quiz: Quiz, x: number, y: number) {
  ctx.lineWidth = 0.6;
  ctx.lineCap = 'round';
  for (let n = 0; n < ROUND; n++) {
    const at = x + n * 5;
    const first = quiz.firsts.at(n);
    ctx.strokeStyle = first ? colors.mint : first === false ? colors.gold : colors.muted;
    ctx.beginPath();
    if (first) tick(ctx, at, y, 1.2);
    else if (first === false) {
      ctx.moveTo(at - 1, y - 1);
      ctx.lineTo(at + 1, y + 1);
      ctx.moveTo(at + 1, y - 1);
      ctx.lineTo(at - 1, y + 1);
      ctx.stroke();
    } else {
      ctx.moveTo(at - 1, y);
      ctx.lineTo(at + 1, y);
      ctx.stroke();
    }
  }
}

/** The report card on the board, `time` into the game's end. */
export function reportCard(ctx: CanvasRenderingContext2D, quiz: Quiz, time: number) {
  const since = time - quiz.at;
  const left = BOARD.x + 4;
  const grade = gradeOf(quiz.firsts.filter(Boolean).length, ROUND);
  letters(ctx, 4.6);
  ctx.fillStyle = colors.gold;
  chalkLines(ctx, ['REPORT CARD'], BOARD.x + BOARD.w / 2, BOARD.y + 5.5, 6, smooth(since / 500));
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  letters(ctx, 7.4);
  ctx.fillStyle = colors.snow;
  const counted = quiz.score * smooth((since - 300) / COUNT_UP);
  ctx.fillText(scoreText(counted), left, BOARD.y + 16);
  const width = ctx.measureText(scoreText(quiz.score)).width;
  letters(ctx, 3.6, false);
  ctx.fillStyle = colors.ice;
  ctx.fillText('points', left + width + 1.6, BOARD.y + 17);
  const later = smooth((since - COUNT_UP - 300) / 500);
  ctx.globalAlpha = later;
  letters(ctx, 3.6);
  ctx.fillStyle = quiz.newBest ? colors.gold : colors.ice;
  const best = `Best ${scoreText(quiz.best)}${quiz.newBest ? '  ·  New best!' : ''}`;
  ctx.fillText(best, left, BOARD.y + 23.5);
  letters(ctx, 4.2);
  ctx.fillStyle = colors.snow;
  ctx.fillText(grade.words, left, BOARD.y + 29.5);
  marks(ctx, quiz, left + 1.2, BOARD.y + 35);
  ctx.globalAlpha = 1;
  sticker(
    ctx,
    grade.letter,
    BOARD.x + BOARD.w - 11,
    BOARD.y + 19,
    popIn((since - COUNT_UP - 500) / 450),
  );
  letters(ctx, 3.4);
  ctx.fillStyle = colors.gold;
  ctx.globalAlpha = later;
  chalkLines(ctx, ['Next lesson: the real Academy ↓'], BOARD.x + BOARD.w / 2, BOARD.y + 41.5, 5);
  ctx.globalAlpha = 1;
  ctx.strokeStyle = colors.snow;
  ctx.globalAlpha = 0.25;
  ctx.lineWidth = 0.3;
  rounded(ctx, BOARD.x + 2, BOARD.y + 10, BOARD.w - 4, 28.5, 1.5);
  ctx.stroke();
  ctx.globalAlpha = 1;
}
