import { describe, expect, it } from 'vitest';
import {
  advance,
  BASE,
  CATCH,
  distanceFor,
  EDGE,
  type Game,
  HIT,
  inView,
  laneOf,
  newGame,
  newRun,
  pathAt,
  POINTS,
  project,
  REST,
  scaleAt,
  speedFor,
  thingAt,
  thingsBetween,
  TOP,
  TUMBLE,
  VIEW,
} from './booth';

const SIZE = 200;
const FRAME = 1000 / 60;

/** Plays `ms` of frames from `game`, with the same pointer every frame. */
function play(
  game: Game,
  ms: number,
  pointer?: { x: number; y: number; down: boolean; presses: number },
) {
  let g = game;
  const end = g.last + ms;
  for (let t = g.last + FRAME; t <= end; t += FRAME) g = advance(g, t, pointer, SIZE);
  return g;
}

const hover = (x: number) => ({ x, y: SIZE / 2, down: false, presses: 0 });
const tap = (x: number) => ({ x, y: SIZE / 2, down: true, presses: 1 });

describe('the course', () => {
  it('is the same every time for the same seed, and differs between seeds', () => {
    expect(thingAt(3, 7)).toEqual(thingAt(3, 7));
    const a = Array.from({ length: 20 }, (_, i) => thingAt(1, i).lane);
    const b = Array.from({ length: 20 }, (_, i) => thingAt(2, i).lane);
    expect(a).not.toEqual(b);
  });

  it('keeps every rock and drift clear of the line and on the track', () => {
    for (let seed = 1; seed < 6; seed++) {
      for (let i = 0; i < 200; i++) {
        const t = thingAt(seed, i);
        expect(Math.abs(t.lane)).toBeLessThanOrEqual(EDGE);
        if (t.kind !== 'flake') {
          expect(Math.abs(t.lane - pathAt(seed, t.distance))).toBeGreaterThanOrEqual(0.7);
        }
      }
    }
  });

  it('finds each thing in a stretch once, nearest first', () => {
    const things = thingsBetween(1, 30, 120);
    expect(things.length).toBeGreaterThan(0);
    for (const t of things) expect(t.distance > 30 && t.distance <= 120).toBe(true);
    for (let i = 1; i < things.length; i++)
      expect(things[i].distance).toBeGreaterThan(things[i - 1].distance);
  });
});

describe('speed', () => {
  it('starts gently, speeds up slowly and tops out', () => {
    expect(speedFor(0)).toBe(BASE);
    expect(speedFor(10)).toBeGreaterThan(speedFor(5));
    expect(speedFor(1_000)).toBe(TOP);
    expect(distanceFor(0)).toBe(0);
    let last = 0;
    for (let s = 1; s < 120; s++) {
      const d = distanceFor(s);
      expect(d - last).toBeLessThanOrEqual(TOP + 1e-9);
      expect(d).toBeGreaterThan(last);
      last = d;
    }
  });
});

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
});

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
    const things = thingsBetween(seed, 0, 400);
    const flake = things.find((t) => t.kind === 'flake')!;
    const rock = things.find((t) => t.kind !== 'flake')!;

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

describe('the view', () => {
  it('shrinks things towards the horizon and puts the penguin at the front', () => {
    expect(scaleAt(0)).toBe(1);
    expect(scaleAt(50)).toBeLessThan(scaleAt(10));
    expect(project(0, 0, 0)).toEqual({ k: 1, x: 50, y: 92 });
    expect(project(0, 30, 0).y).toBeLessThan(project(0, 5, 0).y);
  });

  it('lists what is ahead, furthest first', () => {
    const seen = inView(1, 100);
    expect(seen.length).toBeGreaterThan(0);
    for (let i = 1; i < seen.length; i++)
      expect(seen[i - 1].ahead).toBeGreaterThanOrEqual(seen[i].ahead);
    for (const { ahead } of seen) expect(ahead > 0 && ahead <= VIEW).toBe(true);
  });
});
