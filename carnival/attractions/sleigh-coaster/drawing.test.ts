import { describe, expect, it } from 'vitest';
import attraction from './attraction';
import { verdictOf } from './card';
import { advance, type Coaster, newCoaster, TUMBLE } from './game';
import { bandOf, dialOf } from './gauge';
import { clockText } from './hud';
import { AT_STATION } from './physics';
import { poseOf, tumbled } from './pose';
import { HILLS } from './track';

/** Stands in for the canvas and writes down the words drawn, so the coaster can be drawn in Node. */
class DrawingLog {
  readonly words: string[] = [];
  calls = 0;
  fillStyle: unknown = '';
  strokeStyle: unknown = '';
  globalAlpha = 1;
  lineWidth = 1;
  lineCap = 'butt';
  font = '';
  textAlign = 'left';
  textBaseline = 'alphabetic';
  private readonly count = () => {
    this.calls++;
  };
  fillText = (text: string) => {
    this.words.push(text);
  };
  save = this.count;
  restore = this.count;
  translate = this.count;
  scale = this.count;
  rotate = this.count;
  beginPath = this.count;
  closePath = this.count;
  moveTo = this.count;
  lineTo = this.count;
  arc = this.count;
  arcTo = this.count;
  ellipse = this.count;
  quadraticCurveTo = this.count;
  fill = this.count;
  stroke = this.count;
  fillRect = this.count;
  createLinearGradient = () => ({ addColorStop: this.count });
}

/** The words the coaster draws at `time` with `pointer`. */
function wordsAt(time: number, pointer?: Parameters<typeof attraction.draw>[3]): string[] {
  const log = new DrawingLog();
  attraction.draw(log as unknown as CanvasRenderingContext2D, 400, time, pointer);
  return log.words;
}

const hill = HILLS.at(0) ?? { crest: 50, lift: 17, crash: 30 };

describe('the Sleigh-Ride Coaster', () => {
  it('stands on the map as a coaster, as it always has', () => {
    expect(attraction.id).toBe('sleigh-coaster');
    expect(attraction.name).toBe('Sleigh-Ride Coaster');
    expect(attraction.stall).toEqual({
      shape: 'shed',
      roof: 'berry',
      trim: 'gold',
      landmark: 'coaster',
    });
  });

  it('calls people to ride while the elf drives, then plays a run, its card and the next', () => {
    expect(wordsAt(1_000)).toContain('Tap to ride!');
    const riding = wordsAt(1_100, { x: 200, y: 200, down: true, presses: 1 });
    expect(riding).toContain('0:45');
    expect(riding).toContain('Hold to push!');
    expect(wordsAt(1_500, { x: 200, y: 200, down: true, presses: 0 })).toContain(
      'Let go before the top!',
    );
    // Held flat out, it flies off the rails, tumbles into the snow and shows its card.
    let time = 1_500;
    let words: string[] = [];
    while (!words.includes('Off the rails!') && time < 20_000) {
      time += 16;
      words = wordsAt(time, { x: 200, y: 200, down: true, presses: 0 });
    }
    expect(words).toContain('Off the rails!');
    expect(words.some((w) => w.startsWith('Score '))).toBe(true);
    expect(words).not.toContain('Tap to ride again');
    words = wordsAt(time + 1_000);
    expect(words).toContain('Tap to ride again');
    expect(words).toContain('New best of your visit!');
    expect(wordsAt(time + 1_100, { x: 200, y: 200, down: true, presses: 1 })).toContain('0:45');
  });
});

describe('the gauge', () => {
  const reading = (over: number) => ({ over, lift: hill.lift, crash: hill.crash });

  it('reads too slow, roll over, airtime and too fast from the crest’s speeds', () => {
    expect(bandOf(reading(-3))).toBe('slow');
    expect(bandOf(reading(hill.lift / 2))).toBe('roll');
    expect(bandOf(reading((hill.lift + hill.crash) / 2))).toBe('air');
    expect(bandOf(reading(hill.crash + 1))).toBe('off');
    expect(bandOf({ over: 40, lift: Infinity, crash: Infinity })).toBe('off');
  });

  it('turns its needle left to right with the speed, its bands in order, and stops at its ends', () => {
    const { edges } = dialOf(reading(0));
    expect(edges[0]).toBeLessThan(edges[1]);
    expect(edges[1]).toBeLessThan(edges[2]);
    expect(dialOf(reading(-1_000)).needle).toBe(0);
    expect(dialOf(reading(1_000)).needle).toBe(1);
    expect(dialOf(reading(hill.crash)).needle).toBeCloseTo(edges[2]);
    expect(dialOf({ over: 10, lift: Infinity, crash: Infinity }).edges[1]).toBeGreaterThan(0);
  });
});

describe('the sleigh’s pose', () => {
  const coaster = (sleigh: Partial<Coaster['sleigh']>, ended: number | null = null): Coaster => ({
    ...newCoaster(0),
    sleigh: { ...AT_STATION, ...sleigh },
    ended,
  });

  it('tilts up the climbs and down the drops, with hands up only on the steep ones and in the air', () => {
    const start = HILLS.at(0)?.start ?? 0;
    const length = HILLS.at(0)?.length ?? 1;
    const up = poseOf(coaster({ x: start + length / 4 }), 0, 0);
    const down = poseOf(coaster({ x: start + (length * 3) / 4 }), 0, 0);
    expect(up.angle).toBeLessThan(0);
    expect(down.angle).toBeGreaterThan(0);
    expect(up.up).toBe(false);
    expect(down.up).toBe(true);
    const flying = poseOf(coaster({ air: { y: 30, vx: 10, vy: 100 } }), 0, 0);
    expect(flying.up).toBe(true);
    expect(flying.angle).toBeCloseTo(-0.9);
  });

  it('tumbles head over heels into the drift once it has flown off the rails', () => {
    const off = coaster({ x: 60, off: true, air: { y: 20, vx: 30, vy: 0 } }, 1_000);
    expect(tumbled(off, 500)).toBe(0);
    expect(tumbled(off, 1_000 + TUMBLE / 2)).toBeCloseTo(0.5);
    expect(tumbled(off, 9_000)).toBe(1);
    expect(tumbled(coaster({}), 9_000)).toBe(0);
    expect(poseOf(off, 0, 9_000).angle).toBeCloseTo(Math.PI * 3);
    expect(verdictOf(off)).toBe('Off the rails!');
    expect(verdictOf(coaster({}, 1_000))).toBe('Time’s up!');
  });
});

describe('the clock', () => {
  it('shows minutes and seconds, rounded up', () => {
    expect(clockText(45_000)).toBe('0:45');
    expect(clockText(9_001)).toBe('0:10');
    expect(clockText(0)).toBe('0:00');
    expect(clockText(61_000)).toBe('1:01');
  });

  it('stops the run on its card when it runs out', () => {
    const over = advance({ ...newCoaster(0), phase: 'ride', start: -45_000 }, 10, undefined);
    expect(over.phase).toBe('over');
  });
});
