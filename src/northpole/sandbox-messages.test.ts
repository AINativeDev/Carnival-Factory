// @vitest-environment happy-dom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { bitmap, FakeBitmap, fakeContext, lastWords, playFrame } from './sandbox-fakes';

/** A square whose frame has opened and said its name, with a test playing that frame. */
async function readySquare(id = 'elf') {
  vi.resetModules();
  const { sandboxedSquare } = await import('./sandbox');
  const { ctx, canvas } = fakeContext();
  const square = sandboxedSquare('booth', id);
  square.draw(canvas, 100, 0);
  const frame = playFrame(id);
  frame.send({ type: 'ready', name: 'Elf Shop', description: '' });
  return { square, frame, ctx, canvas };
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

describe('what a sandboxed square hears from its frame', () => {
  it('ignores messages from any other window, and of the wrong shape', async () => {
    vi.resetModules();
    const { sandboxedSquare } = await import('./sandbox');
    const square = sandboxedSquare('booth', 'elf');
    square.draw(fakeContext().canvas, 100, 0);
    const frame = playFrame('elf');
    frame.send({ type: 'ready', name: 'Impostor', description: '' }, window);
    frame.send({ type: 'ready', name: 'Impostor', description: '' }, null);
    frame.send({ type: 'hello', name: 'Impostor' });
    frame.send('ready');
    frame.send({ type: 'ready', name: '   ' });
    expect(square.name).toBe('elf');
    expect(frame.iframe.dataset.state).toBe('loading');
  });

  it('asks for one frame at a time, and draws the one it gets', async () => {
    const { square, frame, ctx, canvas } = await readySquare();
    square.draw(canvas, 99.6, 1.5);
    square.draw(canvas, 100, 2);
    expect(frame.requests).toHaveBeenCalledExactlyOnceWith(
      { type: 'draw', size: 100, time: 1.5 },
      '*',
    );
    expect(lastWords(ctx)).toBe('Opening…');
    frame.send({ type: 'frame', bitmap: bitmap(64), drawMs: 1 });
    square.draw(canvas, 100, 3);
    expect(frame.requests).toHaveBeenCalledOnce();
    const first = bitmap(100);
    frame.send({ type: 'frame', bitmap: first, drawMs: 1.26 });
    expect(frame.iframe.dataset.drawMs).toBe('1.3');
    square.draw(canvas, 100, 4);
    expect(ctx.drawImage).toHaveBeenCalledWith(first, 0, 0, 100, 100);
    expect(frame.requests).toHaveBeenCalledTimes(2);
    frame.send({ type: 'frame', bitmap: bitmap(100), drawMs: 1 });
    expect((first as unknown as FakeBitmap).close).toHaveBeenCalledOnce();
  });

  it('records the slowest frame once the square has warmed up', async () => {
    const { square, frame, canvas } = await readySquare();
    for (const drawMs of [50, 50, 50, 50, 50, 4, 7.04, 6]) {
      square.draw(canvas, 100, 0);
      frame.send({ type: 'frame', bitmap: bitmap(100), drawMs });
    }
    expect(frame.iframe.dataset.slowestDrawMs).toBe('7');
  });

  it('breaks after three errors in a row, and a good frame forgives them', async () => {
    const { square, frame, ctx, canvas } = await readySquare();
    frame.send({ type: 'error', message: 'one' });
    frame.send({ type: 'error', message: 'two' });
    square.draw(canvas, 100, 0);
    frame.send({ type: 'frame', bitmap: bitmap(100), drawMs: 1 });
    frame.send({ type: 'error', message: 'three' });
    frame.send({ type: 'error', message: 'four' });
    expect(frame.iframe.dataset.state).toBe('ready');
    frame.send({ type: 'error', message: 'five' });
    expect(frame.iframe.dataset.state).toBe('broken');
    expect(console.error).toHaveBeenCalledWith('The booth elf failed:', 'five');
    square.draw(canvas, 100, 0);
    expect(lastWords(ctx)).toBe('Under construction');
  });

  it('breaks at once when it fails before it opens', async () => {
    vi.resetModules();
    const { sandboxedSquare } = await import('./sandbox');
    const square = sandboxedSquare('booth', 'elf');
    square.draw(fakeContext().canvas, 100, 0);
    const frame = playFrame('elf');
    frame.send({ type: 'error', message: 'it threw' });
    expect(frame.iframe.dataset.state).toBe('broken');
  });

  it('counts a frame that stops answering as an error, and asks again', async () => {
    const { square, frame, ctx, canvas } = await readySquare();
    for (let hang = 1; hang <= 3; hang++) {
      square.draw(canvas, 100, 0);
      vi.advanceTimersByTime(2000);
      square.draw(canvas, 100, 0);
      expect(frame.requests).toHaveBeenCalledTimes(hang);
      vi.advanceTimersByTime(1);
    }
    square.draw(canvas, 100, 0);
    expect(frame.requests).toHaveBeenCalledTimes(3);
    expect(frame.iframe.dataset.state).toBe('broken');
    square.draw(canvas, 100, 0);
    expect(lastWords(ctx)).toBe('Under construction');
    expect(console.error).toHaveBeenCalledWith('The booth elf failed:', 'it stopped answering');
  });
});

describe('what a sandboxed square tells its frame of the pointer', () => {
  it('sends the pointer at the size it asked for', async () => {
    const { square, frame, canvas } = await readySquare();
    square.draw(canvas, 50, 0, { x: 25, y: 50, down: false, presses: 0 });
    expect(frame.requests).toHaveBeenCalledWith(
      { type: 'draw', size: 50, time: 0, pointer: { x: 25, y: 50, down: false, presses: 0 } },
      '*',
    );
  });

  it('keeps a quick tap made while the frame was busy for the next request', async () => {
    const { square, frame, canvas } = await readySquare();
    square.draw(canvas, 100, 0);
    square.draw(canvas, 200, 1, { x: 100, y: 40, down: true, presses: 1 });
    square.draw(canvas, 100, 2);
    frame.send({ type: 'frame', bitmap: bitmap(100), drawMs: 1 });
    square.draw(canvas, 100, 3);
    expect(frame.requests).toHaveBeenLastCalledWith(
      { type: 'draw', size: 100, time: 3, pointer: { x: 50, y: 20, down: true, presses: 1 } },
      '*',
    );
  });

  it('sends at most MAX_PRESSES presses at once, and the rest after', async () => {
    const { square, frame, canvas } = await readySquare();
    square.draw(canvas, 100, 0);
    for (let i = 0; i < 3; i++)
      square.draw(canvas, 100, 0, { x: 1, y: 1, down: false, presses: 10 });
    frame.send({ type: 'frame', bitmap: bitmap(100), drawMs: 1 });
    square.draw(canvas, 100, 1, { x: 1, y: 1, down: false, presses: 0 });
    frame.send({ type: 'frame', bitmap: bitmap(100), drawMs: 1 });
    square.draw(canvas, 100, 2, { x: 1, y: 1, down: false, presses: 0 });
    const presses = frame.requests.mock.calls.map(
      ([request]) => (request as { pointer?: { presses: number } }).pointer?.presses,
    );
    expect(presses).toEqual([undefined, 20, 10]);
  });
});
