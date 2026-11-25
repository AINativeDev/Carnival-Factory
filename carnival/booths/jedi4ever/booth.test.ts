import { describe, expect, it } from 'vitest';
import booth from './booth';

/** Stands in for the canvas and writes down what was drawn on it, so the scene can be drawn in Node. */
class DrawingLog {
  readonly calls: string[] = [];
  private note(name: string, args: readonly unknown[]) {
    this.calls.push(`${name}(${args.map(String).join(',')})`);
  }
  set fillStyle(value: string) {
    this.note('fillStyle', [value]);
  }
  set strokeStyle(value: string) {
    this.note('strokeStyle', [value]);
  }
  set globalAlpha(value: number) {
    this.note('globalAlpha', [value]);
  }
  set lineWidth(value: number) {
    this.note('lineWidth', [value]);
  }
  set lineCap(value: string) {
    this.note('lineCap', [value]);
  }
  set lineJoin(value: string) {
    this.note('lineJoin', [value]);
  }
  set font(value: string) {
    this.note('font', [value]);
  }
  set textAlign(value: string) {
    this.note('textAlign', [value]);
  }
  set textBaseline(value: string) {
    this.note('textBaseline', [value]);
  }
  save = (...args: unknown[]) => {
    this.note('save', args);
  };
  restore = (...args: unknown[]) => {
    this.note('restore', args);
  };
  translate = (...args: unknown[]) => {
    this.note('translate', args);
  };
  scale = (...args: unknown[]) => {
    this.note('scale', args);
  };
  rotate = (...args: unknown[]) => {
    this.note('rotate', args);
  };
  beginPath = (...args: unknown[]) => {
    this.note('beginPath', args);
  };
  closePath = (...args: unknown[]) => {
    this.note('closePath', args);
  };
  moveTo = (...args: unknown[]) => {
    this.note('moveTo', args);
  };
  lineTo = (...args: unknown[]) => {
    this.note('lineTo', args);
  };
  quadraticCurveTo = (...args: unknown[]) => {
    this.note('quadraticCurveTo', args);
  };
  arc = (...args: unknown[]) => {
    this.note('arc', args);
  };
  ellipse = (...args: unknown[]) => {
    this.note('ellipse', args);
  };
  fill = (...args: unknown[]) => {
    this.note('fill', args);
  };
  stroke = (...args: unknown[]) => {
    this.note('stroke', args);
  };
  fillRect = (...args: unknown[]) => {
    this.note('fillRect', args);
  };
  strokeRect = (...args: unknown[]) => {
    this.note('strokeRect', args);
  };
  fillText = (...args: unknown[]) => {
    this.note('fillText', args);
  };
}

/** What the booth draws at `time` with `pointer`, `size` across. */
function drawn(size: number, time: number, pointer?: Parameters<typeof booth.draw>[3]): string[] {
  const canvas = new DrawingLog();
  booth.draw(canvas as unknown as CanvasRenderingContext2D, size, time, pointer);
  return canvas.calls;
}

describe("Santa's Toy Factory", () => {
  it('keeps its id, name and log cabin stall', () => {
    expect(booth.id).toBe('jedi4ever');
    expect(booth.name).toBe("Santa's Toy Factory");
    expect(booth.stall).toEqual({ shape: 'cabin', roof: 'berry', trim: 'gold' });
  });

  it('draws the same scene for the same moment', () => {
    const first = drawn(200, 4_321);
    expect(first.length).toBeGreaterThan(100);
    expect(drawn(200, 4_321)).toEqual(first);
  });

  it('swirls the globe when tapped, and waves a penguin under the pointer', () => {
    const still = drawn(100, 50_000);
    expect(drawn(100, 50_000, { x: 60, y: 76, down: true, presses: 1 })).not.toEqual(still);
    const away = drawn(100, 60_000);
    expect(drawn(100, 60_000, { x: 19, y: 87, down: false, presses: 0 })).not.toEqual(away);
  });

  it('spins the logo while a press on it is held, and slows once let go', () => {
    // The logo is the one thing turned about the plaque's middle.
    const turn = (calls: string[]) =>
      Number(calls[calls.indexOf('translate(89.5,42)') + 1]?.slice(7, -1));
    const press = { x: 89, y: 42, down: true, presses: 1 };
    const held = { x: 89, y: 42, down: true, presses: 0 };
    drawn(100, 70_000);
    drawn(100, 70_016, press);
    for (let time = 70_032; time < 71_000; time += 16) drawn(100, time, held);
    const spinning = turn(drawn(100, 71_016, held));
    expect(turn(drawn(100, 71_032, held))).toBeGreaterThan(spinning);
    drawn(100, 71_048);
    const slowing = turn(drawn(100, 71_064)) - turn(drawn(100, 71_048));
    expect(slowing).toBeLessThan(turn(drawn(100, 71_032, held)) - spinning);
    for (let time = 71_080; time < 76_000; time += 16) drawn(100, time);
    expect(turn(drawn(100, 76_016))).toBe(turn(drawn(100, 76_032)));
  });
});
