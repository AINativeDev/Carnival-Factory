import { describe, expect, it } from 'vitest';
import attraction from './attraction';
import {
  baubleOf,
  board,
  canBoard,
  carAt,
  CARS,
  carSpots,
  OPENING,
  riseTime,
  TURN,
  VIEW,
  viewOpen,
  wheelAngle,
} from './ride';
import { twinkle } from './view';

const FULL = Math.PI * 2;

/** Where car `car` is on the rim, as an angle from 0 to a full turn. */
function carAngle(time: number, car: number, ride?: Parameters<typeof wheelAngle>[1]) {
  const angle = wheelAngle(time, ride) + (car / CARS) * FULL;
  return ((angle % FULL) + FULL) % FULL;
}

describe('carSpots', () => {
  it('spaces the cars evenly round the rim', () => {
    const [first, second, third, fourth] = carSpots(4, 0, 50, 50, 10);
    expect(first.x).toBeCloseTo(60);
    expect(first.y).toBeCloseTo(50);
    expect(second.x).toBeCloseTo(50);
    expect(second.y).toBeCloseTo(60);
    expect(third.x).toBeCloseTo(40);
    expect(fourth.y).toBeCloseTo(40);
  });
});

describe('wheelAngle', () => {
  it('turns once every TURN with nobody riding', () => {
    expect(wheelAngle(TURN / 4)).toBeCloseTo(Math.PI / 2);
    expect(wheelAngle(TURN)).toBeCloseTo(FULL);
  });

  it('carries the boarded car to the top, holds it there for the view, then turns on', () => {
    const ride = board(3, 5_000);
    const rise = riseTime(ride.lift);
    expect(wheelAngle(5_000, ride)).toBeCloseTo(wheelAngle(5_000));
    expect(carAngle(5_000 + rise, 3, ride)).toBeCloseTo((3 * Math.PI) / 2);
    expect(carAngle(5_000 + rise + VIEW, 3, ride)).toBeCloseTo((3 * Math.PI) / 2);
    const after = wheelAngle(5_000 + rise + VIEW + TURN / 4, ride);
    expect(after - wheelAngle(5_000 + rise + VIEW, ride)).toBeCloseTo(Math.PI / 2);
  });

  it('never turns backwards, and lifts a car already at the top no further', () => {
    for (let car = 0; car < CARS; car++) {
      const ride = board(car, 1_234);
      expect(ride.lift).toBeGreaterThanOrEqual(0);
      expect(ride.lift).toBeLessThan(FULL);
    }
    const atTop = board(6, 0);
    expect(atTop.lift).toBeCloseTo(0);
  });

  it('boards from where the last ride left the wheel, so it never jumps', () => {
    const first = board(0, 0);
    const later = 40_000;
    const second = board(2, later, first);
    expect(second.from).toBeCloseTo(wheelAngle(later, first));
  });
});

describe('carAt', () => {
  const spots = carSpots(CARS, 0, 48, 40, 26);

  it('picks the car whose bauble is tapped', () => {
    spots.forEach((spot, car) => {
      const bauble = baubleOf(spot);
      expect(carAt(bauble.x + 1, bauble.y - 1, spots)).toBe(car);
    });
  });

  it('picks no car for a tap on the sky or the axle', () => {
    expect(carAt(2, 2, spots)).toBe(-1);
    expect(carAt(48, 40, spots)).toBe(-1);
  });
});

describe('canBoard and viewOpen', () => {
  it('lets a visitor board before any ride, and again once the view has closed', () => {
    expect(canBoard(0)).toBe(true);
    const ride = board(1, 0);
    const rise = riseTime(ride.lift);
    expect(canBoard(rise / 2, ride)).toBe(false);
    expect(canBoard(rise + VIEW / 2, ride)).toBe(false);
    expect(canBoard(rise + VIEW, ride)).toBe(true);
  });

  it('opens the view once the car is at the top, and closes it before it comes down', () => {
    expect(viewOpen(1_000)).toBe(0);
    const ride = board(1, 0);
    const rise = riseTime(ride.lift);
    expect(viewOpen(rise / 2, ride)).toBe(0);
    expect(viewOpen(rise + OPENING / 2, ride)).toBeCloseTo(0.5);
    expect(viewOpen(rise + VIEW / 2, ride)).toBe(1);
    expect(viewOpen(rise + VIEW - OPENING / 2, ride)).toBeCloseTo(0.5);
    expect(viewOpen(rise + VIEW, ride)).toBe(0);
  });
});

describe('twinkle', () => {
  it('swells slowly between dim and bright, never off', () => {
    for (let time = 0; time < 10_000; time += 250) {
      const light = twinkle(time, 3);
      expect(light).toBeGreaterThanOrEqual(0.1);
      expect(light).toBeLessThanOrEqual(1);
      // A quarter of a second later it has barely changed: a glimmer, not a blink.
      expect(Math.abs(twinkle(time + 250, 3) - light)).toBeLessThan(0.1);
    }
  });
});

describe('riding the wheel', () => {
  /** A canvas that draws nothing, and notes when the view's round window clips it. */
  function noting(calls: string[]): CanvasRenderingContext2D {
    const gradient = { addColorStop: () => undefined };
    const nothing = () => undefined;
    return {
      ...Object.fromEntries(
        ['save', 'restore', 'scale', 'translate', 'beginPath', 'closePath', 'moveTo', 'lineTo']
          .concat(['quadraticCurveTo', 'bezierCurveTo', 'arc', 'ellipse', 'rect', 'fill'])
          .concat(['stroke', 'fillRect', 'strokeRect', 'setLineDash'])
          .map((name) => [name, nothing]),
      ),
      clip: () => calls.push('clip'),
      createLinearGradient: () => gradient,
      createRadialGradient: () => gradient,
    } as unknown as CanvasRenderingContext2D;
  }

  it('boards the tapped car, and opens the view once it reaches the top', () => {
    const [car] = carSpots(CARS, wheelAngle(0), 48, 40, 26);
    const bauble = baubleOf(car);
    const size = 200;
    const tap = { x: (bauble.x * size) / 100, y: (bauble.y * size) / 100, down: true, presses: 1 };
    const before: string[] = [];
    attraction.draw(noting(before), size, 0, tap);
    expect(before).not.toContain('clip');
    const ride = board(0, 0);
    const atTheTop: string[] = [];
    attraction.draw(noting(atTheTop), size, riseTime(ride.lift) + VIEW / 2);
    expect(atTheTop).toContain('clip');
    const after: string[] = [];
    attraction.draw(noting(after), size, riseTime(ride.lift) + VIEW + 1);
    expect(after).not.toContain('clip');
  });
});
