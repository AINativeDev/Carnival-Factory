import { describe, expect, it } from 'vitest';
import cocoaStand from './attraction';
import {
  DROP_MS,
  FILL_MS,
  FRESH,
  RISE,
  SERVE_MS,
  TOPPINGS,
  cocoaStep,
  dropping,
  hint,
  served,
  steam,
  type Cocoa,
} from './cocoa';

describe('steam', () => {
  it('rises from the cup and starts again', () => {
    expect(steam(0, 0).rise).toBe(0);
    expect(steam(0, RISE / 2).rise).toBeCloseTo(0.5);
    expect(steam(0, RISE).rise).toBeCloseTo(0);
  });

  it('stays between the cup and gone, and curls both ways', () => {
    for (let time = 0; time < RISE * 2; time += 100) {
      const { rise, curl } = steam(3, time);
      expect(rise).toBeGreaterThanOrEqual(0);
      expect(rise).toBeLessThan(1);
      expect(Math.abs(curl)).toBeLessThanOrEqual(1);
    }
  });

  it('gives each wisp its own moment', () => {
    expect(steam(1, 0).rise).not.toBeCloseTo(steam(0, 0).rise);
  });
});

/** Holds the pointer down from `from` to `to`, a frame every 16 ms. */
function hold(cocoa: Cocoa, from: number, to: number): Cocoa {
  let now = cocoaStep(cocoa, from, { down: true, presses: 1 });
  for (let time = from + 16; time <= to; time += 16) {
    now = cocoaStep(now, time, { down: true, presses: 0 });
  }
  return now;
}

const tap = (cocoa: Cocoa, time: number) => cocoaStep(cocoa, time, { down: false, presses: 1 });

describe('making a cup of cocoa', () => {
  it('starts with an empty cup and none served', () => {
    expect(FRESH.fill).toBe(0);
    expect(FRESH.toppings).toBe(0);
    expect(FRESH.served).toBe(0);
  });

  it('fills the cup while the pointer is held, and stops when let go', () => {
    const half = hold(FRESH, 0, FILL_MS / 2);
    expect(half.fill).toBeGreaterThan(0.4);
    expect(half.fill).toBeLessThan(0.6);
    const later = cocoaStep(half, FILL_MS, undefined);
    expect(later.fill).toBe(half.fill);
  });

  it('never fills past the brim', () => {
    expect(hold(FRESH, 0, FILL_MS * 2).fill).toBe(1);
  });

  it("doesn't pour a jump in time, such as after the frame was away", () => {
    const first = cocoaStep(FRESH, 0, { down: true, presses: 1 });
    const later = cocoaStep(first, 60_000, { down: true, presses: 0 });
    expect(later.fill).toBeLessThan(0.1);
  });

  it('drops nothing in while the cup is still filling', () => {
    expect(tap(hold(FRESH, 0, 200), 300).toppings).toBe(0);
  });

  it('drops in the toppings in order, one a tap, once the cup is full', () => {
    let cup = hold(FRESH, 0, FILL_MS + 100);
    const names: string[] = [];
    for (let n = 1; n <= TOPPINGS.length; n++) {
      cup = tap(cup, FILL_MS + 200 * n);
      names.push(TOPPINGS[cup.toppings - 1] ?? '');
    }
    expect(names).toEqual(['marshmallows', 'cream', 'candy cane']);
  });

  it('counts every tap in one frame, up to the last topping', () => {
    const full = hold(FRESH, 0, FILL_MS + 100);
    const cup = cocoaStep(full, FILL_MS + 200, { down: false, presses: 2 });
    expect(cup.toppings).toBe(2);
    expect(cocoaStep(full, FILL_MS + 200, { down: false, presses: 9 }).toppings).toBe(3);
  });

  it('serves the cup with its last topping, then brings a fresh one', () => {
    let cup = hold(FRESH, 0, FILL_MS + 100);
    for (let n = 1; n <= TOPPINGS.length; n++) cup = tap(cup, FILL_MS + 200 * n);
    const at = FILL_MS + 200 * TOPPINGS.length;
    expect(cup.served).toBe(1);
    expect(served(cup, at + SERVE_MS / 2)).toBeCloseTo(0.5);
    // Taps while it's carried away change nothing.
    const busy = tap(cup, at + 100);
    expect(busy).toEqual({ ...cup, last: at + 100 });
    const next = cocoaStep(cup, at + SERVE_MS, undefined);
    expect(next.fill).toBe(0);
    expect(next.toppings).toBe(0);
    expect(next.served).toBe(1);
    expect(served(next, at + SERVE_MS)).toBe(0);
  });

  it("doesn't pour while the cup is carried away", () => {
    let cup = hold(FRESH, 0, FILL_MS + 100);
    for (let n = 1; n <= TOPPINGS.length; n++) cup = tap(cup, FILL_MS + 200 * n);
    const at = FILL_MS + 200 * TOPPINGS.length;
    expect(hold(cup, at + 16, at + 200).fill).toBe(1);
  });
});

describe('what the stand shows', () => {
  it('drops each topping in from above', () => {
    const full = hold(FRESH, 0, FILL_MS + 100);
    const at = FILL_MS + 200;
    const topped = tap(full, at);
    expect(dropping(full, at)).toBe(0);
    expect(dropping(topped, at)).toBe(1);
    expect(dropping(topped, at + DROP_MS / 2)).toBeCloseTo(0.5);
    expect(dropping(topped, at + DROP_MS)).toBe(0);
  });

  it('tells the visitor what to do next', () => {
    let cup = FRESH;
    const lines = [hint(cup)];
    cup = hold(cup, 0, FILL_MS + 100);
    lines.push(hint(cup));
    for (let n = 1; n <= TOPPINGS.length; n++) {
      cup = tap(cup, FILL_MS + 200 * n);
      lines.push(hint(cup));
    }
    expect(lines).toEqual([
      'Hold to pour the cocoa',
      'Tap to add marshmallows',
      'Tap to add cream',
      'Tap to add candy cane',
      'Served! Here comes another cup',
    ]);
  });
});

describe('the drawing', () => {
  it('pours while held, then counts the served cup on the chalkboard', () => {
    let texts: unknown[] = [];
    const gradient = { addColorStop: () => undefined };
    const noop = () => undefined;
    const ctx = {
      ...Object.fromEntries(
        [
          'save',
          'restore',
          'scale',
          'translate',
          'transform',
          'fillRect',
          'beginPath',
          'closePath',
          'arc',
          'ellipse',
          'fill',
          'stroke',
          'clip',
          'moveTo',
          'lineTo',
          'setLineDash',
        ].map((name) => [name, noop]),
      ),
      fillText: (text: unknown) => texts.push(text),
      createLinearGradient: () => gradient,
      createRadialGradient: () => gradient,
    } as unknown as CanvasRenderingContext2D;
    const frame = (time: number, down: boolean, presses: number) => {
      texts = [];
      cocoaStand.draw(ctx, 200, time, { x: 100, y: 100, down, presses });
    };

    frame(0, false, 0);
    expect(texts).toEqual(expect.arrayContaining(['Hold to pour the cocoa', 'Cups served', '0']));
    for (let time = 16; time <= FILL_MS + 200; time += 16) frame(time, true, time === 16 ? 1 : 0);
    expect(texts).toContain('Tap to add marshmallows');
    frame(FILL_MS + 300, false, TOPPINGS.length);
    expect(texts).toEqual(expect.arrayContaining(['Served! Here comes another cup', '1']));
    frame(FILL_MS + 300 + SERVE_MS, false, 0);
    expect(texts).toContain('Hold to pour the cocoa');
  });
});
