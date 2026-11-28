import { describe, expect, it } from 'vitest';
import theAcademy from './attraction';
import { bugPlace } from './bugs';
import { ACTION, type Box, CHOICES, LIVE_NEXT } from './layout';
import { BIG_NUDGES, QUIET_NUDGES } from './nudges';
import { STEPS } from './steps';

const SIZE = 600;
const NOWHERE: Box = { x: 0, y: 0, w: 0, h: 0 };

/** A stand-in for the canvas that draws nothing and keeps the words it was given. */
class QuietSlate {
  fillStyle: unknown = '';
  strokeStyle: unknown = '';
  globalAlpha = 1;
  lineWidth = 1;
  lineCap = 'butt';
  lineJoin = 'miter';
  font = '';
  textAlign = 'start';
  textBaseline = 'alphabetic';
  count = 0;
  texts: string[] = [];
  fillText(text: string) {
    this.texts.push(text);
  }
  measureText(text: string) {
    return { width: text.length };
  }
  createLinearGradient() {
    return { addColorStop: () => undefined };
  }
  createRadialGradient() {
    return { addColorStop: () => undefined };
  }
  fill() {
    this.count++;
  }
  fillRect() {
    this.count++;
  }
  save() {}
  restore() {}
  translate() {}
  rotate() {}
  scale() {}
  transform() {}
  beginPath() {}
  closePath() {}
  moveTo() {}
  lineTo() {}
  quadraticCurveTo() {}
  arc() {}
  arcTo() {}
  ellipse() {}
  rect() {}
  roundRect() {}
  clip() {}
  stroke() {}
  setLineDash() {}
}

/** A tap on the middle of `box`, in the square's pixels. */
const tapOn = (box: Box, presses = 1) => ({
  x: ((box.x + box.w / 2) / 100) * SIZE,
  y: ((box.y + box.h / 2) / 100) * SIZE,
  down: presses > 0,
  presses,
});

describe('The Academy', () => {
  it('keeps its id, its name and its schoolhouse on the map', () => {
    expect(theAcademy.id).toBe('the-academy');
    expect(theAcademy.name).toBe('The Academy');
    expect(theAcademy.stall).toEqual({
      shape: 'barn',
      roof: 'berry',
      trim: 'cream',
      landmark: 'schoolhouse',
    });
  });

  it('is tapped through every step, drawing each beat as it plays, and asks the page only when a nudge is tapped', () => {
    const slate = new QuietSlate();
    const ctx = slate as unknown as CanvasRenderingContext2D;
    let time = 0;
    const draw = (pointer?: ReturnType<typeof tapOn>) => {
      theAcademy.draw(ctx, SIZE, (time += 350), pointer);
    };
    for (let n = 0; n < 20; n++) draw();
    expect(slate.texts).toContain('Tap to start ▶');
    // The first screen has no Back, not even a greyed-out one.
    expect(slate.texts).not.toContain('◀ Back');
    expect(theAcademy.ask?.()).toBeUndefined();
    draw(tapOn(QUIET_NUDGES[0]?.box ?? NOWHERE));
    expect(theAcademy.ask?.()).toEqual({ open: 0 });
    expect(theAcademy.ask?.()).toBeUndefined();
    draw(tapOn(ACTION));
    draw(tapOn(CHOICES[1] ?? NOWHERE, 0));
    draw(tapOn(CHOICES[1] ?? NOWHERE));
    draw(tapOn(CHOICES[2] ?? NOWHERE));
    for (let step = 3; step < STEPS.length - 1; step++) {
      const beats = STEPS[step]?.beats.length ?? 1;
      for (let beat = 0; beat < beats; beat++) {
        for (let n = 0; n < 6; n++) draw({ ...tapOn(ACTION, 0), down: false });
        if (STEPS[step]?.kind === 'checks' && beat === 0) {
          const bug = bugPlace(0, time + 350);
          draw({ x: (bug.x / 100) * SIZE, y: (bug.y / 100) * SIZE, down: true, presses: 1 });
        } else draw(tapOn(STEPS[step]?.kind === 'live' ? LIVE_NEXT : ACTION));
      }
    }
    expect(slate.texts).toContain('Cocoa volcano');
    expect(slate.texts).toContain('ACCEPTED');
    expect(slate.texts).toContain('SPLAT!');
    expect(slate.texts).toContain('Nothing hidden in the text');
    expect(slate.texts).toContain('Want a real one? Ask for a booth ↗');
    expect(slate.texts).toContain('Keep in touch:');
    expect(slate.texts).toContain('Loops in tessl.json');
    expect(theAcademy.ask?.()).toBeUndefined();
    draw(tapOn(ACTION));
    expect(slate.texts.at(-1)).toBeDefined();
    expect(slate.count).toBeGreaterThan(1_000);
  });

  it('opens the big nudges from the map card', () => {
    const ctx = new QuietSlate() as unknown as CanvasRenderingContext2D;
    let time = 500_000;
    const draw = (pointer?: ReturnType<typeof tapOn>) => {
      theAcademy.draw(ctx, SIZE, (time += 300), pointer);
    };
    draw(tapOn(ACTION));
    draw(tapOn(CHOICES[0] ?? NOWHERE));
    draw(tapOn(CHOICES[0] ?? NOWHERE));
    const toLive = STEPS.slice(3, -2).reduce((sum, step) => sum + step.beats.length, 0);
    for (let n = 0; n < toLive; n++) draw(tapOn(ACTION));
    time += 1_000;
    draw(tapOn(BIG_NUDGES[0]?.box ?? NOWHERE));
    // The booth form, filled in with the Penguin DJ in the diorama look.
    expect(theAcademy.ask?.()).toEqual({ open: 5 });
    draw(tapOn(BIG_NUDGES[2]?.box ?? NOWHERE));
    expect(theAcademy.ask?.()).toEqual({ visit: 'the-factory' });
    draw(tapOn(BIG_NUDGES[5]?.box ?? NOWHERE));
    expect(theAcademy.ask?.()).toEqual({ open: 4 });
  });

  it('is played with keys too: → on, ← back, and every step still draws', () => {
    const slate = new QuietSlate();
    const ctx = slate as unknown as CanvasRenderingContext2D;
    let time = 900_000;
    const press = (key: 'left' | 'right') => {
      for (let n = 0; n < 4; n++) theAcademy.draw(ctx, SIZE, (time += 300), undefined, []);
      theAcademy.draw(ctx, SIZE, (time += 300), undefined, [key]);
    };
    for (let n = 0; n < 24; n++) press('right');
    expect(slate.texts).toContain('Light a lamp');
    expect(slate.texts).toContain('◀ Back');
    press('left');
    expect(slate.texts.at(-1)).toBeDefined();
    expect(theAcademy.ask?.()).toBeUndefined();
  });
});
