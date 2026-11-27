/**
 * The landmarks the North Pole's attractions stand as (ADR 0042): each one
 * pinned, with the door on either side and at two moments, and each still
 * showing its attraction's own drawing under its name, which is what opens the
 * square's frame on the map.
 */
import { isOffMap } from './off-map';
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { drawingOf, pinDrawing } from '../test-support/recording-canvas';
import { LANDMARK_DRAWERS } from './landmarks';
import { drawAttraction } from './pavilion';
import { drawSpot } from './render';
import { LANDMARKS, type Landmark, type NorthPoleSquare, type StallStyle } from './square';
import { drawStall } from './stall';
import { PAVILION } from './stall-plan';
import { drawTower } from './tower';
import type { Spot } from './world';

const TIMES = [0, 4321];
const left: Spot = {
  kind: 'attraction',
  id: 'a',
  number: 4,
  x: 5,
  y: 5,
  w: 3,
  h: 3,
  door: { x: 6, y: 8 },
};
const right: Spot = { ...left, door: { x: 8, y: 6 } };

const square = (stall?: StallStyle, extra: object = {}): NorthPoleSquare => ({
  id: 'a',
  name: 'Santa’s Big Attraction',
  description: '',
  draw: () => undefined,
  ...(stall ? { stall } : {}),
  ...extra,
});
const asking = (landmark: Landmark): StallStyle => ({
  shape: 'shed',
  roof: 'berry',
  trim: 'snow',
  landmark,
  ...(landmark === 'tower' ? { letters: 'TESSL' } : {}),
});

describe('the landmarks', () => {
  it('draws each one the same, with the door on either side, as it moves', () => {
    const prints: Record<string, string> = {};
    for (const landmark of LANDMARKS)
      for (const [side, spot] of [left, right].entries())
        prints[`${landmark} ${String(side)}`] = pinDrawing((ctx, paint) =>
          TIMES.map((t) => drawSpot(ctx, spot, square(asking(landmark)), paint, t)),
        );
    expect(prints).toMatchSnapshot();
  });

  it("shows the attraction's own drawing once, under its name, and opens from anywhere on it", () => {
    for (const landmark of LANDMARKS)
      for (const spot of [left, right]) {
        let painted = 0;
        let box = { x: 0, y: 0, w: 0, h: 0 };
        const calls = drawingOf((ctx) => {
          box = LANDMARK_DRAWERS[landmark](
            ctx,
            spot,
            square(asking(landmark)),
            () => {
              painted += 1;
            },
            1000,
          );
        });
        expect(painted, landmark).toBe(1);
        const words = calls.filter(([name]) => name === 'fillText').map(([, text]) => String(text));
        expect(
          words.some((text) => /SANTA|BIG|ATTRACTION/i.test(text)),
          landmark,
        ).toBe(true);
        expect(box.h, landmark).toBeGreaterThan(PAVILION.stage + 96);
      }
  });

  it('raises a tower with no letters when none are given', () => {
    const calls = drawingOf((ctx) => {
      LANDMARK_DRAWERS.tower(ctx, left, square(), () => undefined, 0);
    });
    expect(calls.filter(([name]) => name === 'fillText').length).toBeGreaterThan(0);
    expect(calls).toEqual(
      drawingOf((ctx) => {
        drawTower(ctx, left, square(), () => undefined, 0, '');
      }),
    );
  });

  it('is an attraction’s alone: a booth asking for one stands as its stall', () => {
    const stall = asking('big-top');
    const booth = { ...left, kind: 'booth' as const, w: 2, h: 2, door: { x: 6, y: 7 } };
    const owner = { color: '#123456', you: false };
    expect(
      pinDrawing((ctx, paint) => drawSpot(ctx, booth, square(stall), paint, 0, false, owner)),
    ).toBe(pinDrawing((ctx, paint) => drawStall(ctx, booth, square(stall), paint, 0, owner)));
  });

  it("stands an attraction with no stall as a pavilion, and a level's square as a stall", () => {
    expect(pinDrawing((ctx, paint) => drawSpot(ctx, left, square(), paint, 0))).toBe(
      pinDrawing((ctx, paint) => drawAttraction(ctx, left, square(), paint, 0)),
    );
    const levelSquare = square(undefined, { kind: 'level' });
    const nobody = { color: '#f4c542', you: false, by: '' };
    expect(pinDrawing((ctx, paint) => drawSpot(ctx, left, levelSquare, paint, 0))).toBe(
      pinDrawing((ctx, paint) => drawStall(ctx, left, levelSquare, paint, 0, nobody)),
    );
  });
});

describe("the North Pole's attractions", () => {
  const root = join(import.meta.dirname, '..', '..', 'carnival', 'attractions');
  // An off-map attraction, such as AI DevCon, has no stall at all: its way in is already on the map.
  const chosen = readdirSync(root)
    .filter((id) => !isOffMap(id))
    .map((id) => {
      const code = readFileSync(join(root, id, 'attraction.ts'), 'utf8');
      return /landmark: '([a-z-]+)'/.exec(code)?.[1];
    });

  it('each stand as a landmark of their own, no two alike, but those with no stall', () => {
    expect(chosen.every((landmark) => (LANDMARKS as readonly unknown[]).includes(landmark))).toBe(
      true,
    );
    expect(new Set(chosen).size).toBe(chosen.length);
  });
});
