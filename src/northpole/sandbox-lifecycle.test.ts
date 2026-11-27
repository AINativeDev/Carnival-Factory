// @vitest-environment happy-dom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { bitmap, FakeBitmap, fakeContext, frameOf, playFrame } from './sandbox-fakes';
import { theme } from './theme';

/**
 * A sandboxed square's life beyond its first frame (sandbox.ts): a square
 * the map keeps drawing keeps running, an open one is never timed out, and
 * one page's listener stopping leaves the others listening.
 */
async function sandbox() {
  vi.resetModules();
  return import('./sandbox');
}

beforeEach(() => {
  vi.useFakeTimers();
  vi.stubGlobal('ImageBitmap', FakeBitmap);
  vi.spyOn(console, 'error').mockImplementation(() => undefined);
  document.body.innerHTML = '';
});
afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('a sandboxed square while the map draws it', () => {
  it('keeps running as long as the map keeps drawing it', async () => {
    const { sandboxedSquare, IDLE_RELEASE_MS } = await sandbox();
    const square = sandboxedSquare('booth', 'elf');
    const { canvas } = fakeContext();
    square.draw(canvas, 100, 0);
    const iframe = frameOf('elf');
    for (let i = 0; i < 4; i++) {
      vi.advanceTimersByTime(IDLE_RELEASE_MS / 2);
      square.draw(canvas, 100, 0);
    }
    expect(frameOf('elf')).toBe(iframe);
  });

  it('says which square never opened, and when it gave up', async () => {
    const { sandboxedSquare } = await sandbox();
    sandboxedSquare('attraction', 'slow-wheel').draw(fakeContext().canvas, 100, 0);
    vi.advanceTimersByTime(10_000);
    expect(console.error).toHaveBeenCalledExactlyOnceWith(
      "The attraction slow-wheel didn't open within 10s",
    );
  });

  it('never times out a square that opened in time', async () => {
    const { sandboxedSquare } = await sandbox();
    const square = sandboxedSquare('booth', 'elf');
    const { ctx, canvas } = fakeContext();
    square.draw(canvas, 100, 0);
    const frame = playFrame('elf');
    frame.send({ type: 'ready', name: 'Elf Shop', description: '' });
    square.draw(canvas, 100, 0);
    frame.send({ type: 'frame', bitmap: bitmap(100), drawMs: 1 });
    vi.advanceTimersByTime(10_000);
    square.draw(canvas, 100, 0);
    expect(frame.iframe.dataset.state).toBe('ready');
    expect(console.error).not.toHaveBeenCalled();
    expect(ctx.drawImage).toHaveBeenCalledOnce();
  });
});

describe('the stand-in picture', () => {
  /** A context that remembers the colour each fill was made in. */
  function fillColours() {
    const fills: string[] = [];
    const ctx = {
      fillStyle: '',
      font: '',
      textAlign: '',
      fillRect() {
        fills.push(ctx.fillStyle);
      },
      fillText: () => undefined,
      drawImage: () => undefined,
    };
    return { fills, canvas: ctx as unknown as CanvasRenderingContext2D };
  }

  it('is snow while the square opens, and the surface once it is broken', async () => {
    const { sandboxedSquare } = await sandbox();
    const square = sandboxedSquare('booth', 'elf');
    const { fills, canvas } = fillColours();
    square.draw(canvas, 100, 0);
    playFrame('elf').send({ type: 'error', message: 'it threw' });
    square.draw(canvas, 100, 0);
    expect(fills).toEqual([theme.colors.snow, theme.colors.surface]);
  });
});

describe("the page's listeners for links out", () => {
  it('stops only the listener that asked to stop, however often it asks', async () => {
    const { sandboxedSquare } = await sandbox();
    const square = sandboxedSquare('attraction', 'the-studio');
    const { canvas } = fakeContext();
    const first = vi.fn();
    const second = vi.fn();
    const stopFirst = square.onLink(first);
    square.onLink(second);
    stopFirst();
    stopFirst();
    square.draw(canvas, 100, 0);
    const frame = playFrame('the-studio');
    frame.send({ type: 'ready', name: 'The Studio', description: '' });
    square.draw(canvas, 100, 0);
    frame.send({ type: 'frame', bitmap: bitmap(100), drawMs: 1, open: 1 });
    expect(first).not.toHaveBeenCalled();
    expect(second).toHaveBeenCalledExactlyOnceWith(1);
  });
});
