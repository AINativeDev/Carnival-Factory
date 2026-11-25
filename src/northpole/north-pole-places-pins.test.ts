/**
 * Pins what the Academy's and the Recording Studio's squares draw, their
 * landmarks and every lesson or studio stall, at two moments each, so a later
 * split or tidy of any of them is proven to draw the same
 * (docs/adr/0024-test-first.md). The drawings' own logic is tested beside them.
 */
import { describe, expect, it } from 'vitest';
import { drawingOf, fingerprint } from '../test-support/recording-canvas';
import type { NorthPoleSquare } from './square';

const squares = import.meta.glob<{ default: NorthPoleSquare }>(
  [
    '../../carnival/attractions/the-academy/attraction.ts',
    '../../carnival/attractions/the-studio/attraction.ts',
    '../../carnival/levels/the-academy/squares/*/square.ts',
    '../../carnival/levels/the-studio/squares/*/square.ts',
  ],
  { eager: true },
);

/** Each square's drawing at the start and three and a half seconds in, as short fingerprints. */
const pins = () =>
  Object.entries(squares)
    .sort(([a], [b]) => (a < b ? -1 : 1))
    .map(([path, { default: square }]) => {
      const at = (time: number) =>
        fingerprint(
          drawingOf((ctx) => {
            square.draw(ctx, 240, time);
          }),
        );
      return `${path.replace('../../carnival/', '')}: ${at(0)} / ${at(3_500)}`;
    });

describe("the North Pole's Academy and Recording Studio", () => {
  it('draw every square the same as when they were pinned', () => {
    expect(pins()).toMatchInlineSnapshot(`
      [
        "attractions/the-academy/attraction.ts: 626ff888b10c1753 (347 calls) / f4691dd6c622e353 (347 calls)",
        "attractions/the-studio/attraction.ts: 24f7971271aec455 (312 calls) / f4c7c779a8986e2f (312 calls)",
        "levels/the-academy/squares/code-review-loops/square.ts: 4be7628ea8bcfbac (337 calls) / 811526edeac339a1 (351 calls)",
        "levels/the-academy/squares/quickstart/square.ts: 147db2b6a9a5b617 (433 calls) / 9cd09cbd585e1e39 (433 calls)",
        "levels/the-academy/squares/reference/square.ts: fcf603cf3928dc6b (731 calls) / c85ca4a8c5ba2ea0 (731 calls)",
        "levels/the-academy/squares/skill-foundations/square.ts: cb836ff47622d5a9 (261 calls) / d4b50b0e4d565cc3 (309 calls)",
        "levels/the-academy/squares/tuning-your-agent/square.ts: 3a4f27c0ed9b4f1e (322 calls) / 3d25565926ea2c72 (322 calls)",
        "levels/the-studio/squares/broadcast-tower/square.ts: f999a9cd705c2073 (266 calls) / 93a787e5b9842a79 (266 calls)",
        "levels/the-studio/squares/control-room/square.ts: 07a3afee079ddd05 (573 calls) / e230e35157f936a2 (573 calls)",
        "levels/the-studio/squares/green-room/square.ts: c916f36b33bb2602 (437 calls) / 999be8913b5af176 (437 calls)",
        "levels/the-studio/squares/podcast-booth/square.ts: b35957e81a95f902 (357 calls) / 78bb5a85fea9bedb (357 calls)",
        "levels/the-studio/squares/video-set/square.ts: 091fb1833ba90473 (506 calls) / 829a0effccec2ddf (488 calls)",
      ]
    `);
  });

  it('names every square for its folder', () => {
    for (const [path, { default: square }] of Object.entries(squares))
      expect(path.split('/').at(-2)).toBe(square.id);
  });
});
