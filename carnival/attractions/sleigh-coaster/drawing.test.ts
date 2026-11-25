import { describe, expect, it } from 'vitest';
import attraction from './attraction';
import { theme } from '../../../src/northpole/theme';
import { CHEERS } from './ride';
import { RIDE } from './track';

const { colors } = theme;

/**
 * Stands in for the canvas and writes down every call with the colour and
 * strength it paints in, so the coaster can be drawn in Node.
 */
class DrawingLog {
  readonly calls: string[] = [];
  fillStyle: unknown = '';
  strokeStyle: unknown = '';
  globalAlpha = 1;
  private note(name: string) {
    return (...args: unknown[]) => {
      const paint = [this.fillStyle, this.strokeStyle, this.globalAlpha].map(plain);
      this.calls.push(`${name}(${args.map(plain).join()}) ${paint.join()}`);
    };
  }
  save = this.note('save');
  restore = this.note('restore');
  translate = this.note('translate');
  scale = this.note('scale');
  rotate = this.note('rotate');
  beginPath = this.note('beginPath');
  closePath = this.note('closePath');
  moveTo = this.note('moveTo');
  lineTo = this.note('lineTo');
  quadraticCurveTo = this.note('quadraticCurveTo');
  bezierCurveTo = this.note('bezierCurveTo');
  arc = this.note('arc');
  ellipse = this.note('ellipse');
  rect = this.note('rect');
  fill = this.note('fill');
  stroke = this.note('stroke');
  fillRect = this.note('fillRect');
  strokeRect = this.note('strokeRect');
  fillText = this.note('fillText');
  setLineDash = this.note('setLineDash');
  clip = this.note('clip');
  createLinearGradient = () => ({ addColorStop: () => undefined });
  createRadialGradient = () => ({ addColorStop: () => undefined });
}

/** A value as text, and anything else, such as a gradient, as its kind. */
function plain(value: unknown): string {
  return typeof value === 'number' || typeof value === 'string' ? String(value) : typeof value;
}

/** Every canvas call the coaster makes at `time` with `pointer`. */
function drawn(time: number, pointer?: Parameters<typeof attraction.draw>[3]): string[] {
  const log = new DrawingLog();
  attraction.draw(log as unknown as CanvasRenderingContext2D, 100, time, pointer);
  return log.calls;
}

describe('the Sleigh-Ride Coaster', () => {
  it('stands on the map as a coaster', () => {
    expect(attraction.id).toBe('sleigh-coaster');
    expect(attraction.stall?.landmark).toBe('coaster');
  });

  it('launches the sleigh when tapped inside, and not again while it rides', () => {
    const tap = { x: 50, y: 50, down: true, presses: 1 };
    const waiting = drawn(100_000);
    expect(drawn(100_000)).toEqual(waiting);
    expect(drawn(100_000, tap)).not.toEqual(waiting);
    const midway = drawn(100_000 + RIDE * 0.62);
    expect(drawn(100_000 + RIDE * 0.62, tap)).toEqual(midway);
    expect(midway).not.toEqual(waiting);
    // Back at the station, waiting for the next tap, with one cheer on the meter.
    const back = drawn(100_000 + RIDE * 2);
    expect(back).toEqual(drawn(100_000 + RIDE * 2, { x: 50, y: 50, down: false, presses: 0 }));
    expect(back).not.toEqual(drawn(100_000 + RIDE * 2 + 1, tap));
  });

  it('lights one more bulb with each launch, and its star once five fill it', () => {
    const tap = { x: 50, y: 50, down: true, presses: 1 };
    const lit: number[] = [];
    for (let n = 0; n < CHEERS; n++) {
      const time = 300_000 + n * RIDE * 2;
      drawn(time, tap);
      lit.push(
        drawn(time + RIDE * 0.5).filter((call) => call.startsWith(`fill() ${colors.gold}`)).length,
      );
    }
    // Wherever the meter was, five launches go once round it: one bulb more each, and the star.
    const fewest = Math.min(...lit);
    expect(lit.map((count) => count - fewest).sort()).toEqual([0, 1, 2, 3, 5]);
  });
});
