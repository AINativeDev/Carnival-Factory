import { describe, expect, it } from 'vitest';
import { drawingOf, fingerprint } from '../test-support/recording-canvas';
import { roomArea, roomLayout } from './interior';
import { drawRoom, drawRoomPerson } from './interior-room';
import { theme } from './theme';

/**
 * Pins what the room inside a square draws, so splitting interior.ts by
 * concern (docs/adr/0019-small-files.md) is proven to draw exactly the same.
 */
const laptop = roomLayout(roomArea(1280, 720));
const tiny = roomLayout({ x: 0, y: 0, w: 120, h: 100 });

describe('the room inside a square draws the same as before it was split', () => {
  it("draws a booth's room, with its owner's portrait and sign", () => {
    const calls = drawingOf((ctx) => {
      drawRoom(ctx, laptop, 1280, 720, 'Cocoa corner', '@someone');
    });
    expect(fingerprint(calls)).toBe('b11d0b0a101c24b5 (301 calls)');
  });

  it("draws an attraction's room, with the North Pole's emblem", () => {
    const calls = drawingOf((ctx) => {
      drawRoom(ctx, laptop, 1280, 720, 'Ferris wheel', '');
    });
    expect(fingerprint(calls)).toBe('5fbc41b7016ef023 (285 calls)');
  });

  it('leaves the portrait out of a room too small for it', () => {
    const calls = drawingOf((ctx) => {
      drawRoom(ctx, tiny, 120, 100, 'Tiny', '@someone');
    });
    expect(fingerprint(calls)).toBe('fce5e8df7513638f (266 calls)');
  });

  it('draws the player standing in the room', () => {
    const look = { coat: theme.colors.berry, hat: theme.colors.pine, scale: 1.25 };
    const calls = drawingOf((ctx) => {
      drawRoomPerson(ctx, laptop, { x: 0.4, y: 0.7 }, look, 1, true, 2345);
    });
    expect(fingerprint(calls)).toBe('24e34d093d6d3812 (41 calls)');
  });
});
