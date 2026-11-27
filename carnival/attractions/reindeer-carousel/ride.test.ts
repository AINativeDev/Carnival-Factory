import { describe, expect, it } from 'vitest';
import {
  AT_PACE,
  carouselRiders,
  chaseBrightness,
  MAX_PACE,
  paceOf,
  stepRide,
  turnOf,
  TURN,
  type Ride,
} from './ride';

/** Plays the ride from `from` to `to` a frame at a time, towards `pace`. */
function play(ride: Ride, pace: number, from: number, to: number, frame = 16): Ride {
  let now = ride;
  for (let time = from; time <= to; time += frame) now = stepRide(now, pace, time);
  return now;
}

describe('carouselRiders', () => {
  it('starts the first reindeer at the front, in the middle', () => {
    const first = carouselRiders(4, 0).at(0);
    expect(first?.across).toBeCloseTo(0);
    expect(first?.depth).toBeCloseTo(1);
  });

  it('keeps every reindeer on the carousel and its pole', () => {
    for (let turn = 0; turn < Math.PI * 2; turn += 0.2) {
      for (const { across, depth, lift } of carouselRiders(6, turn)) {
        expect(Math.hypot(across, depth)).toBeCloseTo(1);
        expect(lift).toBeGreaterThanOrEqual(0);
        expect(lift).toBeLessThanOrEqual(1);
      }
    }
  });

  it('comes back round after a full turn', () => {
    const round = carouselRiders(6, Math.PI * 2);
    carouselRiders(6, 0).forEach((first, index) => {
      expect(round.at(index)?.across).toBeCloseTo(first.across);
      expect(round.at(index)?.depth).toBeCloseTo(first.depth);
      expect(round.at(index)?.lift).toBeCloseTo(first.lift);
    });
  });
});

describe('the ride', () => {
  it('turns once every TURN at its own pace, left alone, from time', () => {
    const ride = play(AT_PACE, 1, 0, TURN);
    expect(turnOf(ride, TURN)).toBeCloseTo(Math.PI * 2);
    expect(paceOf(ride)).toBe(1);
  });

  it('gathers speed towards the pace it is asked for, never past the fastest', () => {
    expect(paceOf(play(AT_PACE, 2.5, 0, 10_000))).toBeCloseTo(2.5, 2);
    expect(paceOf(play(AT_PACE, 99, 0, 10_000))).toBeCloseTo(MAX_PACE, 2);
    expect(paceOf(play(AT_PACE, 0, 0, 1_000))).toBe(1);
  });

  it('slows gently back to its own pace, never backwards', () => {
    const fast = play(AT_PACE, 3, 0, 4_000);
    const soon = play(fast, 1, 4_016, 4_500);
    expect(paceOf(soon)).toBeGreaterThan(2);
    const later = play(soon, 1, 4_516, 20_000);
    expect(paceOf(later)).toBeCloseTo(1, 2);
    expect(later.ahead).toBeGreaterThan(soon.ahead);
  });

  it('moves the same however often it is drawn', () => {
    const smooth = play(AT_PACE, 3, 0, 3_000, 10);
    const choppy = play(AT_PACE, 3, 0, 3_000, 250);
    expect(turnOf(choppy, 3_000)).toBeCloseTo(turnOf(smooth, 3_000), 6);
    expect(choppy.boost).toBeCloseTo(smooth.boost, 9);
  });

  it('never runs backwards if a frame comes with an earlier time', () => {
    const ride = stepRide({ ahead: 1, boost: 0.001, at: 500 }, 1, 100);
    expect(ride.ahead).toBe(1);
  });
});

describe('the chasing lights', () => {
  it('stay softly lit, never dark', () => {
    for (let turn = 0; turn < 7; turn += 0.3) {
      for (let n = 0; n < 13; n++) {
        const strength = chaseBrightness(turn, n, 13);
        expect(strength).toBeGreaterThanOrEqual(0.5);
        expect(strength).toBeLessThanOrEqual(1);
      }
    }
  });

  it('brighten each bulb under three times a second, even at the fastest', () => {
    // Four swells a turn, at the fastest pace.
    const perSecond = (4 * MAX_PACE * 1000) / TURN;
    expect(perSecond).toBeLessThan(3);
    expect(chaseBrightness(0, 0, 13)).toBeCloseTo(chaseBrightness(Math.PI / 2, 0, 13));
  });
});
