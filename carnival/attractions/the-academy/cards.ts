/**
 * The cards on the classroom floor: three answer cards while a question is
 * up, lifting under the pointer, wobbling and greying out when wrong and
 * glowing gold when right; on the report card, one to play again and a gold
 * one to start the real Academy; and the small Academy sign by the window.
 */
import { glow } from '../../../src/northpole/diorama';
import { theme } from '../../../src/northpole/theme';
import { letters, popIn, rounded, tick, wrap } from './chalk';
import type { Shown } from './demo';
import { ACADEMY, AGAIN, type Box, CARDS, SIGN } from './layout';
import { CARDS_UP } from './quiz';

const { colors } = theme;

/** Each card's letter badge colour, A, B and C. */
const BADGES = [colors.berry, colors.pine, colors.violet] as const;

/** A card's paper: a cast shadow, a thick edge and the face, gold-edged when `edge` is given. */
function paper(ctx: CanvasRenderingContext2D, box: Box, face: string, edge?: string) {
  const { x, y, w, h } = box;
  ctx.fillStyle = colors.shadow;
  ctx.globalAlpha *= 0.45;
  rounded(ctx, x + 1, y + 2, w, h, 2.2);
  ctx.fill();
  ctx.globalAlpha /= 0.45;
  ctx.fillStyle = colors.snowShade;
  rounded(ctx, x, y + 1, w, h, 2.2);
  ctx.fill();
  ctx.fillStyle = face;
  rounded(ctx, x, y, w, h, 2.2);
  ctx.fill();
  if (edge) {
    ctx.strokeStyle = edge;
    ctx.lineWidth = 0.9;
    ctx.stroke();
  }
}

/** Centred words in `box`, wrapped, `px` units tall, their middle at `middle`. */
function words(ctx: CanvasRenderingContext2D, text: string, box: Box, middle: number, px: number) {
  letters(ctx, px);
  const lines = wrap(text, box.w - 4, (line) => ctx.measureText(line).width);
  const gap = px * 1.15;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  lines.forEach((line, n) => {
    ctx.fillText(line, box.x + box.w / 2, middle + (n - (lines.length - 1) / 2) * gap);
  });
}

/** How card `n` stands: lifted, tilted, faded, and how it is marked. */
function stanceOf(shown: Shown, n: number, time: number) {
  const { quiz, question, lit } = shown;
  const right = question?.right === n;
  const wrong = quiz.wrong.includes(n);
  const picked = quiz.pick?.card === n;
  const since = quiz.pick ? time - quiz.pick.at : Infinity;
  const settled = quiz.phase === 'right' || quiz.phase === 'timeout' || quiz.phase === 'out';
  const shine = right && settled && quiz.phase !== 'out';
  const wobble =
    picked && !right && since < 900 ? Math.sin(since / 45) * 0.08 * (1 - since / 900) : 0;
  const pop = picked && right ? 1 + 0.08 * Math.sin(Math.PI * Math.min(since / 350, 1)) : 1;
  const lift = n === lit || shine ? 1.6 : 0;
  const alpha = wrong ? 0.55 : settled && !shine ? 0.5 : 1;
  return { right, wrong, shine, wobble, pop, lift, alpha };
}

/** The three answer cards for the question up, or the demo's. */
function answerCards(ctx: CanvasRenderingContext2D, shown: Shown, time: number) {
  const { question } = shown;
  if (!question) return;
  CARDS.forEach((box, n) => {
    const s = stanceOf(shown, n, time);
    const cx = box.x + box.w / 2;
    const cy = box.y + box.h / 2;
    if (s.shine || s.lift) glow(ctx, cx, cy, 22, s.shine ? 1 : 0.6);
    ctx.save();
    ctx.globalAlpha = s.alpha;
    ctx.translate(cx, cy - s.lift);
    ctx.rotate(s.wobble);
    ctx.scale(s.pop, s.pop);
    ctx.translate(-cx, -cy);
    const edge = s.shine ? colors.gold : s.lift ? colors.lantern : undefined;
    paper(ctx, box, s.wrong ? colors.snowShade : colors.cream, edge);
    const badge = { x: cx, y: box.y + 6 };
    ctx.fillStyle = s.shine ? colors.pine : s.wrong ? colors.muted : (BADGES.at(n) ?? colors.berry);
    ctx.beginPath();
    ctx.arc(badge.x, badge.y, 3.6, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = colors.snow;
    ctx.strokeStyle = colors.snow;
    ctx.lineWidth = 0.9;
    if (s.shine) tick(ctx, badge.x, badge.y + 0.2, 1.7);
    else if (s.wrong) {
      ctx.beginPath();
      ctx.moveTo(badge.x - 1.4, badge.y - 1.4);
      ctx.lineTo(badge.x + 1.4, badge.y + 1.4);
      ctx.moveTo(badge.x + 1.4, badge.y - 1.4);
      ctx.lineTo(badge.x - 1.4, badge.y + 1.4);
      ctx.stroke();
    } else {
      letters(ctx, 4.2);
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('ABC'.charAt(n), badge.x, badge.y + 0.3);
    }
    ctx.fillStyle = s.wrong ? colors.slabShade : colors.ink;
    words(ctx, question.answers.at(n) ?? '', box, box.y + 18.5, 4.3);
    ctx.restore();
  });
}

/** A big card on the report card: `label` over `sub`, gold-faced when it leads somewhere. */
function bigCard(
  ctx: CanvasRenderingContext2D,
  box: Box,
  label: string,
  sub: string,
  gold: boolean,
  grow: number,
) {
  if (grow <= 0) return;
  const cx = box.x + box.w / 2;
  const cy = box.y + box.h / 2;
  if (gold) glow(ctx, cx, cy, 26, 0.9);
  ctx.save();
  ctx.translate(cx, cy);
  ctx.scale(grow, grow);
  ctx.translate(-cx, -cy);
  paper(ctx, box, gold ? colors.gold : colors.cream, gold ? colors.glow : undefined);
  ctx.fillStyle = colors.ink;
  words(ctx, label, box, box.y + 8.5, 4.6);
  ctx.fillStyle = gold ? colors.cocoa : colors.wood;
  words(ctx, sub, box, box.y + 15.5, 3.4);
  ctx.restore();
}

/** The small Academy sign by the window: a gold tag that sways a little on its nail. */
function sign(ctx: CanvasRenderingContext2D, time: number) {
  const { x, y, w, h } = SIGN;
  ctx.save();
  ctx.translate(x + w / 2, y - 1.5);
  ctx.rotate(Math.sin(time / 1_600) * 0.04);
  ctx.translate(-(x + w / 2), -(y - 1.5));
  ctx.strokeStyle = colors.ink;
  ctx.lineWidth = 0.3;
  ctx.beginPath();
  ctx.moveTo(x + 2, y);
  ctx.lineTo(x + w / 2, y - 1.5);
  ctx.lineTo(x + w - 2, y);
  ctx.stroke();
  paper(ctx, SIGN, colors.gold);
  ctx.fillStyle = colors.ink;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  letters(ctx, 1.9);
  ctx.fillText('START THE', x + w / 2, y + h / 2 - 1.7);
  letters(ctx, 2.5);
  ctx.fillText('Academy ↗', x + w / 2, y + h / 2 + 1.5);
  ctx.restore();
}

/** Every card on the floor, and the sign by the window, as they stand at `time`. */
export function cards(ctx: CanvasRenderingContext2D, shown: Shown, time: number) {
  const { quiz } = shown;
  if (quiz.phase !== 'report') {
    sign(ctx, time);
    answerCards(ctx, shown, time);
    return;
  }
  const since = time - quiz.at;
  bigCard(ctx, AGAIN, 'Play again', 'new questions', false, popIn((since - CARDS_UP + 400) / 400));
  bigCard(
    ctx,
    ACADEMY,
    'Start the Academy',
    'opens in a new tab ↗',
    true,
    popIn((since - CARDS_UP + 200) / 400),
  );
}
