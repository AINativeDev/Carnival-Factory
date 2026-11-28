import { describe, expect, it } from 'vitest';
import { BUGS, bugAt, bugPlace, nextBug } from './bugs';
import {
  ACTION,
  BACK,
  choiceAt,
  CHOICES,
  END_SCENE,
  FIRST_ACTION,
  inside,
  LIVE_NEXT,
  SCENE,
} from './layout';
import { BIG_NUDGES, QUIET_NUDGES } from './nudges';
import { beatOf, GATE_CHECKS, STATIONS, STEPS, withBooth } from './steps';

describe('the steps', () => {
  it('go through the seven stations in order, between the start and your repo', () => {
    expect(STEPS.at(0)?.kind).toBe('start');
    expect(STEPS.at(-1)?.kind).toBe('repo');
    const stations = STEPS.map((step) => step.station).filter((station) => station > 0);
    expect([...new Set(stations)]).toEqual([1, 2, 3, 4, 5, 6, 7]);
    expect(STATIONS).toHaveLength(7);
    expect(GATE_CHECKS).toHaveLength(7);
    expect(STEPS.find((step) => step.kind === 'gate')?.beats).toHaveLength(8);
    expect(STEPS.find((step) => step.kind === 'checks')?.beats).toHaveLength(BUGS + 1);
  });

  it('keep every line short, and never promise how long it takes', () => {
    for (const step of STEPS) {
      for (const beat of step.beats) {
        expect(beat.line.length).toBeLessThanOrEqual(46);
        expect(`${beat.line} ${beat.aside ?? ''}`).not.toMatch(/minute|hour|second/i);
      }
    }
  });

  it('find a beat, falling back to the step’s first, and put the booth in', () => {
    expect(beatOf(0, 0).button).toBe('Tap to start ▶');
    expect(beatOf(0, 9)).toEqual(beatOf(0, 0));
    expect(beatOf(99, 0)).toEqual({ line: '', button: '' });
    expect(withBooth('Your {booth} booth', 1)).toBe('Your Cocoa volcano booth');
    expect(withBooth('Your {booth} booth', 9)).toBe('Your Penguin DJ booth');
  });
});

describe('the bugs', () => {
  it('stay on the test mat, clear of the ticket, and a tap squashes the one under it unless it is squashed', () => {
    const mat = { x: 40, y: 50, w: 56, h: 24 };
    for (let time = 0; time < 20_000; time += 500) {
      for (let n = 0; n < BUGS; n++)
        expect(inside(mat, bugPlace(n, time).x, bugPlace(n, time).y)).toBe(true);
    }
    const bug = bugPlace(2, 1_234);
    expect(bugAt(bug.x, bug.y, 1_234, [])).toBe(2);
    expect(bugAt(bug.x, bug.y, 1_234, [0, 1, 2])).toBe(-1);
    expect(bugAt(5, 5, 1_234, [])).toBe(-1);
    expect(nextBug([0, 2])).toBe(1);
    expect(nextBug([0, 1, 2])).toBe(-1);
  });
});

describe('the layout', () => {
  it('finds the card under a tap, keeps the footer clear of the scene, and no buttons overlapping', () => {
    CHOICES.forEach((card, n) => {
      expect(choiceAt(card.x + 1, card.y + 1)).toBe(n);
    });
    expect(choiceAt(50, 10)).toBe(-1);
    for (const [row, scene] of [
      [QUIET_NUDGES, SCENE],
      [BIG_NUDGES, END_SCENE],
    ] as const) {
      const boxes = row.map((nudge) => nudge.box);
      boxes.forEach((a, n) => {
        expect(a.y).toBeGreaterThan(scene.y + scene.h);
        expect(a.x + a.w).toBeLessThanOrEqual(100);
        for (const b of boxes.slice(n + 1)) {
          expect(a.x + a.w < b.x || b.x + b.w < a.x || a.y + a.h < b.y || b.y + b.h < a.y).toBe(
            true,
          );
        }
      });
    }
  });

  it('keeps everything tappable big enough for a finger, inside the square', () => {
    const boxes = [
      ACTION,
      BACK,
      FIRST_ACTION,
      LIVE_NEXT,
      ...CHOICES,
      ...[...QUIET_NUDGES, ...BIG_NUDGES].map((nudge) => nudge.box),
    ];
    for (const box of boxes) {
      expect(box.h).toBeGreaterThanOrEqual(9);
      expect(box.x).toBeGreaterThanOrEqual(4);
      expect(box.x + box.w).toBeLessThanOrEqual(96);
      expect(box.y + box.h).toBeLessThanOrEqual(100);
    }
    expect(FIRST_ACTION.x + FIRST_ACTION.w / 2).toBe(50);
  });
});
