/**
 * What floats over the crowd: each question's bubble, popping up above its
 * asker's raised hand with a bar that runs down as they wait; the points or
 * the "Off topic!" that rise from a tap; and the question mic, which flies
 * from its stand in the aisle to whoever gets it.
 */
import { theme } from '../../../src/northpole/theme';
import { CHEER_FOR, type Cheer, headOf, SEATS } from './crowd';
import { lineOf } from './lines';
import { dot } from './paint';
import { bubbleOf, type Question, waitLeft, WORDS } from './questions';
import type { Pop } from './state';
import { words } from './words';

const { colors } = theme;

/** How long a pop takes to rise and fade. */
const POP_FOR = 900;
/** How long the mic takes to fly to whoever gets it. */
const FLIGHT = 450;
/** Where the mic sits on its stand in the aisle. */
const STAND = { x: 50, y: 68 };

/** The wait bar's colour: mint while there's time, gold, then berry when it's nearly gone. */
export const waitColor = (left: number) =>
  left > 0.5 ? colors.mint : left > 0.25 ? colors.gold : colors.berry;

/** Question `q`'s bubble at `time`, growing in as it's asked. */
export function bubble(ctx: CanvasRenderingContext2D, q: Question, time: number) {
  const box = bubbleOf(q);
  const grow = Math.min(1, (time - q.born) / 180);
  ctx.save();
  ctx.translate(box.tipX, box.tipY);
  ctx.scale(grow, grow);
  ctx.translate(-box.tipX, -box.tipY);
  ctx.fillStyle = colors.shadow;
  ctx.globalAlpha = 0.5;
  ctx.beginPath();
  ctx.roundRect(box.x + 0.4, box.y + 0.5, box.w, box.h, 1.4);
  ctx.fill();
  ctx.globalAlpha = 1;
  ctx.fillStyle = colors.cream;
  ctx.beginPath();
  ctx.roundRect(box.x, box.y, box.w, box.h, 1.4);
  ctx.fill();
  const tail = Math.max(box.x + 1.6, Math.min(box.x + box.w - 1.6, box.tipX));
  ctx.beginPath();
  ctx.moveTo(tail - 1.2, box.y + box.h - 0.1);
  ctx.lineTo(box.tipX, box.tipY);
  ctx.lineTo(tail + 1.2, box.y + box.h - 0.1);
  ctx.fill();
  words(ctx, lineOf(q.good, q.line), box.x + box.w / 2, box.y + 2.3, {
    size: WORDS,
    color: colors.ink,
    max: box.w - 2,
  });
  const left = waitLeft(q, time);
  ctx.fillStyle = colors.snowShade;
  ctx.fillRect(box.x + 1, box.y + box.h - 1.3, box.w - 2, 0.6);
  ctx.fillStyle = waitColor(left);
  ctx.fillRect(box.x + 1, box.y + box.h - 1.3, (box.w - 2) * left, 0.6);
  ctx.restore();
}

/** A pop rising from where it was tapped, fading as it goes. */
export function pop(ctx: CanvasRenderingContext2D, p: Pop, time: number) {
  const t = (time - p.at) / POP_FOR;
  if (t < 0 || t >= 1) return;
  const y = p.y - 1 - t * 6;
  // Kept clear of the square's edges, so the longest word stays whole.
  const x = Math.min(84, Math.max(16, p.x));
  ctx.globalAlpha = 1 - t * t;
  words(ctx, p.text, x + 0.25, y + 0.3, { size: 3.4, color: colors.ink });
  words(ctx, p.text, x, y, { size: 3.4, color: p.good ? colors.gold : colors.berry });
  ctx.globalAlpha = 1;
}

function mic(ctx: CanvasRenderingContext2D, x: number, y: number, s: number) {
  ctx.fillStyle = colors.ink;
  ctx.fillRect(x - 0.35 * s, y, 0.7 * s, 2.6 * s);
  dot(ctx, x, y, 0.9 * s, colors.muted);
  dot(ctx, x - 0.25 * s, y - 0.25 * s, 0.35 * s, colors.snowLit);
}

/** Where the mic is at `time`: on its stand, flying to the newest cheer, or in their hand. */
export function micAt(cheers: readonly Cheer[], time: number): { x: number; y: number } {
  const last = cheers.at(-1);
  const seat = last ? SEATS.at(last.seat) : undefined;
  if (!last || !seat || time - last.at >= CHEER_FOR) return STAND;
  const head = headOf(seat);
  const to = { x: head.x + 3.4 * seat.s, y: head.y - 1 * seat.s };
  const t = Math.min(1, (time - last.at) / FLIGHT);
  return {
    x: STAND.x + (to.x - STAND.x) * t,
    y: STAND.y + (to.y - STAND.y) * t - Math.sin(t * Math.PI) * 10,
  };
}

/** The mic stand in the aisle, empty while its mic is out. */
export function stand(ctx: CanvasRenderingContext2D) {
  ctx.fillStyle = colors.ink;
  ctx.beginPath();
  ctx.ellipse(STAND.x, 86, 3, 0.9, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillRect(STAND.x - 0.3, STAND.y + 1, 0.6, 86 - STAND.y - 1);
  words(ctx, 'Q&A', STAND.x, 88.6, { size: 2.2, color: colors.gold });
}

/** The mic, wherever it is at `time`. */
export function flyingMic(ctx: CanvasRenderingContext2D, cheers: readonly Cheer[], time: number) {
  const at = micAt(cheers, time);
  mic(ctx, at.x, at.y, 1.2);
}
