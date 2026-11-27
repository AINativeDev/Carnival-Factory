// @vitest-environment happy-dom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { drawingOf, type CanvasCall } from '../test-support/recording-canvas';
import { theme } from './theme';
import { drawScene } from './visit-scenes';

/** Every call of a scene, word for word, so a changed number or colour shows. */
const { colors } = theme;
const stage = { x: 100, y: 0, w: 800, h: 800 };
const named = (calls: CanvasCall[]) =>
  calls.map((call) => call.map((arg) => (arg instanceof HTMLCanvasElement ? 'canvas' : arg)));

afterEach(() => {
  vi.restoreAllMocks();
});

describe("a scene's calls, one by one", () => {
  it('glows: night at half strength and more, then the shrunk drawing stretched over the screen', () => {
    const scratch = document.createElement('canvas');
    const calls = drawingOf((ctx) => {
      drawScene(undefined, { ctx, width: 1000, height: 800, stage, scratch, size: 640 });
    });
    expect(named(calls)).toEqual([
      ['save'],
      ['=globalCompositeOperation', 'destination-over'],
      ['=fillStyle', colors.night],
      ['=globalAlpha', 0.55],
      ['fillRect', 0, 0, 1000, 800],
      ['=globalAlpha', 1],
      ['drawImage', 'canvas', 0, 0, 1000, 800],
      ['fillRect', 0, 0, 1000, 800],
      ['restore'],
    ]);
  });

  it('shrinks the whole of the last picture into the glow, twelve pixels across', () => {
    const scratch = document.createElement('canvas');
    const drawn: unknown[][] = [];
    const sizes: number[][] = [];
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockImplementation(function (
      this: HTMLCanvasElement,
    ) {
      sizes.push([this.width, this.height]);
      return { drawImage: (...args: unknown[]) => drawn.push(args) } as unknown as null;
    });
    drawingOf((ctx) => {
      drawScene('glow', { ctx, width: 1000, height: 800, stage, scratch, size: 640 });
    });
    expect(sizes).toEqual([[12, 12]]);
    expect(drawn).toEqual([[scratch, 0, 0, 640, 640, 0, 0, 12, 12]]);
  });

  it('lights chiaroscuro from above the upper left, a warm pool under the night', () => {
    const calls = drawingOf((ctx) => {
      const scratch = document.createElement('canvas');
      drawScene('chiaroscuro', { ctx, width: 1000, height: 800, stage, scratch, size: 800 });
    });
    expect(calls).toEqual([
      ['save'],
      ['=globalCompositeOperation', 'destination-over'],
      ['createRadialGradient', 324, 144, 0, 324, 144, 880],
      ['gradient-0.addColorStop', 0, colors.lantern],
      ['gradient-0.addColorStop', 0.5, colors.gingerbread],
      ['gradient-0.addColorStop', 1, 'transparent'],
      ['=globalAlpha', 0.5],
      ['=fillStyle', 'gradient-0'],
      ['fillRect', 0, 0, 1000, 800],
      ['=globalAlpha', 1],
      ['=fillStyle', colors.night],
      ['fillRect', 0, 0, 1000, 800],
      ['restore'],
    ]);
  });
});
