/**
 * Pins what the Year in Review's gallery draws (ADR 0047): every picture in
 * its style, the signs and the neon, the statues, the mobile, the rope, the
 * people and the party, on both walls and at two moments, so a later split or
 * tidy is proven to draw the same (docs/adr/0024-test-first.md). And its
 * motion stays calm: nothing goes dark or jumps.
 */
import { describe, expect, it } from 'vitest';
import { drawingOf, fingerprint } from '../test-support/recording-canvas';
import { PICTURES, pictureOf } from './gallery-art';
import { mobileTurn } from './gallery-floor';
import { eyesFollow } from './gallery-paintings-old';
import { neonAt } from './gallery-walls';
import { LEVEL_PROPS, propPlace, type LevelPropKind } from './level-props';
import { drawShow, FLAT, type ShowKind } from './show';
import type { Thing } from './world';

/** The gallery's catalogue, and the variants that pick each of its looks. */
const GALLERY: [kind: LevelPropKind & ShowKind, seeds: number[]][] = [
  ['framed-picture', PICTURES.map((_, n) => (n + 0.5) / PICTURES.length)],
  ['neon-art', [0.3]],
  ['wall-sign', [0.2, 0.8]],
  ['statue', [0.1, 0.5, 0.9]],
  ['mobile', [0.3]],
  ['velvet-rope', [0]],
  ['art-sign', [0.2, 0.8]],
  ['gallery-elf', [0.2, 0.7]],
  ['balloons', [0.4]],
  ['confetti', [0.3]],
  ['mirrorball', [0]],
];

/** A prop as a room lays it out at (x, y) of an 11 by 11 room. */
function thingAt(kind: LevelPropKind, x: number, y: number, seed: number): Thing {
  const { box, wall } = propPlace(kind, { x, y });
  const thing: Thing = {
    kind: kind as ShowKind,
    ...box,
    x: box.x - 5,
    y: box.y - 5,
    seed,
    blocks: LEVEL_PROPS[kind].blocks,
  };
  return wall ? { ...thing, wall } : thing;
}

describe("the Year in Review's gallery", () => {
  it('draws every piece of art and dressing, on the floor and on both walls, as pinned', () => {
    const pins = GALLERY.map(([kind, seeds]) => [
      kind,
      fingerprint(
        seeds.flatMap((seed) =>
          (
            [
              [3, 0],
              [0, 3],
            ] as const
          ).flatMap(([x, y]) =>
            [0, 2_600].flatMap((time) =>
              drawingOf((ctx) => {
                drawShow(ctx, kind, thingAt(kind, x, y, seed), time);
              }),
            ),
          ),
        ),
      ),
    ]);
    expect(Object.fromEntries(pins)).toMatchInlineSnapshot(`
      {
        "art-sign": "78fd8beacaf5d494 (72 calls)",
        "balloons": "89b514d9331b5c37 (132 calls)",
        "confetti": "7b2a0e62796ccb97 (112 calls)",
        "framed-picture": "6dc6767b9bfb6da5 (6412 calls)",
        "gallery-elf": "f95708b981a3adeb (400 calls)",
        "mirrorball": "a30b68871b78f669 (164 calls)",
        "mobile": "a8b76c289d18d0d9 (160 calls)",
        "neon-art": "9fe2100d7c4f5c16 (228 calls)",
        "statue": "1a04961e26c9def7 (496 calls)",
        "velvet-rope": "3afe8daee5fa45e6 (68 calls)",
        "wall-sign": "1c45b627ce5425a0 (304 calls)",
      }
    `);
  });

  it('hangs every picture, the old ones and the modern ones, from its variant', () => {
    expect(PICTURES.map((_, n) => pictureOf((n + 0.5) / PICTURES.length))).toEqual(
      PICTURES.map((_, n) => n),
    );
    expect(pictureOf(1)).toBe(PICTURES.length - 1);
    expect(pictureOf(0)).toBe(0);
    expect(new Set(PICTURES.map(({ style }) => style))).toEqual(new Set(['old', 'modern']));
  });

  it('moves calmly: the neon never goes dark, the eyes and the mobile drift slowly', () => {
    for (let time = 0; time < 10_000; time += 97) {
      expect(neonAt(time, 0.3)).toBeGreaterThanOrEqual(0.7);
      expect(Math.abs(eyesFollow(time + 100) - eyesFollow(time))).toBeLessThan(0.05);
      expect(mobileTurn(time + 100, 0) - mobileTurn(time, 0)).toBeLessThan(0.02);
    }
  });

  it('lays the confetti flat, for people to walk over', () => {
    expect(FLAT.has('confetti')).toBe(true);
    expect(LEVEL_PROPS.confetti.blocks).toBe(false);
  });
});
