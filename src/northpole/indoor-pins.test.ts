/**
 * Pins what an indoor level draws (ADR 0040): its furniture and what hangs on
 * its walls, the room itself and its floor, so a later split or tidy is
 * proven to draw the same (docs/adr/0024-test-first.md).
 */
import { describe, expect, it } from 'vitest';
import { drawingOf, fingerprint } from '../test-support/recording-canvas';
import { islandCorners } from './camera';
import { drawGround, drawLightPools } from './ground';
import { levelWorld, type NorthPoleLevel } from './level';
import { LEVEL_PROPS, propPlace, type LevelPropKind } from './level-props';
import { drawRoom } from './room';
import { drawShow, type ShowKind } from './show';
import { onAirAt } from './wall-things';
import type { Thing } from './world';

/** The indoor catalogue: what stands on the floor, and what hangs on a wall. */
const INDOORS = [
  'plant',
  'shelf',
  'rug',
  'sofa',
  'desk',
  'globe',
  'spotlight',
  'cable',
  'acoustic-panel',
  'wall-window',
  'blackboard',
  'projector-screen',
  'on-air-light',
  'wall-door',
] as const satisfies readonly (LevelPropKind & ShowKind)[];

/** A prop as a room lays it out at (x, y) of an 11 by 11 room. */
const thingAt = (kind: (typeof INDOORS)[number], x: number, y: number, seed: number): Thing => {
  const { box, wall } = propPlace(kind, { x, y });
  const thing: Thing = {
    kind,
    ...box,
    x: box.x - 5,
    y: box.y - 5,
    seed,
    blocks: LEVEL_PROPS[kind].blocks,
  };
  return wall ? { ...thing, wall } : thing;
};

const ROOM: NorthPoleLevel = {
  id: 'someone',
  name: 'A room',
  description: 'A test room.',
  theme: 'dusk',
  indoor: true,
  size: 11,
  ground: [{ tile: 'carpet', area: { x: 3, y: 3, w: 3, h: 3 } }],
  props: [{ kind: 'spotlight', x: 8, y: 8 }],
  arrival: { x: 5, y: 9 },
  exits: [{ x: 6, y: 6 }],
};

describe("an indoor level's drawing", () => {
  it('draws every piece of furniture, on the floor and on both walls, as pinned', () => {
    const pins = INDOORS.map((kind) =>
      fingerprint(
        [0.2, 0.8].flatMap((seed) =>
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
    );
    expect(Object.fromEntries(INDOORS.map((kind, n) => [kind, pins[n]]))).toMatchInlineSnapshot(`
      {
        "acoustic-panel": "618ef61272b8edf5 (640 calls)",
        "blackboard": "e21eaf2ce7b2e6a3 (512 calls)",
        "cable": "918920e0215ce814 (56 calls)",
        "desk": "8f984ffb75ecd645 (496 calls)",
        "globe": "4048502459ec18d3 (424 calls)",
        "on-air-light": "b9543588630fbf3e (344 calls)",
        "plant": "aabae796a0ed0a70 (432 calls)",
        "projector-screen": "da38f13a2ce3685e (400 calls)",
        "rug": "a9b60042df13b07a (240 calls)",
        "shelf": "d4053066162791ca (2400 calls)",
        "sofa": "382fd5991063cc34 (928 calls)",
        "spotlight": "489f27bbb855edfc (320 calls)",
        "wall-door": "36b20cc2d4c4e2ed (520 calls)",
        "wall-window": "8e91c951950dbdba (288 calls)",
      }
    `);
  });

  it('keeps the ON AIR light glowing, swelling and fading without going dark', () => {
    for (let time = 0; time < 5_000; time += 97) {
      expect(onAirAt(time, 0.3)).toBeGreaterThanOrEqual(0.7);
      expect(onAirAt(time, 0.3)).toBeLessThanOrEqual(1);
    }
  });

  it('draws the room, its floor and the spotlight’s pool as pinned', () => {
    const world = levelWorld(ROOM);
    const room = drawingOf((ctx) => {
      drawRoom(ctx, world, islandCorners(world));
    });
    const floor = drawingOf((ctx) => {
      drawGround(ctx, world, { minX: -5, maxX: 5, minY: -5, maxY: 5 });
      drawLightPools(ctx, world, 1_000);
    });
    expect([fingerprint(room), fingerprint(floor)]).toMatchInlineSnapshot(`
      [
        "459034fcfbb50820 (2652 calls)",
        "76c1969b0fa2a26e (2227 calls)",
      ]
    `);
  });
});
