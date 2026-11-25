import { describe, expect, it } from 'vitest';
import { EDGE, pathAt } from './course';
import { advance, newGame, TAP_HOLD } from './game';
import { laneOf, TAP_STEP } from './sledding';
import { FRAME, hover, play, SIZE, tap } from './test-runs';

describe('steering', () => {
  it('maps the pointer across the drawing onto the track', () => {
    expect(laneOf(0, SIZE)).toBe(-EDGE);
    expect(laneOf(SIZE / 2, SIZE)).toBe(0);
    expect(laneOf(SIZE, SIZE)).toBe(EDGE);
  });

  it('follows the pointer left and right', () => {
    const g = play(newGame(0), 600, hover(SIZE * 0.1));
    expect(g.run.lane).toBeLessThan(-0.8);
    expect(play(g, 1_000, hover(SIZE * 0.9)).run.lane).toBeGreaterThan(0.8);
  });

  it('steers towards the half of the drawing that is tapped', () => {
    let g = advance(newGame(0), FRAME, tap(SIZE * 0.2), SIZE);
    expect(g.run.target).toBeLessThan(0);
    g = play(g, 400, hover(SIZE * 0.2));
    expect(g.run.lane).toBeLessThan(0);
    g = advance(g, g.last + FRAME, tap(SIZE * 0.8), SIZE);
    g = advance(g, g.last + FRAME, tap(SIZE * 0.8), SIZE);
    expect(g.run.target).toBeGreaterThan(0);
  });

  it("keeps a tap's steering when the finger lifts, so separate taps add up", () => {
    let g = advance(newGame(0), FRAME, tap(SIZE * 0.2), SIZE);
    // The finger lifts, as a quick touch does, and comes back for a second tap.
    g = play(g, 200);
    expect(g.run.target).toBeCloseTo(-TAP_STEP);
    g = advance(g, g.last + FRAME, tap(SIZE * 0.3), SIZE);
    expect(g.run.target).toBeCloseTo(Math.max(-EDGE, -2 * TAP_STEP));
    g = play(g, 1_000);
    expect(g.run.lane).toBeCloseTo(g.run.target);
    // Back with no tap and no movement, it keeps tapping.
    g = advance(g, g.last + FRAME, hover(SIZE * 0.6), SIZE);
    expect(g.tapping).toBe(true);
    expect(g.run.target).toBeCloseTo(-EDGE);
  });

  it('steers itself again a while after the last tap', () => {
    let g = advance(newGame(0), FRAME, tap(SIZE * 0.2), SIZE);
    g = advance(g, g.last + FRAME, undefined, SIZE);
    expect(g.tapping).toBe(true);
    // Long after the finger lifted, with the run still going.
    g = { ...g, seen: g.last - TAP_HOLD - 1 };
    g = advance(g, g.last + FRAME, undefined, SIZE);
    expect(g.tapping).toBe(false);
    expect(g.run.target).toBeCloseTo(pathAt(g.run.seed, g.run.distance), 1);
  });
});
