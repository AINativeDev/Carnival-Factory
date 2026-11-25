import { describe, expect, it } from 'vitest';
import attraction from './attraction';
import { theme } from '../../../src/northpole/theme';
import { CHEERS } from './ride';
import { drawCheerMeter } from './cheer-meter';
import { RIDE, sleighPose } from './track';

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
    expect(sleighAt(waiting)).toEqual(placed(0));
    expect(drawn(100_000)).toEqual(waiting);
    // The tap launches it: the sleigh leaves the station and follows the track.
    expect(drawn(100_000, tap)).not.toEqual(waiting);
    const midway = drawn(100_000 + RIDE * 0.62);
    expect(sleighAt(midway)).toEqual(placed(RIDE * 0.62));
    expect(sleighAt(midway)).not.toEqual(sleighAt(waiting));
    // A tap while it rides changes nothing.
    expect(drawn(100_000 + RIDE * 0.62, tap)).toEqual(midway);
    // Back at the station, waiting for the next tap.
    const back = drawn(100_000 + RIDE * 2);
    expect(sleighAt(back)).toEqual(placed(0));
    expect(back).toEqual(drawn(100_000 + RIDE * 2, { x: 50, y: 50, down: false, presses: 0 }));
    expect(sleighAt(drawn(100_000 + RIDE * 2.5, tap))).toEqual(placed(0));
    expect(sleighAt(drawn(100_000 + RIDE * 2.75))).toEqual(placed(RIDE * 0.25));
  });

  it('lights one more bulb with each launch, and its star once five fill it', () => {
    const tap = { x: 50, y: 50, down: true, presses: 1 };
    const shown: number[] = [];
    for (let n = 0; n <= CHEERS; n++) {
      const time = 300_000 + n * RIDE * 2;
      drawn(time, tap);
      shown.push(cheersOn(drawn(time + RIDE * 0.5)));
    }
    // In launch order, one more each time, and a full meter starts again from one.
    shown.slice(1).forEach((cheers, n) => {
      expect(cheers).toBe(((shown[n] ?? 0) % CHEERS) + 1);
    });
    expect(shown).toContain(CHEERS);
  });

  it('draws the meter with as many bulbs lit as cheers, and the star only when full', () => {
    for (let cheers = 0; cheers <= CHEERS; cheers++) {
      const log = new DrawingLog();
      drawCheerMeter(log as unknown as CanvasRenderingContext2D, cheers, 0);
      expect(goldFills(log.calls)).toBe(cheers < CHEERS ? cheers : CHEERS + 1);
    }
  });
});

/** How many shapes are filled in gold: the lit bulbs, and the star when the meter is full. */
function goldFills(calls: string[]): number {
  return calls.filter((call) => call.startsWith(`fill() ${colors.gold}`)).length;
}

/** How full the drawn cheer meter is, read off its gold: five bulbs and the star are full. */
function cheersOn(calls: string[]): number {
  return Math.min(goldFills(calls), CHEERS);
}

/**
 * Where the sleigh was drawn: the move to its pose just before it turns to the
 * track's tilt, which only the sleigh does.
 */
function sleighAt(calls: string[]): string | undefined {
  const turn = calls.findIndex((call) => call.startsWith('rotate('));
  return calls[turn - 1]?.split(' ')[0];
}

/** The move the sleigh's drawing makes when it is `time` into a ride. */
function placed(time: number): string {
  const pose = sleighPose(time, 3);
  return `translate(${String(pose.x)},${String(pose.y)})`;
}
