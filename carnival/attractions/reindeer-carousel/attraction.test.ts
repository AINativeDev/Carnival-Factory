import { describe, expect, it } from 'vitest';
import {
  AT_PACE,
  carouselRiders,
  chaseBrightness,
  MAX_BOOST,
  paceOf,
  reindeerAt,
  riderSpot,
  seatAfterTap,
  seatAfterTaps,
  stepRide,
  turnOf,
  TURN,
  type Ride,
} from './ride';

/** Plays the ride from `from` to `to` a frame at a time, held or not. */
function play(ride: Ride, holding: boolean, from: number, to: number, frame = 16): Ride {
  let now = ride;
  for (let time = from; time <= to; time += frame) now = stepRide(now, holding, time);
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
    const ride = play(AT_PACE, false, 0, TURN);
    expect(turnOf(ride, TURN)).toBeCloseTo(Math.PI * 2);
    expect(paceOf(ride)).toBe(1);
  });

  it('speeds up while held, up to three times its pace', () => {
    const held = play(AT_PACE, true, 0, 10_000);
    expect(paceOf(held)).toBeCloseTo(3, 2);
    expect(held.boost).toBeLessThanOrEqual(MAX_BOOST);
    expect(turnOf(held, 10_000)).toBeGreaterThan(turnOf(AT_PACE, 10_000) * 2);
  });

  it('slows gently back to its own pace once let go, never backwards', () => {
    const held = play(AT_PACE, true, 0, 4_000);
    const soon = play(held, false, 4_016, 4_500);
    expect(paceOf(soon)).toBeGreaterThan(2);
    const later = play(soon, false, 4_516, 20_000);
    expect(paceOf(later)).toBeCloseTo(1, 2);
    expect(later.ahead).toBeGreaterThan(soon.ahead);
  });

  it('moves the same however often it is drawn', () => {
    const smooth = play(AT_PACE, true, 0, 3_000, 10);
    const choppy = play(AT_PACE, true, 0, 3_000, 250);
    expect(turnOf(choppy, 3_000)).toBeCloseTo(turnOf(smooth, 3_000), 6);
    expect(choppy.boost).toBeCloseTo(smooth.boost, 9);
  });

  it('never runs backwards if a frame comes with an earlier time', () => {
    const ride = stepRide({ ahead: 1, boost: MAX_BOOST, at: 500 }, false, 100);
    expect(ride.ahead).toBe(1);
  });
});

describe('picking a reindeer', () => {
  const riders = carouselRiders(6, 0);
  const front = riderSpot(riders[0] ?? { across: 0, depth: 1, lift: 0 });

  it('finds the reindeer under a tap, and none on the empty snow', () => {
    expect(reindeerAt(riders, front.x, front.y)).toBe(0);
    expect(reindeerAt(riders, 3, 3)).toBe(-1);
  });

  it('picks the one in front when two overlap', () => {
    const overlapping = [
      { across: 0, depth: -1, lift: 0.5 },
      { across: 0, depth: 0.2, lift: 0 },
      { across: 0.05, depth: 0.1, lift: 0 },
    ];
    const spot = riderSpot({ across: 0, depth: 0.2, lift: 0 });
    expect(reindeerAt(overlapping, spot.x, spot.y)).toBe(1);
  });

  it('seats the elf on a tapped reindeer, moves it to another, and lets it hop off', () => {
    expect(seatAfterTap(-1, 2)).toBe(2);
    expect(seatAfterTap(2, 4)).toBe(4);
    expect(seatAfterTap(4, 4)).toBe(-1);
    expect(seatAfterTap(4, -1)).toBe(4);
  });

  it('counts every tap that came since the last frame', () => {
    expect(seatAfterTaps(-1, 2, 1)).toBe(2);
    expect(seatAfterTaps(-1, 2, 2)).toBe(-1);
    expect(seatAfterTaps(4, 2, 3)).toBe(2);
    expect(seatAfterTaps(4, -1, 2)).toBe(4);
    expect(seatAfterTaps(4, 2, 0)).toBe(4);
  });

  it('picks no reindeer hidden under the canopy', () => {
    // The back reindeer's body at the first turn sits behind the canopy's hem.
    const back = riderSpot(riders[3] ?? { across: 0, depth: -1, lift: 0 });
    expect(reindeerAt(riders, back.x, back.y + 3)).toBe(-1);
    // Nor up on the striped cone, though the sky beside it still shows antlers.
    const high = [{ across: 1, depth: -1, lift: 1 }];
    expect(reindeerAt([{ across: 0, depth: -1, lift: 1 }], 50, 32)).toBe(-1);
    expect(reindeerAt(high, 82, 35)).toBe(0);
  });

  it('picks no reindeer at the back hidden by the centre column', () => {
    const behind = [{ across: 0, depth: -0.3, lift: 0 }];
    const spot = riderSpot({ across: 0, depth: -0.3, lift: 0 });
    expect(reindeerAt(behind, spot.x, spot.y + 4)).toBe(-1);
    expect(reindeerAt(behind, spot.x + 6, spot.y + 4)).toBe(0);
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
    // Four swells a turn, at three turns every TURN.
    const perSecond = (4 * 3 * 1000) / TURN;
    expect(perSecond).toBeLessThan(3);
    expect(chaseBrightness(0, 0, 13)).toBeCloseTo(chaseBrightness(Math.PI / 2, 0, 13));
  });
});
