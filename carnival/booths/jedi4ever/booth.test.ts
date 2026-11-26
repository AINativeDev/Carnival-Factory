import { describe, expect, it } from 'vitest';
import booth, { frameSteps, steerFrom, steerWith } from './booth';
import { dialSpeed } from './dashboard';
import { starAt } from './sky';
import { flakeAt } from './snow';
import { segmentDepth } from './street';

/** A canvas that accepts every drawing call and counts the ones made. */
class DrawingLog {
  calls = 0;
  fillStyle = '';
  strokeStyle = '';
  globalAlpha = 1;
  lineWidth = 1;
  font = '';
  textAlign = '';
  textBaseline = '';
  globalCompositeOperation = '';
  createLinearGradient() {
    return { addColorStop: () => undefined };
  }
  createRadialGradient() {
    return { addColorStop: () => undefined };
  }
  private count = () => {
    this.calls += 1;
  };
  save = this.count;
  restore = this.count;
  translate = this.count;
  rotate = this.count;
  scale = this.count;
  transform = this.count;
  beginPath = this.count;
  closePath = this.count;
  moveTo = this.count;
  lineTo = this.count;
  arc = this.count;
  ellipse = this.count;
  roundRect = this.count;
  fill = this.count;
  stroke = this.count;
  fillRect = this.count;
  fillText = this.count;
}

function recordingCanvas() {
  const log = new DrawingLog();
  return { log, ctx: log as unknown as CanvasRenderingContext2D };
}

describe('booth', () => {
  it('is the night run on a food truck', () => {
    expect(booth.id).toBe('jedi4ever');
    expect(booth.stall?.shape).toBe('food-truck');
  });

  it('draws the whole street on its own, frame after frame', () => {
    const { log, ctx } = recordingCanvas();
    for (let time = 0; time < 40_000; time += 50) booth.draw(ctx, 200, time);
    expect(log.calls).toBeGreaterThan(5000);
  });

  it('plays with the pointer, then goes again after a crash with a tap', () => {
    const { ctx } = recordingCanvas();
    let time = 100_000;
    for (let step = 0; step < 600; step += 1) {
      time += 50;
      booth.draw(ctx, 200, time, {
        x: step % 2 === 0 ? 5 : 195,
        y: 100,
        down: true,
        presses: step % 7 === 0 ? 1 : 0,
      });
    }
    expect(time).toBeGreaterThan(0);
  });
});

describe('steerFrom', () => {
  it('follows the pointer across the road', () => {
    const left = { x: 10, y: 50, down: false, presses: 0 };
    expect(steerFrom(left, 100, 0)).toBeLessThan(0);
    expect(steerFrom({ ...left, x: 90 }, 100, 0)).toBeGreaterThan(0);
  });

  it('turns towards the half that was tapped', () => {
    expect(steerFrom({ x: 10, y: 0, down: true, presses: 1 }, 100, 0.1)).toBeLessThan(0);
    expect(steerFrom({ x: 90, y: 0, down: true, presses: 1 }, 100, 0.1)).toBeGreaterThan(0.1);
  });
});

describe('steerWith', () => {
  const none = { target: 0, until: -Infinity, lastX: Number.NaN };

  it("keeps a tap's turn while the finger rests where it tapped", () => {
    const tap = steerWith(none, { x: 55, y: 50, down: true, presses: 1 }, 100, 0.5, 0);
    expect(tap.target).toBeCloseTo(1.05);
    const held = steerWith(tap, { x: 55, y: 50, down: false, presses: 0 }, 100, 0.6, 50);
    expect(held.target).toBeCloseTo(1.05);
    expect(held.until).toBe(1550);
  });

  it('follows the pointer again once it moves', () => {
    const tap = steerWith(none, { x: 55, y: 50, down: true, presses: 1 }, 100, 0.5, 0);
    const moved = steerWith(tap, { x: 10, y: 50, down: false, presses: 0 }, 100, 0.6, 50);
    expect(moved.target).toBeCloseTo(-0.8);
  });
});

describe('frameSteps', () => {
  it('plays every moment of a slow frame in small steps', () => {
    const steps = frameSteps(100);
    expect(steps.reduce((sum, dt) => sum + dt, 0)).toBeCloseTo(0.1);
    expect(Math.max(...steps)).toBeLessThanOrEqual(0.05);
  });

  it('skips a long pause, and nothing before the first frame', () => {
    expect(frameSteps(60_000).reduce((sum, dt) => sum + dt, 0)).toBeCloseTo(1);
    expect(frameSteps(Number.NaN)).toEqual([]);
    expect(frameSteps(-5)).toEqual([]);
  });
});

describe('the little parts', () => {
  it('shows speed in whole km/h', () => {
    expect(dialSpeed(10)).toBe(36);
  });

  it('keeps the stars gentle', () => {
    for (let time = 0; time < 10_000; time += 100) {
      expect(starAt(3, time)).toBeGreaterThan(0.1);
      expect(starAt(3, time)).toBeLessThanOrEqual(0.9);
    }
  });

  it('streaks the snow longer at speed, always on the square', () => {
    const slow = flakeAt(4, 1000, 0, 10);
    const fast = flakeAt(4, 1000, 0, 34);
    expect(fast.streak).toBeGreaterThan(slow.streak);
    expect(fast.y).toBeGreaterThanOrEqual(0);
    expect(fast.y).toBeLessThan(1);
  });

  it('packs the road segments close near the camera', () => {
    expect(segmentDepth(1) - segmentDepth(0)).toBeLessThan(segmentDepth(44) - segmentDepth(43));
  });
});
