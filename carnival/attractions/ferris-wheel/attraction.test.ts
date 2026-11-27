import { describe, expect, it } from 'vitest';
import attraction from './attraction';
import {
  BOTTOM,
  CARS,
  FULL,
  GATE,
  HUB,
  SPIN,
  TURN,
  WINDOW,
  angleAt,
  baubleOf,
  carSpots,
  ease,
  fromGate,
  lapSpeed,
  nearestCar,
  passedGate,
  paused,
  spinning,
  wheelFrom,
} from './ride';

/** A stand-in canvas that takes every call the wheel makes, draws nothing, and counts what's written. */
class DrawingLog {
  words: string[] = [];
  globalAlpha = 1;
  fillStyle = '';
  strokeStyle = '';
  lineWidth = 1;
  lineCap = '';
  font = '';
  textAlign = '';
  textBaseline = '';
  lineDashOffset = 0;
  save() {}
  restore() {}
  scale() {}
  translate() {}
  beginPath() {}
  closePath() {}
  moveTo() {}
  lineTo() {}
  quadraticCurveTo() {}
  arc() {}
  ellipse() {}
  roundRect() {}
  rect() {}
  setLineDash() {}
  fill() {}
  stroke() {}
  fillRect() {}
  clip() {}
  fillText(text: string) {
    this.words.push(text);
  }
  measureText() {
    return { width: 40 };
  }
  createLinearGradient() {
    return { addColorStop() {} };
  }
  createRadialGradient() {
    return { addColorStop() {} };
  }
}

const canvas = (log: DrawingLog) => log as unknown as CanvasRenderingContext2D;

describe('the wheel', () => {
  it('keeps its id, name and big-wheel landmark', () => {
    expect(attraction.id).toBe('ferris-wheel');
    expect(attraction.name).toBe('Ferris Wheel');
    expect(attraction.stall?.landmark).toBe('big-wheel');
  });

  it('turns once every TURN on the first lap, quicker on later ones, up to a limit', () => {
    const wheel = wheelFrom(0, 0, lapSpeed(1));
    expect(angleAt(wheel, TURN)).toBeCloseTo(FULL);
    expect(lapSpeed(3)).toBeGreaterThan(lapSpeed(2));
    expect(lapSpeed(99)).toBeCloseTo(lapSpeed(50));
  });

  it('whirls one extra turn in a victory lap, smoothly', () => {
    const wheel = { ...wheelFrom(0, 0, 0), spinAt: 1_000 };
    expect(angleAt(wheel, 1_000)).toBe(0);
    expect(spinning(wheel, 1_000 + SPIN / 2)).toBe(true);
    expect(angleAt(wheel, 1_000 + SPIN / 2)).toBeCloseTo(Math.PI);
    expect(angleAt(wheel, 1_000 + SPIN)).toBeCloseTo(FULL);
    expect(spinning(wheel, 1_000 + SPIN)).toBe(false);
    expect(ease(-1)).toBe(0);
  });

  it('holds still while paused', () => {
    const wheel = { ...wheelFrom(1, 0, lapSpeed(1)), spinAt: 500 };
    const held = paused(wheel, 2_000);
    expect(angleAt(held, 3_000)).toBeCloseTo(angleAt(wheel, 1_000));
  });

  it('knows how far each car is from the gate, and which is nearest', () => {
    expect(fromGate(BOTTOM, 0)).toBeCloseTo(0);
    expect(fromGate(BOTTOM - 0.1, 0)).toBeCloseTo(-0.1);
    expect(fromGate(BOTTOM + 0.1 + FULL * 3, 0)).toBeCloseTo(0.1);
    const step = FULL / CARS;
    const nearest = nearestCar(BOTTOM - step * 2 + 0.05);
    expect(nearest.car).toBe(2);
    expect(nearest.off).toBeCloseTo(0.05);
  });

  it('notes each car going out past the gate, once', () => {
    expect(passedGate(BOTTOM, BOTTOM + WINDOW - 0.01)).toEqual([]);
    expect(passedGate(BOTTOM, BOTTOM + WINDOW + 0.01)).toEqual([0]);
    expect(passedGate(BOTTOM, BOTTOM + FULL)).toHaveLength(CARS);
  });

  it('hangs a car at the gate right below the hub', () => {
    const atGate = carSpots(BOTTOM).at(0);
    expect(atGate?.y).toBeCloseTo(HUB.y + HUB.radius);
    expect(baubleOf(atGate ?? GATE)).toEqual(GATE);
  });
});

describe('drawing Boarding Time', () => {
  const at = (x: number, y: number) => ({ x, y, down: true, presses: 1 });

  it('shows the attendant sign, then a game, a closed ride and a fresh one', () => {
    const idle = new DrawingLog();
    for (let time = 0; time <= 40_000; time += 200) attraction.draw(canvas(idle), 300, time);
    expect(idle.words).toContain('Boarding Time');
    expect(idle.words).not.toContain('SCORE');
    // A tap starts a game; taps at the wrong time are misses, and three close the ride.
    const game = new DrawingLog();
    attraction.draw(canvas(game), 300, 40_200, at(10, 10));
    let time = 40_200;
    for (let n = 0; n < 3; n++) {
      time += 3_000;
      attraction.draw(canvas(game), 300, time, at(10, 10));
    }
    for (let n = 0; n < 50; n++) attraction.draw(canvas(game), 300, (time += 100));
    expect(game.words).toContain('SCORE');
    expect(game.words).toContain('Ride closed!');
    expect(game.words).toContain('Tap to go again');
    const again = new DrawingLog();
    attraction.draw(canvas(again), 300, time + 100, at(150, 150));
    attraction.draw(canvas(again), 300, time + 200);
    expect(again.words).not.toContain('Ride closed!');
  });
});
