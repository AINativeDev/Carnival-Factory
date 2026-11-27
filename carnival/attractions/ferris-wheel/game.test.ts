import { describe, expect, it } from 'vitest';
import {
  IDLE,
  LIVES,
  POINTS,
  REOPEN,
  advance,
  guestCars,
  newBoarding,
  tap,
  type Boarding,
} from './game';
import { BOTTOM, CARS, FULL, PERFECT, SPIN, WINDOW, angleAt, lapSpeed, nearestCar } from './ride';

/** A game whose car 0 is `off` radians from the gate at time 0, past its warm-up. */
function atGate(off: number): Boarding {
  const game = newBoarding(0, BOTTOM + off, 'play');
  game.graceUntil = 0;
  return game;
}

/** Plays from `game` for `ms`, a frame every 16 ms, tapping as `taps` says. */
function playFor(
  game: Boarding,
  from: number,
  ms: number,
  taps: (g: Boarding, t: number) => boolean,
) {
  let now = game;
  for (let time = from; time < from + ms; time += 16)
    now = advance(now, time, taps(now, time) ? 1 : 0);
  return now;
}

/** A player who taps each empty car right at the gate, and never a full one. */
const perfectPlayer = (game: Boarding, time: number) => {
  const { car, off } = nearestCar(angleAt(game.wheel, time));
  return Math.abs(off) < PERFECT / 2 && game.cars.at(car) === 'empty';
};

describe('boarding a car', () => {
  it('scores more for a perfect boarding than a good one', () => {
    const perfect = atGate(0);
    tap(perfect, 0);
    expect(perfect.cars.at(0)).toBe('yours');
    expect(perfect.score).toBe(POINTS.perfect);
    const good = atGate(WINDOW - 0.01);
    tap(good, 0);
    expect(good.score).toBe(POINTS.good);
    expect(good.boarded.perfect).toBe(false);
  });

  it('ignores a second tap straight after a boarding', () => {
    const game = atGate(0);
    tap(game, 0);
    tap(game, 100);
    expect(game.misses).toBe(0);
  });
});

describe('missing', () => {
  it('misses a tap too early, too late, on a full car or on guests', () => {
    const early = atGate(-WINDOW - 0.05);
    tap(early, 0);
    expect(early.missed.why).toBe('Too early!');
    const late = atGate(WINDOW + 0.05);
    tap(late, 0);
    expect(late.missed.why).toBe('Too late!');
    const full = atGate(0);
    full.cars[0] = 'yours';
    tap(full, 0);
    expect(full.missed.why).toBe('That car is full!');
    const guests = atGate(0);
    guests.cars[0] = 'guests';
    tap(guests, 0);
    expect(guests.missed.why).toBe('Let them off first!');
  });

  it('never counts one mistake twice, while the next elf steps up', () => {
    const game = atGate(-WINDOW - 0.05);
    tap(game, 0);
    tap(game, 300);
    expect(game.misses).toBe(1);
  });

  it('misses an empty car let go round, but not in a new game before the first boarding', () => {
    const lazy = playFor(atGate(0), 0, 3_000, () => false);
    expect(lazy.missed.why).toBe('An empty car went round!');
    const fresh = playFor(newBoarding(0, BOTTOM, 'play'), 0, 6_000, () => false);
    expect(fresh.misses).toBe(0);
  });

  it('closes the ride after three misses, keeps the best, and opens again on a tap', () => {
    const game = atGate(0);
    game.cars.fill('guests');
    game.score = 70;
    for (let n = 0; n < LIVES; n++) tap(game, n * 1_000);
    expect(game.mode).toBe('over');
    expect(game.best).toBe(70);
    const ended = game.endedAt;
    expect(advance(game, ended + 100, 1).mode).toBe('over');
    const again = advance(game, ended + REOPEN, 1);
    expect(again).toMatchObject({ mode: 'play', score: 0, best: 70, misses: 0 });
  });

  it('goes back to the show once a closed ride sits idle', () => {
    const game = atGate(0);
    game.cars.fill('guests');
    for (let n = 0; n < LIVES; n++) tap(game, n * 1_000);
    expect(advance(game, game.endedAt + IDLE, 0).mode).toBe('demo');
  });
});

describe('a full wheel', () => {
  it('scores the lap, whirls a victory lap, takes guests and turns quicker', () => {
    const start = advance(newBoarding(0, 0, 'demo'), 16, 1);
    const game = playFor(start, 32, 20_000, perfectPlayer);
    expect(game.misses).toBe(0);
    expect(game.lap).toBe(2);
    expect(game.score).toBeGreaterThanOrEqual(CARS * POINTS.perfect + POINTS.lap);
    expect(game.wheel.speed).toBeCloseTo(lapSpeed(2));
    expect(game.cars.filter((riders) => riders === 'guests')).toHaveLength(1);
    expect(game.hops.length).toBeGreaterThan(0);
  });

  it('lets a good player keep going lap after lap, skipping the guests', () => {
    const start = advance(newBoarding(0, 0, 'demo'), 16, 1);
    const game = playFor(start, 32, 120_000, perfectPlayer);
    expect(game.misses).toBe(0);
    expect(game.lap).toBeGreaterThan(3);
  });

  it('seats one more guest each lap, up to the cap', () => {
    expect(guestCars(1, 3).filter(Boolean)).toHaveLength(0);
    expect(guestCars(3, 3).filter(Boolean)).toHaveLength(2);
    expect(guestCars(9, 3).filter(Boolean)).toHaveLength(3);
    expect(guestCars(9, 2).filter(Boolean)).toHaveLength(2);
  });
});

describe('the show', () => {
  it('boards every car and fills the wheel with nobody playing, scoring nothing', () => {
    const game = playFor(newBoarding(0, 0, 'demo'), 0, 40_000, () => false);
    expect(game.lap).toBeGreaterThan(1);
    expect(game.score).toBe(0);
    expect(game.misses).toBe(0);
  });

  it('holds the wheel still across a long gap, as when the tab was hidden', () => {
    const game = newBoarding(0, 0, 'demo');
    advance(game, 16, 0);
    const before = angleAt(game.wheel, 16);
    advance(game, 60_000, 0);
    expect(angleAt(game.wheel, 60_000)).toBeCloseTo(before);
    expect(SPIN).toBeLessThan(FULL * 1_000);
  });
});
