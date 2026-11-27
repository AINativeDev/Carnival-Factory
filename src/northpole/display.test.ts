/**
 * An item to discover in an indoor level (ADR 0040): a square on its display,
 * pinned, and the display kept from booths.
 */
import { describe, expect, it } from 'vitest';
import { drawingOf, fingerprint } from '../test-support/recording-canvas';
import { drawSpot } from './render';
import type { NorthPoleSquare } from './square';
import type { Spot } from './world';

describe('an item to discover', () => {
  const spot: Spot = {
    kind: 'attraction',
    id: 'globe',
    number: 0,
    x: 2,
    y: 2,
    w: 2,
    h: 2,
    door: { x: 4, y: 2 },
  };
  const square = (stall: NorthPoleSquare['stall']): NorthPoleSquare => ({
    id: 'globe',
    name: 'Globe',
    description: 'A globe.',
    draw: () => undefined,
    ...(stall ? { stall } : {}),
  });
  const drawn = (on: Spot, item: NorthPoleSquare) => {
    const painted: unknown[] = [];
    const calls = drawingOf((ctx) => {
      painted.push(drawSpot(ctx, on, item, (_square, mapping) => painted.push(mapping), 0));
    });
    return { calls, painted };
  };

  it('stands on a plinth with its name, its drawing on a framed card', () => {
    const { calls, painted } = drawn(spot, square({ shape: 'kiosk', roof: 'mint', display: true }));
    expect(calls.filter(([name]) => name === 'fillText').map(([, text]) => text)).toContain(
      'Globe',
    );
    expect(fingerprint(calls)).toMatchInlineSnapshot(`"9ae57f6ba2f97a5c (80 calls)"`);
    expect(painted).toMatchInlineSnapshot(`
      [
        {
          "origin": {
            "x": -10.56,
            "y": 24.559999999999988,
          },
          "u": {
            "x": 40.32000000000001,
            "y": -20.159999999999997,
          },
          "v": {
            "x": 0,
            "y": 40.32000000000001,
          },
        },
        {
          "h": 154.32,
          "w": 128,
          "x": -64,
          "y": -42.31999999999999,
        },
      ]
    `);
  });

  it('has a gold cloth when it names no colour, and is never a booth’s', () => {
    const plain = drawn(spot, {
      ...square(undefined),
      stall: { display: true } as NorthPoleSquare['stall'] & object,
    });
    expect(fingerprint(plain.calls)).toMatchInlineSnapshot(`"9daa09cc9a36cb40 (80 calls)"`);
    expect(fingerprint(plain.calls)).not.toBe(
      fingerprint(drawn(spot, square({ shape: 'kiosk', roof: 'mint', display: true })).calls),
    );
    const booth = { ...spot, kind: 'booth' as const, id: 'ana' };
    const style = { shape: 'kiosk', roof: 'mint' } as const;
    expect(fingerprint(drawn(booth, square({ ...style, display: true })).calls)).toBe(
      fingerprint(drawn(booth, square(style)).calls),
    );
  });

  it('faces the visitor from a door on its other side', () => {
    const { calls, painted } = drawn(
      { ...spot, door: { x: 2, y: 4 } },
      square({ shape: 'kiosk', roof: 'berry', display: true }),
    );
    expect(fingerprint([...calls, ['painted', painted]])).toMatchInlineSnapshot(
      `"69bb5ec69a7fee0a (81 calls)"`,
    );
  });
});
