import { describe, expect, it } from 'vitest';
import attraction from './attraction';
import { CARD, EVERY, newAct } from './act';
import { scoreboard } from './board';
import { DrawingLog } from './drawing-log';
import { baubleAt, tossFrom, HANDS } from './throws';

/** Draws the Big Top at `time` with `pointer`, and gives back what it wrote and drew. */
function frame(time: number, pointer?: Parameters<typeof attraction.draw>[3]): DrawingLog {
  const canvas = new DrawingLog();
  attraction.draw(canvas as unknown as CanvasRenderingContext2D, 100, time, pointer);
  return canvas;
}

const tapAt = (x: number, y: number) => ({ x, y, down: true, presses: 1 });

describe("Santa's Big Top", () => {
  it('keeps its id, name and big top on the map', () => {
    expect(attraction.id).toBe('big-top');
    expect(attraction.name).toBe("Santa's Big Top");
    expect(attraction.stall).toEqual({
      shape: 'tent',
      roof: 'berry',
      trim: 'snow',
      landmark: 'big-top',
    });
  });

  it('plays a whole act: the show, a catch, a miss, a streak, a drop, the card and again', () => {
    // The elf's own show, inviting a tap.
    expect(frame(0).texts).toContain('Tap to juggle!');
    for (let time = 0; time < 6_000; time += 200) frame(time);

    // A tap starts the act with the score at nothing.
    const start = 10_000;
    expect(frame(start, tapAt(50, 50)).texts).toEqual(
      expect.arrayContaining(['CATCHES', 'SCORE 0', 'Tap each bauble as it falls']),
    );

    // The first bauble, thrown from the left hand 500 ms in, caught as it falls.
    const first = tossFrom(HANDS.x - HANDS.spread, HANDS.y, start + 500, 0, 0);
    const at = first.at + first.dur * 0.8;
    const p = baubleAt(first, at);
    expect(frame(at - 16).calls.length).toBeGreaterThan(0);
    expect(frame(at, tapAt(p.x, p.y)).texts).toContain('+1');

    // A tap on nothing is a miss.
    expect(frame(at + 100, tapAt(2, 98)).texts).toContain('Miss');

    // Nobody catches the rest, so one falls, the crowd reacts, and the card comes up.
    let dropped = at;
    for (let time = at + 200; time < at + 8_000; time += 50) {
      if (frame(time).texts.some((text) => text === 'Oh!' || text === 'Hooray!')) {
        dropped = time;
        break;
      }
    }
    expect(dropped).toBeGreaterThan(at);
    const card = frame(dropped + CARD + 100).texts;
    expect(card).toEqual(expect.arrayContaining(['Bravo!', 'New best of the visit!']));
    expect(card).toContain('Tap to go again');

    // A tap goes again, and the best is kept.
    const again = frame(dropped + CARD + 200, tapAt(50, 50)).texts;
    expect(again).toEqual(expect.arrayContaining(['SCORE 0', '1']));

    // A second, shorter act gasps instead.
    let gasp = false;
    for (let time = dropped + CARD + 300; time < dropped + 20_000 && !gasp; time += 100) {
      gasp = frame(time).texts.includes('Dropped it!');
    }
    expect(gasp).toBe(true);
  });

  it('shows the streak once five catches come in a row', () => {
    const act = newAct(0, true);
    act.streak = EVERY;
    const canvas = new DrawingLog();
    scoreboard(canvas as unknown as CanvasRenderingContext2D, { act, best: 0, record: false });
    expect(canvas.texts).toContain('STREAK ×2');
  });
});
