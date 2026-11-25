// @vitest-environment happy-dom
/**
 * Pins what the map draws while a visitor walks an indoor level (ADR 0040):
 * the dark round the room, its walls and floor from the cached layers, no
 * fence, string lights or snowfall, and a square on its display.
 */
import { afterEach, describe, expect, it } from 'vitest';
import { fingerprint, type CanvasCall } from '../test-support/recording-canvas';
import { startHarness, type MapHarness } from '../test-support/map-harness';
import { LEVEL, levelOptions, square, type Told } from '../test-support/map-fixtures';
import { levelWorld, type NorthPoleLevel } from './level';

let map: MapHarness | undefined;
afterEach(() => map?.stop());

const ROOM: NorthPoleLevel = {
  ...LEVEL,
  indoor: true,
  props: [
    { kind: 'blackboard', x: 4, y: 0 },
    { kind: 'wall-window', x: 0, y: 4 },
    { kind: 'rug', x: 6, y: 9 },
    { kind: 'spotlight', x: 10, y: 2 },
  ],
};

describe('walking an indoor level', () => {
  it('draws the room and its items, with no sky, fence or snow', () => {
    const told: Told = [];
    const item = {
      ...square('skates'),
      stall: { shape: 'kiosk', roof: 'gold', display: true } as const,
    };
    map = startHarness(
      levelOptions(told, {
        attractions: [item, square('cocoa')],
        level: { id: 'tester', name: 'Test Room', world: levelWorld(ROOM), tint: 'tint' },
      }),
    );
    const all: CanvasCall[] = [...map.started];
    for (const time of [0, 16, 500, 1200]) all.push(...map.step(time));
    expect(fingerprint(all)).toMatchInlineSnapshot(`"764d3c4207608380 (7234 calls)"`);
  });
});
