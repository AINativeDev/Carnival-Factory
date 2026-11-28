/**
 * Pins what the Academy's, the Recording Studio's and the Year in Review's
 * squares draw, their landmarks and every lesson, studio stall or question, at two moments each, so a later
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
    '../../carnival/attractions/the-year-in-review/attraction.ts',
    '../../carnival/levels/the-year-in-review/squares/*/square.ts',
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
        "attractions/the-academy/attraction.ts: caafccecf1739eed (897 calls) / 2ebf8ce2c62cba67 (897 calls)",
        "attractions/the-studio/attraction.ts: 15c218ef289a9ad6 (1435 calls) / 2e6a16d85624eae4 (1518 calls)",
        "attractions/the-year-in-review/attraction.ts: c5852681c47536a0 (426 calls) / a34a380ad211fac9 (426 calls)",
        "levels/the-academy/squares/code-review-loops/square.ts: 4be7628ea8bcfbac (337 calls) / 811526edeac339a1 (351 calls)",
        "levels/the-academy/squares/quickstart/square.ts: 147db2b6a9a5b617 (433 calls) / 9cd09cbd585e1e39 (433 calls)",
        "levels/the-academy/squares/reference/square.ts: fcf603cf3928dc6b (731 calls) / c85ca4a8c5ba2ea0 (731 calls)",
        "levels/the-academy/squares/skill-foundations/square.ts: cb836ff47622d5a9 (261 calls) / d4b50b0e4d565cc3 (309 calls)",
        "levels/the-academy/squares/tuning-your-agent/square.ts: 3a4f27c0ed9b4f1e (322 calls) / 3d25565926ea2c72 (322 calls)",
        "levels/the-studio/squares/camera/square.ts: 091fb1833ba90473 (506 calls) / 829a0effccec2ddf (488 calls)",
        "levels/the-studio/squares/episode-wall/square.ts: 9b8c465843195c76 (379 calls) / 1194c2dc28ac3037 (379 calls)",
        "levels/the-studio/squares/guest-sofa/square.ts: c916f36b33bb2602 (437 calls) / 999be8913b5af176 (437 calls)",
        "levels/the-studio/squares/headphones/square.ts: 58f5cec086cf419f (300 calls) / 8de5c04b2fea0400 (300 calls)",
        "levels/the-studio/squares/microphone/square.ts: d7e5770064906f89 (357 calls) / 160903cc81eac1a8 (357 calls)",
        "levels/the-studio/squares/mixing-desk/square.ts: 07a3afee079ddd05 (573 calls) / e230e35157f936a2 (573 calls)",
        "levels/the-studio/squares/on-air/square.ts: 6839254dc13ac090 (288 calls) / 853dbc9bb9ee6128 (288 calls)",
        "levels/the-year-in-review/squares/buzzword-dies/square.ts: 4fb506cb5fe815ee (278 calls) / 6a0da5b9b643414c (278 calls)",
        "levels/the-year-in-review/squares/coding-disaster/square.ts: fbfb9a0dd4165dbb (274 calls) / fbfb9a0dd4165dbb (274 calls)",
        "levels/the-year-in-review/squares/dumbest-ai-moment/square.ts: 2b3a4fac45b15d4c (275 calls) / 0feb80be607bdf53 (275 calls)",
        "levels/the-year-in-review/squares/felt-like-magic/square.ts: aaa3c7bb10e6ffc4 (280 calls) / 68b8ab21ec57bd77 (280 calls)",
        "levels/the-year-in-review/squares/finally-fixed/square.ts: ce6aacca48e45da7 (290 calls) / 990cb71e4dfc155d (290 calls)",
        "levels/the-year-in-review/squares/hands-off/square.ts: 2e3fa430779d4c05 (278 calls) / 6cf0459215c4e3d6 (278 calls)",
        "levels/the-year-in-review/squares/hot-take/square.ts: 14106194e74f3c45 (277 calls) / 034ce8b58de52a70 (277 calls)",
        "levels/the-year-in-review/squares/most-overrated/square.ts: 842893344349fb32 (274 calls) / c9abdc4b61f0916a (274 calls)",
        "levels/the-year-in-review/squares/my-day-in-27/square.ts: 8c9967c963b3ec5d (275 calls) / a136f4c249665d2d (275 calls)",
        "levels/the-year-in-review/squares/still-reviewing/square.ts: c116936b2f8123de (278 calls) / 23e1a38cf49e6dff (278 calls)",
        "levels/the-year-in-review/squares/stopped-doing/square.ts: 9bbc5cbcfdf07f80 (269 calls) / 1ff1455f23dabf2f (269 calls)",
        "levels/the-year-in-review/squares/vibe-code-regret/square.ts: 5dc0a3f516454c1c (279 calls) / f85579aa184b2dee (279 calls)",
        "levels/the-year-in-review/squares/worse-before-better/square.ts: da334d0bb6025240 (286 calls) / 4fdfef0791660ca5 (286 calls)",
        "levels/the-year-in-review/squares/your-questions/square.ts: 19c0cbbb18ff8b57 (295 calls) / 6c1d9e8208cd2048 (297 calls)",
      ]
    `);
  });

  it('names every square for its folder', () => {
    for (const [path, { default: square }] of Object.entries(squares))
      expect(path.split('/').at(-2)).toBe(square.id);
  });
});
