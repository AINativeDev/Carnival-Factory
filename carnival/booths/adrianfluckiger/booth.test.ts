import { describe, expect, it } from 'vitest';
import booth from './booth';
import { hasDog, lerp, momentAt, SPOTS, TURN_SECONDS } from './story';

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
  beginPath = this.count;
  closePath = this.count;
  moveTo = this.count;
  lineTo = this.count;
  arc = this.count;
  ellipse = this.count;
  roundRect = this.count;
  rect = this.count;
  quadraticCurveTo = this.count;
  bezierCurveTo = this.count;
  fill = this.count;
  stroke = this.count;
  fillRect = this.count;
  strokeRect = this.count;
  fillText = this.count;
  clip = this.count;
  setLineDash = this.count;
}

const at = (seconds: number) => momentAt(seconds * 1000);

describe('Visit Santa', () => {
  it('lerp stays between its ends', () => {
    expect(lerp(0, 10, -1)).toBe(0);
    expect(lerp(0, 10, 2)).toBe(10);
    expect(lerp(0, 10, 0.5)).toBe(5);
  });

  it('has the elf walk out to the queue and back with the child', () => {
    expect(at(0).elfX).toBe(SPOTS.elfHome);
    expect(at(2.5).elfX).toBe(SPOTS.queueHead);
    expect(at(1).elfLeading).toBe(false);
    expect(at(3.5).elfLeading).toBe(true);
    expect(at(5.5).elfX).toBe(SPOTS.elfHome);
  });

  it('seats the child on the lap, then sends them to the reindeer and out', () => {
    expect(at(2).child.sitting).toBe(false);
    expect(at(3.5).child.sitting).toBe(false);
    expect(at(6).child.sitting).toBe(true);
    expect(at(6).child.x).toBe(SPOTS.lap);
    expect(at(9.5).child.sitting).toBe(false);
    expect(at(11.9).child.x).toBeLessThan(SPOTS.reindeer);
  });

  it('hands the reindeer a carrot as the child hops down', () => {
    expect(at(6).carrot).toBeUndefined();
    expect(at(9).carrot).toBeDefined();
    expect(at(11).carrot).toBeUndefined();
    expect(at(10).munch).toBeGreaterThan(0);
  });

  it('moves the next child up and starts a new turn', () => {
    const before = at(1).waiting[0]?.x ?? 0;
    const after = at(7).waiting[0]?.x ?? 0;
    expect(after).toBeLessThan(before);
    expect(at(TURN_SECONDS).child.index).toBe(1);
    expect(momentAt(-5).child.index).toBe(0);
  });

  it('gives one family a dog', () => {
    expect([0, 1, 2, 3, 4, 5, 6].filter(hasDog)).toEqual([2, 6]);
  });

  it('has a hooked-up gazebo stall and draws every moment of a turn', () => {
    expect(booth.id).toBe('adrianfluckiger');
    expect(booth.stall?.shape).toBe('gazebo');
    for (let s = 0; s < 40; s += 0.5) {
      const log = new DrawingLog();
      booth.draw(log as unknown as CanvasRenderingContext2D, 200, s * 1000);
      expect(log.calls).toBeGreaterThan(20);
    }
  });
});
