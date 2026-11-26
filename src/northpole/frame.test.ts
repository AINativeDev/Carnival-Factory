import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

/**
 * The frame that supervises a square's worker (frame.ts), run with a worker
 * the test speaks for and the map as a recorder. The frame starts when its
 * script loads, so each test loads it afresh.
 */
class FakeBitmap {
  close = vi.fn();
}

type Listener = (event: unknown) => void;

/** The square's worker, as the frame sees it: what the frame sent it, and a way to answer. */
class FakeWorker {
  static last: FakeWorker | undefined;
  readonly sent: unknown[] = [];
  readonly terminate = vi.fn();
  private readonly listeners = new Map<string, Listener>();
  constructor() {
    FakeWorker.last = this;
  }
  addEventListener(type: string, listener: Listener) {
    this.listeners.set(type, listener);
  }
  postMessage(message: unknown) {
    this.sent.push(message);
  }
  /** The worker posts `data` to the frame. */
  says(data: unknown) {
    this.listeners.get('message')?.({ data });
  }
  /** The worker's script fails, with `message` or none. */
  fails(message: string) {
    this.listeners.get('error')?.({ message, preventDefault: vi.fn() });
  }
}

vi.mock('./square-worker.ts?worker&inline', () => ({ default: FakeWorker }));

const map = { postMessage: vi.fn() };
let fromMap: Listener = () => undefined;

/** Loads the frame for `square.html#booth/ana`, and gives back its worker. */
async function startFrame() {
  vi.resetModules();
  await import('./frame');
  const worker = FakeWorker.last;
  if (!worker) throw new Error('the frame started no worker');
  return worker;
}

/** What the frame told the map, in order. */
const toldMap = () => map.postMessage.mock.calls.map(([message]) => message as unknown);

/** A draw request from the map, at its own origin, or from somewhere else. */
const draw = (source: unknown = map, origin = location.origin) => {
  fromMap({ source, origin, data: { type: 'draw', size: 64, time: 0 } });
};

beforeEach(() => {
  vi.useFakeTimers();
  map.postMessage.mockClear();
  vi.stubGlobal('parent', map);
  vi.stubGlobal('location', { hash: '#booth/ana' });
  vi.stubGlobal('ImageBitmap', FakeBitmap);
  vi.stubGlobal('addEventListener', (_type: string, listener: Listener) => (fromMap = listener));
});

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

/** A frame whose square has loaded, ready to draw. */
async function readyFrame() {
  const worker = await startFrame();
  worker.says({ type: 'started' });
  worker.says({ type: 'ready', name: 'Cocoa' });
  return worker;
}

describe('starting a square', () => {
  it('asks the worker to load the square at its address once its script has run', async () => {
    const worker = await startFrame();
    worker.says({ type: 'started' });
    expect(worker.sent).toEqual([{ type: 'load', hash: '#booth/ana' }]);
    worker.says({ type: 'ready', name: 'Cocoa' });
    expect(toldMap()).toEqual([{ type: 'ready', name: 'Cocoa' }]);
  });

  it('drops what the worker posts out of turn, closing any bitmap', async () => {
    const worker = await startFrame();
    const bitmap = new FakeBitmap();
    worker.says({ type: 'frame', bitmap });
    worker.says(null);
    worker.says({ type: 42 });
    expect(bitmap.close).toHaveBeenCalled();
    expect(toldMap()).toEqual([]);
  });

  it('stops a square that takes too long to load', async () => {
    const worker = await startFrame();
    worker.says({ type: 'started' });
    vi.advanceTimersByTime(1001);
    expect(worker.terminate).toHaveBeenCalledOnce();
    expect(toldMap()).toEqual([
      { type: 'error', message: 'It took over 1000 ms to load, so it was stopped' },
    ]);
    worker.says({ type: 'ready' });
    worker.fails('again');
    expect(toldMap()).toHaveLength(1);
  });

  it('stops a square that fails to load', async () => {
    const worker = await startFrame();
    worker.says({ type: 'started' });
    worker.says({ type: 'error', message: 'no such booth' });
    expect(toldMap()).toEqual([
      { type: 'error', message: 'no such booth' },
      { type: 'error', message: 'It kept failing, so it was stopped' },
    ]);
    expect(worker.terminate).toHaveBeenCalledOnce();
  });

  it("stops a square whose script fails, saying why, or that its code didn't load", async () => {
    const worker = await startFrame();
    worker.fails('SyntaxError');
    expect(toldMap()).toEqual([{ type: 'error', message: 'SyntaxError' }]);
    const other = await startFrame();
    other.fails('');
    expect(toldMap().at(-1)).toEqual({ type: 'error', message: 'Its code failed to load' });
  });
});

describe('drawing a square', () => {
  it("passes the map's draw requests on, and its frames back with their bitmaps", async () => {
    const worker = await readyFrame();
    draw();
    expect(worker.sent.at(-1)).toEqual({ type: 'draw', size: 64, time: 0 });
    const bitmap = new FakeBitmap();
    worker.says({ type: 'frame', bitmap });
    // Only the map's own origin can hear it.
    expect(map.postMessage).toHaveBeenLastCalledWith({ type: 'frame', bitmap }, location.origin, [
      bitmap,
    ]);
  });

  it('ignores requests from anyone but the map, ones it cannot read, and ones while it is busy', async () => {
    const worker = await readyFrame();
    draw({});
    // The map's own window, but from another origin: not the map.
    draw(map, 'https://elsewhere.example');
    fromMap({ source: map, origin: location.origin, data: { type: 'draw', size: -1, time: 0 } });
    expect(worker.sent).toHaveLength(1);
    draw();
    draw();
    expect(worker.sent).toHaveLength(2);
  });

  it('stops a square that takes too long to draw a frame', async () => {
    const worker = await readyFrame();
    draw();
    vi.advanceTimersByTime(1001);
    expect(worker.terminate).toHaveBeenCalledOnce();
    expect(toldMap().at(-1)).toEqual({
      type: 'error',
      message: 'It took over 1000 ms to draw a frame, so it was stopped',
    });
    draw();
    expect(worker.sent).toHaveLength(2);
  });

  it('forgives a failed frame or two, but stops a square that fails three in a row', async () => {
    const worker = await readyFrame();
    const fail = () => {
      draw();
      worker.says({ type: 'error', message: 'oops' });
    };
    fail();
    fail();
    draw();
    worker.says({ type: 'frame', bitmap: new FakeBitmap() });
    fail();
    fail();
    expect(worker.terminate).not.toHaveBeenCalled();
    fail();
    expect(worker.terminate).toHaveBeenCalledOnce();
    expect(toldMap().at(-1)).toEqual({
      type: 'error',
      message: 'It kept failing, so it was stopped',
    });
  });
});
