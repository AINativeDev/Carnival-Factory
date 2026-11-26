/**
 * The questions that pop up round the hall: who asks, what, for how long, and
 * where its bubble sits. Which attendee asks and whether the question is on
 * topic come from a seeded hash of the question's number, so a round plays
 * the same however often it's drawn. The pace rises as the keynote goes on:
 * questions come quicker, wait less and stray off topic more often.
 */
import { headOf, SEATS } from './crowd';
import { lineOf, OFF_TOPIC, ON_TOPIC } from './lines';

/** A question in the air: its asker, its words, whether it's on topic, and when it was asked. */
export interface Question {
  id: number;
  seat: number;
  line: number;
  good: boolean;
  born: number;
  life: number;
}

/** A question bubble's box, and the point its tail aims at, in the 0 to 100 units. */
export interface BubbleBox {
  x: number;
  y: number;
  w: number;
  h: number;
  tipX: number;
  tipY: number;
}

/** How big a bubble's words are, in units: legible from a 500 pixel square up. */
export const WORDS = 2.6;

/** A number from 0 to 1 that looks random but is always the same for `n` and `seed`. */
export function hash(n: number, seed: number): number {
  const v = Math.sin(n * 12.9898 + seed * 78.233) * 43758.5453;
  return v - Math.floor(v);
}

/** How long until the next question, after `answered` good questions. */
export const gapAfter = (answered: number) => Math.max(650, 1_900 - answered * 42);
/** How long a question waits for the mic, after `answered` good questions. */
export const lifeAfter = (answered: number) => Math.max(2_800, 5_600 - answered * 90);
/** How many questions may be up at once, after `answered` good questions. */
export const roomFor = (answered: number) => 3 + Math.floor(answered / 10);
/** How likely a question is off topic, after `answered` good questions. */
export const strayAfter = (answered: number) => 0.3 + answered * 0.006;

/** Where question `q`'s bubble sits: above its asker's raised hand, kept inside the square. */
export function bubbleOf(q: Pick<Question, 'seat' | 'good' | 'line'>): BubbleBox {
  const seat = SEATS.at(q.seat) ?? { x: 50, y: 61, s: 0.5 };
  const head = headOf({ ...seat, row: 0, seed: 0 });
  const w = Math.min(36, lineOf(q.good, q.line).length * WORDS * 0.5 + 4);
  const h = WORDS + 3.2;
  const tipY = head.y - 4.5 * seat.s;
  return {
    x: Math.min(99 - w, Math.max(1, head.x - w / 2)),
    y: tipY - h - 1.6,
    w,
    h,
    tipX: head.x,
    tipY,
  };
}

const overlaps = (a: BubbleBox, b: BubbleBox) =>
  a.x < b.x + b.w + 1 && b.x < a.x + a.w + 1 && a.y < b.y + b.h + 1 && b.y < a.y + a.h + 1;

/**
 * Question number `id` asked at `born`, after `answered` good ones, by the
 * first attendee in a seeded order whose bubble clears the others' and who
 * isn't `busy`; or undefined if nobody's free to ask.
 */
export function ask(
  id: number,
  seed: number,
  born: number,
  answered: number,
  up: readonly Question[],
  busy: readonly number[],
): Question | undefined {
  const good = hash(id, seed + 1) >= strayAfter(answered);
  const lines = good ? ON_TOPIC.length : OFF_TOPIC.length;
  const line = Math.floor(hash(id, seed + 2) * lines);
  const start = Math.floor(hash(id, seed) * SEATS.length);
  const boxes = up.map(bubbleOf);
  for (let k = 0; k < SEATS.length; k++) {
    const seat = (start + k * 7) % SEATS.length;
    if (busy.includes(seat) || up.some((q) => q.seat === seat)) continue;
    const box = bubbleOf({ seat, good, line });
    if (boxes.some((other) => overlaps(box, other))) continue;
    return { id, seat, line, good, born, life: lifeAfter(answered) };
  }
  return undefined;
}

/** How much of question `q`'s wait is left at `time`, from 1 down to 0. */
export const waitLeft = (q: Question, time: number) =>
  Math.max(0, Math.min(1, 1 - (time - q.born) / q.life));

/** The newest question whose bubble or asker's head is at `x`, `y`, if any. */
export function questionAt(up: readonly Question[], x: number, y: number): Question | undefined {
  return [...up].reverse().find((q) => {
    const box = bubbleOf(q);
    const seat = SEATS.at(q.seat);
    const onHead = seat ? Math.hypot(x - box.tipX, y - (seat.y - 7 * seat.s)) < 4 * seat.s : false;
    return onHead || (x >= box.x && x <= box.x + box.w && y >= box.y && y <= box.y + box.h + 1.6);
  });
}
