import { describe, expect, it } from 'vitest';
import { SEATS } from './crowd';
import { lineOf, OFF_TOPIC, ON_TOPIC } from './lines';
import {
  ask,
  bubbleOf,
  gapAfter,
  hash,
  lifeAfter,
  type Question,
  questionAt,
  roomFor,
  strayAfter,
  waitLeft,
} from './questions';

describe('the questions', () => {
  it('have words short enough to read at a glance', () => {
    for (const line of [...ON_TOPIC, ...OFF_TOPIC]) expect(line.length).toBeLessThanOrEqual(26);
    expect(lineOf(true, ON_TOPIC.length)).toBe(ON_TOPIC[0]);
    expect(lineOf(false, 1)).toBe(OFF_TOPIC[1]);
  });

  it('come from a hash that is always the same, from 0 to 1', () => {
    for (let n = 0; n < 200; n++) {
      expect(hash(n, 7)).toBe(hash(n, 7));
      expect(hash(n, 7)).toBeGreaterThanOrEqual(0);
      expect(hash(n, 7)).toBeLessThan(1);
    }
  });

  it('come quicker, wait less, crowd in and stray more as the keynote goes on', () => {
    expect(gapAfter(29)).toBeLessThan(gapAfter(0));
    expect(lifeAfter(29)).toBeLessThan(lifeAfter(0));
    expect(roomFor(29)).toBeGreaterThan(roomFor(0));
    expect(strayAfter(29)).toBeGreaterThan(strayAfter(0));
    expect(gapAfter(1_000)).toBe(650);
    expect(lifeAfter(1_000)).toBe(2_800);
  });

  it('keep every bubble inside the square, above its asker', () => {
    SEATS.forEach((seat, n) => {
      for (const good of [true, false]) {
        const lines = good ? ON_TOPIC : OFF_TOPIC;
        lines.forEach((_, line) => {
          const box = bubbleOf({ seat: n, good, line });
          expect(box.x).toBeGreaterThanOrEqual(1);
          expect(box.x + box.w).toBeLessThanOrEqual(99);
          expect(box.y).toBeGreaterThan(40);
          expect(box.tipY).toBeLessThan(seat.y);
        });
      }
    });
  });

  it("are asked by someone free, whose bubble clears the others'", () => {
    const up: Question[] = [];
    for (let id = 0; id < 5; id++) {
      const q = ask(id, 3, 0, 0, up, [0]);
      expect(q).toBeDefined();
      if (!q) break;
      expect(q.seat).not.toBe(0);
      expect(up.map((other) => other.seat)).not.toContain(q.seat);
      up.push(q);
    }
    const everyone = SEATS.map((_, n) => n);
    expect(ask(9, 3, 0, 0, [], everyone)).toBeUndefined();
  });

  it('are on topic most of the time, more often early on', () => {
    const good = (answered: number) =>
      Array.from({ length: 400 }, (_, id) => ask(id, 1, 0, answered, [], [])).filter((q) => q?.good)
        .length;
    expect(good(0)).toBeGreaterThan(200);
    expect(good(0)).toBeGreaterThan(good(29));
  });

  it('wait from full down to nothing', () => {
    const q = { id: 0, seat: 0, line: 0, good: true, born: 1_000, life: 2_000 };
    expect(waitLeft(q, 1_000)).toBe(1);
    expect(waitLeft(q, 2_000)).toBe(0.5);
    expect(waitLeft(q, 9_000)).toBe(0);
  });

  it('are found by a tap on their bubble or their asker, the newest first', () => {
    const a = { id: 0, seat: 30, line: 0, good: true, born: 0, life: 4_000 };
    const b = { ...a, id: 1, line: 1 };
    const box = bubbleOf(a);
    expect(questionAt([a, b], box.x + box.w / 2, box.y + 1)?.id).toBe(1);
    const seat = SEATS.at(30) ?? { x: 0, y: 0, s: 1 };
    expect(questionAt([a], seat.x, seat.y - 7 * seat.s)?.id).toBe(0);
    expect(questionAt([a], 2, 2)).toBeUndefined();
  });
});
