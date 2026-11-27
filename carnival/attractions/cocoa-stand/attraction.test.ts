import { describe, expect, it } from 'vitest';
import attraction from './attraction';
import { BUTTONS } from './buttons';
import { DrawingLog } from './drawing-log';
import { orderFor } from './orders';
import { ARRIVE, CARD, STRIKES } from './rush';

/** Draws the stand at `time` with `pointer`, in a square 100 across, and gives back what it drew. */
function frame(time: number, pointer?: Parameters<typeof attraction.draw>[3]): DrawingLog {
  const canvas = new DrawingLog();
  attraction.draw(canvas as unknown as CanvasRenderingContext2D, 100, time, pointer);
  return canvas;
}

/** A tap on `item`'s button. */
function tapItem(item: number) {
  const b = BUTTONS.at(item);
  return { x: (b?.x ?? 0) + 3, y: (b?.y ?? 0) + 3, down: true, presses: 1 };
}

describe('Hot Cocoa Stand', () => {
  it('keeps its id, name and cocoa hut on the map', () => {
    expect(attraction.id).toBe('cocoa-stand');
    expect(attraction.name).toBe('Hot Cocoa Stand');
    expect(attraction.stall).toEqual({
      shape: 'kiosk',
      roof: 'cocoa',
      trim: 'cream',
      landmark: 'cocoa-hut',
    });
  });

  it('plays a whole shift: the show, a cup served, a spill, three walk-offs, the card and again', () => {
    // The stand's own elf serving, inviting a tap.
    expect(frame(0).texts).toEqual(
      expect.arrayContaining(['COCOA RUSH', 'Tap to open the stand!']),
    );
    for (let time = 0; time < 8_000; time += 100) frame(time);

    // A tap opens the stand for the visitor.
    const start = 10_000;
    expect(frame(start, { x: 50, y: 50, down: true, presses: 1 }).texts).toContain('TIPS');

    // The first order built right earns a tip and a thank-you.
    let time = start + ARRIVE;
    frame(time - 200);
    for (const item of orderFor(0)) {
      frame(time, tapItem(item));
      time += 100;
    }
    const thanks = frame(time + 200).texts;
    expect(thanks).toContain('Thanks!');
    expect(thanks.some((text) => text.startsWith('+'))).toBe(true);

    // A wrong first press spills the cup.
    time += ARRIVE + 100;
    const wrong = orderFor(1).at(0) === 0 ? 1 : 0;
    expect(frame(time, tapItem(wrong)).texts).toContain('Oops!');

    // Nobody serves the rest, so they walk off cross, and the third ends the shift.
    let hmphs = 0;
    let cross = false;
    let ended = -1;
    for (let t = time + 100; t < time + 120_000 && ended < 0; t += 50) {
      const texts = frame(t).texts;
      if (texts.includes('Hmph!') && !cross) hmphs += 1;
      cross = texts.includes('Hmph!');
      if (texts.includes('Shift over!')) ended = t;
    }
    expect(hmphs).toBe(STRIKES);
    const card = frame(ended + CARD).texts;
    expect(card).toEqual(expect.arrayContaining(['Best tips of the visit!', 'Tap to open again']));

    // A tap opens the stand again, and the best is kept.
    const again = frame(ended + CARD + 100, { x: 50, y: 50, down: true, presses: 1 }).texts;
    expect(again).toEqual(expect.arrayContaining(['TIPS', '0']));
  });
});
