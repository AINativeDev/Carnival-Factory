import { describe, expect, it } from 'vitest';
import { iso } from '../../../src/northpole/diorama';
import { choiceAt, END_BUTTONS, NEXT, PLAY, PLAY_BUTTONS, SKIP, tourButtons } from './buttons';
import { endHeading } from './end-card';
import { groundAt } from './props';
import { newShow } from './show';
import { CHAIN, LOOP_ROWS, SKILL_CARDS, TOUR_STEPS } from './tour-copy';
import { hintOf } from './tour';
import { chainAt, chainX, STATION_X } from './tour-factory';
import { loopRunAt, parcelAt, partOf } from './tour-loops';
import { cardLitAt, pagesAt, rideAt } from './tour-scenes';
import { breath, easeIn, popScale } from './ui';

describe('the tour’s words', () => {
  it('has four steps, each a title and two short lines, with no dashes', () => {
    expect(TOUR_STEPS.map((step) => step.title)).toEqual([
      'Why a factory?',
      'Skills',
      'Loops',
      'The factory',
    ]);
    for (const step of TOUR_STEPS) {
      expect(step.lines).toHaveLength(2);
      for (const line of step.lines) {
        expect(line.length).toBeLessThanOrEqual(50);
        expect(line).not.toMatch(/[\u2013\u2014]/);
      }
    }
  });

  it('shows this repository’s own skills, loops and chain', () => {
    expect(SKILL_CARDS.map((card) => card.folder)).toEqual([
      'assess-booth-request',
      'review-house-rules',
      'assess-booth-risk',
      'review-craft',
    ]);
    expect(LOOP_ROWS.map((row) => row.loop)).toEqual(['Assessment', 'Implement', 'Shepherd']);
    expect(LOOP_ROWS.map((row) => row.skill)).toEqual([
      'assess-booth-request',
      'implement-github-issue',
      'shepherd',
    ]);
    expect(CHAIN).toHaveLength(5);
  });
});

describe('the tour’s scenes', () => {
  it('piles the lone agent’s pages up and starts over', () => {
    expect(pagesAt(0)).toBe(6);
    expect(pagesAt(300 * 15)).toBe(21);
    expect(pagesAt(300 * 16)).toBe(6);
  });

  it('rides the parcel left to right, lap after lap', () => {
    expect(rideAt(0, 4_000)).toBe(0);
    expect(rideAt(1_000, 4_000)).toBe(0.25);
    expect(rideAt(5_000, 4_000)).toBe(0.25);
    expect(chainAt(4_000)).toBe(0.5);
    expect(chainX(0)).toBeLessThan(STATION_X[0]);
    expect(chainX(7_999)).toBeGreaterThan(STATION_X[4]);
  });

  it('follows each skill in turn', () => {
    expect(cardLitAt(0)).toBe(0);
    expect(cardLitAt(2_600)).toBe(1);
    expect(cardLitAt(2_600 * SKILL_CARDS.length)).toBe(0);
  });

  it('runs one loop at a time, waking, running, then checked', () => {
    expect(loopRunAt(0)).toEqual({ row: 0, along: 0 });
    expect(loopRunAt(3_600 + 1_800)).toEqual({ row: 1, along: 0.5 });
    expect(loopRunAt(3_600 * 3).row).toBe(0);
    expect([0, 0.3, 0.7].map(partOf)).toEqual([0, 1, 2]);
  });

  it('rides the loop’s parcel into the workshop and out the other side', () => {
    expect(parcelAt(0)).toBe(24);
    expect(parcelAt(0.3)).toBeGreaterThan(24);
    expect(parcelAt(0.5)).toBeUndefined();
    expect(parcelAt(0.95)).toBe(80);
  });

  it('finds the spot on the slab under a point on screen', () => {
    const spot = groundAt(72, 64);
    const back = iso(spot.gx, spot.gy);
    expect(back.x).toBeCloseTo(72);
    expect(back.y).toBeCloseTo(64);
  });
});

describe('the buttons', () => {
  it('shows Skip and Next on every step but the last, which leads into the game', () => {
    expect(tourButtons(0, 4)).toEqual([SKIP, NEXT]);
    expect(tourButtons(2, 4)).toEqual([SKIP, NEXT]);
    expect(tourButtons(3, 4)).toEqual([PLAY]);
  });

  it('keeps every button big enough for a finger, and inside the safe margin', () => {
    for (const button of [SKIP, NEXT, PLAY, ...PLAY_BUTTONS, ...END_BUTTONS]) {
      expect(button.box.h).toBeGreaterThanOrEqual(9);
      expect(button.box.x).toBeGreaterThanOrEqual(4);
      expect(button.box.x + button.box.w).toBeLessThanOrEqual(96);
      expect(button.box.y + button.box.h).toBeLessThanOrEqual(97);
    }
  });

  it('finds the button under a tap, and nothing between them', () => {
    expect(choiceAt([SKIP], SKIP.box.x, SKIP.box.y)).toEqual({ kind: 'skip' });
    expect(choiceAt([SKIP], SKIP.box.x - 1, SKIP.box.y)).toBeUndefined();
    expect(choiceAt(PLAY_BUTTONS, 50, 50)).toBeUndefined();
    expect(choiceAt(END_BUTTONS, 50, 98)).toBeUndefined();
  });
});

describe('the motion', () => {
  it('eases text in, pops things up past full size, and breathes the primary', () => {
    expect(easeIn(0)).toBe(0);
    expect(easeIn(150)).toBe(0.5);
    expect(easeIn(900)).toBe(1);
    expect(popScale(0)).toBeCloseTo(0);
    expect(popScale(300)).toBeGreaterThan(1);
    expect(popScale(450)).toBeCloseTo(1);
    expect(popScale(100, 200)).toBeCloseTo(0);
    expect(breath(0)).toBeCloseTo(0);
    expect(breath(1_000)).toBeCloseTo(1);
  });

  it('tells the visitor how to go on', () => {
    expect(hintOf(newShow(0))).toBe('Tap or → to start');
    expect(hintOf({ ...newShow(0), fresh: false, step: 1 })).toBe('Tap or → to go on');
    expect(hintOf({ ...newShow(0), step: TOUR_STEPS.length - 1 })).toBe('Tap or → to play');
  });
});

describe('the end card’s heading', () => {
  it('gives the score, the booths and a new best', () => {
    const show = newShow(0);
    const played = {
      ...show,
      game: { ...show.game, score: 90, best: 90, shipped: 1 },
    };
    expect(endHeading(played)).toEqual({
      title: 'Loop complete',
      line: '90 points · 1 booth shipped · New best',
    });
    const worse = { ...played, game: { ...played.game, score: 40, shipped: 2 } };
    expect(endHeading(worse).line).toBe('40 points · 2 booths shipped · Best 90');
  });
});
