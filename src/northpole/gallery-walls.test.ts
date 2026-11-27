import { describe, expect, it } from 'vitest';
import { drawingOf, fingerprint } from '../test-support/recording-canvas';
import { drawNeonArt, drawWallSign, neonAt } from './gallery-walls';
import { LEVEL_PROPS, propPlace, type LevelPropKind } from './level-props';
import type { ShowKind } from './show';
import type { Thing } from './world';

/** A wall prop as a room hangs it at (x, y), on the wall its place gives it. */
function onWall(kind: LevelPropKind & ShowKind, x: number, y: number, seed: number): Thing {
  const { box, wall } = propPlace(kind, { x, y });
  const thing: Thing = { kind, ...box, seed, blocks: LEVEL_PROPS[kind].blocks };
  return wall ? { ...thing, wall } : thing;
}

/** Draws with words that measure wide, so each line's room to fit them shows in the drawing. */
const wideWords = (draw: (ctx: CanvasRenderingContext2D) => void) =>
  fingerprint(
    drawingOf((ctx) => {
      draw(
        new Proxy(ctx, {
          get: (target, key) =>
            key === 'measureText'
              ? (text: string) => ({ width: text.length * 9 })
              : (Reflect.get(target, key) as unknown),
        }),
      );
    }),
  );

describe("the Year in Review's wall signs", () => {
  it('fit their words to the wall they hang on', () => {
    const prints = [
      [3, 0],
      [0, 3],
    ].map(([x = 0, y = 0]) => [
      wideWords((ctx) => {
        drawNeonArt(ctx, onWall('neon-art', x, y, 0.3), 1000);
      }),
      wideWords((ctx) => {
        drawWallSign(ctx, onWall('wall-sign', x, y, 0.2));
      }),
      wideWords((ctx) => {
        drawWallSign(ctx, onWall('wall-sign', x, y, 0.8));
      }),
    ]);
    expect(prints).toMatchInlineSnapshot(`
      [
        [
          "6075dbc451daf2fd (55 calls)",
          "2d448c492a433616 (34 calls)",
          "31bcd53f9dadd74c (34 calls)",
        ],
        [
          "9971126a1205176a (55 calls)",
          "9666719e34200c19 (34 calls)",
          "8f79931e62a6f0e1 (34 calls)",
        ],
      ]
    `);
  });

  it('look back in the old wing below a variant of one half, and ahead from one half up', () => {
    const sign = (seed: number) =>
      drawingOf((ctx) => {
        drawWallSign(ctx, onWall('wall-sign', 3, 0, seed));
      });
    expect(sign(0.5)).toEqual(sign(0.9));
    expect(sign(0.49)).toEqual(sign(0.1));
    expect(sign(0.49)).not.toEqual(sign(0.5));
  });

  it('keep the neon softly lit, its own way for each variant', () => {
    expect(neonAt(0, 0)).toBe(0.85);
    expect(neonAt(2200 * (Math.PI / 2), 0)).toBeCloseTo(1);
    expect(neonAt(0, Math.PI / 14)).toBeCloseTo(1);
  });
});
