// @vitest-environment happy-dom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { bitmap, FakeBitmap, fakeContext, frameOf, lastWords, playFrame } from './sandbox-fakes';

/** A fresh sandbox per test, since it keeps its running frames and their holder. */
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

describe('a sandboxed square’s frame', () => {
  it('starts only when the square is drawn, so only squares in view wake', async () => {
    const { sandboxedSquare } = await sandbox();
    const drawn = sandboxedSquare('booth', 'elf');
    sandboxedSquare('booth', 'offscreen');
    expect(document.querySelectorAll('iframe')).toHaveLength(0);
    drawn.draw(fakeContext().canvas, 100, 0);
    expect(document.querySelectorAll('iframe')).toHaveLength(1);
    expect(frameOf('offscreen')).toBeUndefined();
  });

  it('is sandboxed to scripts alone, off screen and out of reach', async () => {
    const { sandboxedSquare } = await sandbox();
    const { ctx, canvas } = fakeContext();
    sandboxedSquare('level', 'cocoa-hut', 'jedi4ever').draw(canvas, 100, 0);
    const iframe = frameOf('jedi4ever/cocoa-hut');
    expect(iframe?.getAttribute('sandbox')).toBe('allow-scripts');
    expect(iframe?.referrerPolicy).toBe('no-referrer');
    expect(iframe?.tabIndex).toBe(-1);
    expect(iframe?.title).toBe('level jedi4ever/cocoa-hut');
    expect(iframe?.dataset).toMatchObject({ kind: 'level', state: 'loading' });
    expect(iframe?.src).toBe(
      new URL('square.html?v=dev#level/jedi4ever/cocoa-hut', document.baseURI).href,
    );
    expect(iframe?.parentElement?.getAttribute('aria-hidden')).toBe('true');
    expect(iframe?.parentElement?.style.pointerEvents).toBe('none');
    expect(lastWords(ctx)).toBe('Opening…');
  });

  it('tells the page its name, description and stall once ready', async () => {
    const { sandboxedSquare } = await sandbox();
    const square = sandboxedSquare('booth', 'elf');
    expect(square).toMatchObject({ kind: 'booth', id: 'elf', name: 'elf', description: '' });
    const heard = vi.fn();
    const failing = vi.fn(() => {
      throw new Error('one page’s listener');
    });
    square.onReady(failing);
    square.onReady(heard);
    square.draw(fakeContext().canvas, 100, 0);
    const frame = playFrame('elf');
    const stall = { shape: 'shed', roof: 'gold' };
    frame.send({ type: 'ready', name: 'Elf Shop', description: 'Toys.', stall });
    frame.send({ type: 'ready', name: 'Again', description: '' });
    expect(failing).toHaveBeenCalledOnce();
    expect(heard).toHaveBeenCalledExactlyOnceWith({
      name: 'Elf Shop',
      description: 'Toys.',
      stall,
    });
    expect(square).toMatchObject({ name: 'Elf Shop', description: 'Toys.', stall });
    expect(frame.iframe.dataset.state).toBe('ready');
    const late = vi.fn();
    square.onReady(late);
    expect(late).toHaveBeenCalledWith({ name: 'Elf Shop', description: 'Toys.', stall });
  });

  it('shows "Under construction" for a square that never opens', async () => {
    const { sandboxedSquare } = await sandbox();
    const { ctx, canvas } = fakeContext();
    const square = sandboxedSquare('attraction', 'slow-wheel');
    square.draw(canvas, 100, 0);
    const frame = playFrame('slow-wheel');
    vi.advanceTimersByTime(9_999);
    square.draw(canvas, 100, 0);
    expect(lastWords(ctx)).toBe('Opening…');
    vi.advanceTimersByTime(1);
    square.draw(canvas, 100, 0);
    expect(lastWords(ctx)).toBe('Under construction');
    expect(frame.iframe.dataset.state).toBe('broken');
    frame.send({ type: 'ready', name: 'Too late', description: '' });
    expect(square.name).toBe('slow-wheel');
    expect(frame.requests).not.toHaveBeenCalled();
  });

  it('releases a frame nobody draws, and restarts it with its name kept', async () => {
    const { sandboxedSquare, IDLE_RELEASE_MS } = await sandbox();
    const { ctx, canvas } = fakeContext();
    const square = sandboxedSquare('booth', 'elf');
    const heard = vi.fn();
    square.onReady(heard);
    square.draw(canvas, 100, 0);
    const first = playFrame('elf');
    first.send({ type: 'ready', name: 'Elf Shop', description: '' });
    square.draw(canvas, 100, 0);
    first.send({ type: 'frame', bitmap: bitmap(100), drawMs: 1 });
    vi.advanceTimersByTime(IDLE_RELEASE_MS + 5000);
    expect(frameOf('elf')).toBeUndefined();
    expect(vi.getTimerCount()).toBe(0);
    first.send({ type: 'error', message: 'from the old frame' });
    square.draw(canvas, 100, 0);
    expect(ctx.drawImage).toHaveBeenCalledOnce();
    const second = playFrame('elf');
    expect(second.iframe).not.toBe(first.iframe);
    second.send({ type: 'ready', name: 'Elf Shop', description: '' });
    expect(heard).toHaveBeenCalledOnce();
    expect(square.name).toBe('Elf Shop');
  });

  it('runs at most MAX_LIVE_FRAMES, releasing the least recently drawn', async () => {
    const { sandboxedSquare, MAX_LIVE_FRAMES } = await sandbox();
    const { ctx, canvas } = fakeContext();
    const squares = Array.from({ length: MAX_LIVE_FRAMES + 1 }, (_, i) =>
      sandboxedSquare('booth', `elf-${i}`),
    );
    for (const square of squares) {
      square.draw(canvas, 100, 0);
      vi.advanceTimersByTime(100);
    }
    expect(document.querySelectorAll('iframe')).toHaveLength(MAX_LIVE_FRAMES);
    expect(frameOf('elf-0')).toBeUndefined();
    // Restarted later, the first square isn't timed out by its released frame's clock.
    squares[0]?.draw(canvas, 100, 0);
    vi.advanceTimersByTime(8000);
    squares[0]?.draw(canvas, 100, 0);
    expect(lastWords(ctx)).toBe('Opening…');
    expect(frameOf('elf-0')?.dataset.state).toBe('loading');
  });

  it('keeps a broken square broken once its frame is released', async () => {
    const { sandboxedSquare, IDLE_RELEASE_MS } = await sandbox();
    const { ctx, canvas } = fakeContext();
    const square = sandboxedSquare('booth', 'elf');
    square.draw(canvas, 100, 0);
    playFrame('elf').send({ type: 'error', message: 'it threw' });
    vi.advanceTimersByTime(IDLE_RELEASE_MS + 5000);
    expect(frameOf('elf')).toBeUndefined();
    square.draw(canvas, 100, 0);
    expect(frameOf('elf')).toBeUndefined();
    expect(lastWords(ctx)).toBe('Under construction');
  });

  it('never times out a frame that was released before it opened', async () => {
    const { sandboxedSquare, MAX_LIVE_FRAMES } = await sandbox();
    const { ctx, canvas } = fakeContext();
    const first = sandboxedSquare('booth', 'elf-first');
    first.draw(canvas, 100, 0);
    for (let i = 0; i < MAX_LIVE_FRAMES; i++)
      sandboxedSquare('booth', `elf-${i}`).draw(canvas, 100, 0);
    expect(frameOf('elf-first')).toBeUndefined();
    vi.advanceTimersByTime(10_000);
    first.draw(canvas, 100, 0);
    expect(lastWords(ctx)).toBe('Opening…');
    expect(frameOf('elf-first')?.dataset.state).toBe('loading');
  });
});
