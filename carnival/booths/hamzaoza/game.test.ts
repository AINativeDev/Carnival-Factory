import { describe, expect, it } from 'vitest';
import { EDGE, thingsBetween } from './course';
import {
  advance,
  CATCH,
  type Game,
  HIT,
  MAX_STEP,
  newGame,
  newRun,
  POINTS,
  REST,
  TUMBLE,
} from './game';
import { distanceFor, laneAt, TOP } from './sledding';
import { firstOnCourse, FRAME, hover, play, SIZE, tap } from './test-runs';

describe('a run', () => {
  it('weaves on its own without a crash when nobody steers', () => {
    for (let seed = 0; seed < 4; seed++) {
      let g: Game = { ...newGame(0), runs: seed, run: newRun(seed + 1, 0) };
      g = play(g, 35_000);
      expect(g.run.crashedAt).toBeNull();
      expect(g.run.score).toBeGreaterThan(0);
      expect(g.best).toBe(0);
    }
  });

  it('scores snowflakes it scoops up, and crashes into rocks and drifts', () => {
    const seed = 1;
    const course = thingsBetween(seed, 0, 400);
    const flake = firstOnCourse(course, 'flake');
    const rock = firstOnCourse(course, 'rock', 'drift');

    // Sit on the flake's lane just before reaching it, then cross it.
    const before = (d: number) => ({ ...newRun(seed, 0, 0, true), distance: d - 0.1 });
    const at = (d: number) => {
      let s = 0;
      while (distanceFor(s) < d) s += 0.001;
      return s * 1000;
    };
    let g: Game = {
      ...newGame(0),
      run: { ...before(flake.distance), lane: flake.lane, target: flake.lane },
    };
    g = { ...g, last: at(flake.distance) - 1, tapping: true, lastX: SIZE / 2 };
    g = advance(g, at(flake.distance) + 1, hover(SIZE / 2), SIZE);
    expect(Math.abs(g.run.lane - flake.lane)).toBeLessThan(CATCH);
    expect(g.run.score).toBe(POINTS);

    let h: Game = {
      ...newGame(0),
      run: { ...before(rock.distance), lane: rock.lane, target: rock.lane },
    };
    h = { ...h, last: at(rock.distance) - 1, tapping: true, lastX: SIZE / 2 };
    h = advance(h, at(rock.distance) + 1, hover(SIZE / 2), SIZE);
    expect(Math.abs(h.run.lane - rock.lane)).toBeLessThan(HIT);
    expect(h.run.crashedAt).not.toBeNull();
  });

  it('checks each thing against where the penguin is as it passes it', () => {
    // Steering from 0 to 1 over a frame: halfway along it is halfway across.
    expect(laneAt(0, 1, 1, 10, 20, 15)).toBeCloseTo(0.5);
    expect(laneAt(0, 1, 1, 10, 20, 10)).toBeCloseTo(0);
    expect(laneAt(0, 1, 0.4, 10, 20, 20)).toBeCloseTo(0.4);

    // A rock met at the start of a frame still hits, though the penguin ends the frame clear of it.
    const seed = 1;
    const rock = firstOnCourse(thingsBetween(seed, 0, 400), 'rock', 'drift');
    let s = 0;
    while (distanceFor(s) < rock.distance) s += 0.001;
    const from = 10_000;
    const run = {
      ...newRun(seed, from - (s - 0.002) * 1000, 0, true),
      distance: distanceFor(s - 0.002),
      lane: rock.lane,
      target: rock.lane > 0 ? -EDGE : EDGE,
    };
    let g: Game = { ...newGame(0), last: from, run, tapping: true, lastX: SIZE / 2 };
    g = advance(g, from + 200, hover(SIZE / 2), SIZE);
    expect(Math.abs(g.run.lane - rock.lane)).toBeGreaterThan(HIT);
    expect(g.run.crashedAt).not.toBeNull();
  });

  it('pauses the run over a long gap between frames, rather than skipping ahead', () => {
    let g = play(newGame(0), 1_000);
    const distance = g.run.distance;
    g = advance(g, g.last + 10_000, undefined, SIZE);
    expect(g.run.distance - distance).toBeLessThanOrEqual(TOP * MAX_STEP);
  });

  it('keeps the best of the visit, and a tap after the tumble starts a new run', () => {
    // Hold hard left until it hits something.
    let g = newGame(0);
    for (let i = 0; i < 6_000 && g.run.crashedAt === null; i++)
      g = advance(g, g.last + FRAME, hover(0), SIZE);
    expect(g.run.crashedAt).not.toBeNull();
    const score = g.run.score;
    expect(g.best).toBe(score);
    const distance = g.run.distance;

    // It stays put while it tumbles, and a too-early tap does nothing.
    g = advance(g, g.last + TUMBLE / 2, tap(SIZE / 2), SIZE);
    expect(g.run.crashedAt).not.toBeNull();
    expect(g.run.distance).toBe(distance);

    g = advance(g, g.last + TUMBLE, tap(SIZE / 2), SIZE);
    expect(g.run.crashedAt).toBeNull();
    expect(g.run.score).toBe(0);
    expect(g.best).toBe(score);
  });

  it('starts again on its own after a crash when nobody is there', () => {
    let g = newGame(0);
    for (let i = 0; i < 6_000 && g.run.crashedAt === null; i++)
      g = advance(g, g.last + FRAME, hover(0), SIZE);
    const seed = g.run.seed;
    g = advance(g, g.last + REST + 1, undefined, SIZE);
    expect(g.run.crashedAt).toBeNull();
    expect(g.run.seed).not.toBe(seed);
  });
});
