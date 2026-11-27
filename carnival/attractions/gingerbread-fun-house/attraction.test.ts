import { describe, expect, it } from 'vitest';
import type { SquarePointer } from '../../../src/northpole/square';
import attraction, { CHASE, gumdropLit } from './attraction';
import { MIRRORS, PATH, REACH, reflection, STROLL, strollAt } from './mirrors';
import { SLOTS } from './slots';

const litAt = (time: number) => Array.from({ length: 9 }, (_, i) => gumdropLit(i, 9, time));

describe('gumdropLit', () => {
  it('keeps all but two lights lit', () => {
    for (let time = 0; time < CHASE; time += 100) {
      expect(litAt(time).filter(Boolean)).toHaveLength(7);
    }
  });

  it('runs the dark gap along the string', () => {
    expect(litAt(0).slice(0, 2)).toEqual([false, true]);
    expect(litAt(CHASE / 2).indexOf(false)).toBeGreaterThan(2);
  });

  it('starts again after a full chase', () => {
    expect(litAt(CHASE)).toEqual(litAt(0));
  });
});

describe('the fun-house mirrors', () => {
  it('strolls the elf across the snow and back, slowing to turn', () => {
    expect(strollAt(0).gx).toBeCloseTo(PATH.from);
    expect(strollAt(STROLL / 2).gx).toBeCloseTo(PATH.to);
    expect(strollAt(STROLL / 4).facing).toBe(1);
    expect(strollAt((STROLL * 3) / 4).facing).toBe(-1);
    expect(strollAt(STROLL + 1234).gx).toBeCloseTo(strollAt(1234).gx);
    expect(strollAt(STROLL + 1234).facing).toBe(strollAt(1234).facing);
    for (let time = 0; time < STROLL; time += 200) {
      const { gx } = strollAt(time);
      expect(gx).toBeGreaterThanOrEqual(PATH.from - 1e-9);
      expect(gx).toBeLessThanOrEqual(PATH.to + 1e-9);
    }
  });

  it('shows the elf only in a mirror it is passing, stretched its own way', () => {
    const [tall, wide] = MIRRORS;
    expect(reflection(tall, tall.gx + REACH, 0).shown).toBe(0);
    expect(reflection(tall, tall.gx, 0).shown).toBe(1);
    expect(reflection(tall, tall.gx + REACH / 2, 0).shown).toBeCloseTo(0.5);
    for (let time = 0; time < 5000; time += 250) {
      const inTall = reflection(tall, tall.gx, time);
      const inWide = reflection(wide, wide.gx, time);
      expect(inTall.tall).toBeGreaterThan(inTall.wide);
      expect(inWide.wide).toBeGreaterThan(inWide.tall);
    }
  });
});

/** A stand-in canvas that takes every call the fun house makes, keeps its words and draws nothing. */
class DrawingLog {
  texts: string[] = [];
  globalAlpha = 1;
  fillStyle = '';
  strokeStyle = '';
  lineWidth = 1;
  lineCap = '';
  lineJoin = '';
  font = '';
  textAlign = '';
  textBaseline = '';
  fillText(text: string) {
    this.texts.push(text);
  }
  save() {}
  restore() {}
  scale() {}
  translate() {}
  rotate() {}
  fillRect() {}
  beginPath() {}
  closePath() {}
  moveTo() {}
  lineTo() {}
  arc() {}
  arcTo() {}
  ellipse() {}
  quadraticCurveTo() {}
  fill() {}
  stroke() {}
  clip() {}
  createLinearGradient() {
    return { addColorStop() {} };
  }
  createRadialGradient() {
    return { addColorStop() {} };
  }
}

describe('the drawing', () => {
  const log = new DrawingLog();
  const ctx = log as unknown as CanvasRenderingContext2D;
  const draw = (time: number, pointer?: SquarePointer) => {
    log.texts.length = 0;
    attraction.draw(ctx, 200, time, pointer);
    return log.texts.join(' | ');
  };

  it('keeps its id, name and the gingerbread house landmark', () => {
    expect(attraction.id).toBe('gingerbread-fun-house');
    expect(attraction.name).toBe('Gingerbread Fun House');
    expect(attraction.stall).toEqual({
      shape: 'cabin',
      roof: 'gingerbread',
      trim: 'snow',
      landmark: 'gingerbread-house',
    });
  });

  it('plays its own demo, then a game a tap starts, until a wrong note ends it', () => {
    expect(draw(0)).toContain('Icing Echo');
    // The demo plays and echoes its tunes as the elf strolls past the mirrors.
    for (let time = 0; time < STROLL * 2; time += 100) draw(time);
    const start = STROLL * 2;
    expect(draw(start, { x: 5, y: 190, down: true, presses: 1 })).toContain('Watch the house');
    // Taps while the house plays only ripple.
    draw(start + 300, { x: 5, y: 190, down: true, presses: 1 });
    let time = start + 400;
    while (!draw(time).includes('Your turn')) time += 100;
    // Tapping off the notes is no wrong note, but a tap on the wrong one is.
    expect(draw(time, { x: 5, y: 190, down: true, presses: 1 })).toContain('Your turn: 0');
    // Tapping the places in turn soon plays a wrong note, and the icing cracks.
    let said = '';
    for (let n = 0; n < 400 && !said.includes('cracked'); n++) {
      time += 100;
      const at = SLOTS.at(n % 4)?.at ?? { x: 0, y: 0 };
      said = draw(time, { x: at.x * 2, y: at.y * 2, down: true, presses: 1 });
      if (!said.includes('cracked')) said = draw((time += 100));
    }
    expect(said).toContain('cracked');
    for (let t = time; t < time + 3000; t += 100) draw(t);
    expect(draw(time + 3000)).toContain('Tap to go again');
    expect(draw(time + 3100, { x: 5, y: 190, down: true, presses: 1 })).toContain(
      'Watch the house',
    );
  });
});
