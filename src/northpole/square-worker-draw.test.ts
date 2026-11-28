import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

/**
 * The worker's frames in detail (square-worker.ts): what it asks of its
 * canvas, how long it says a frame took, and the squares it refuses to load.
 * Four stand-in booths: jedi4ever's draws, and counts what it's given;
 * sjmaple's names itself but has no `draw`; hamzaoza's exports nothing;
 * pstember's draws but calls itself someone else.
 */
const drawn: unknown[][] = [];

vi.mock('../../carnival/booths/jedi4ever/booth.ts', () => ({
  default: {
    id: 'jedi4ever',
    name: 'Snow globe',
    description: 'A globe.',
    draw: (...args: unknown[]) => {
      drawn.push(args);
      vi.advanceTimersByTime(7);
    },
  },
}));
vi.mock('../../carnival/booths/sjmaple/booth.ts', () => ({
  default: { id: 'sjmaple', name: 'No drawing', draw: 'not a function' },
}));
vi.mock('../../carnival/booths/hamzaoza/booth.ts', () => ({ default: undefined }));
vi.mock('../../carnival/booths/pstember/booth.ts', () => ({
  default: { id: 'jedi4ever', name: 'Impostor', draw: () => undefined },
}));

/** A canvas that records each width it's given and each context it's asked for. */
class FakeCanvas {
  readonly widths: number[] = [];
  readonly contexts: string[] = [];
  #width: number;
  constructor(
    width: number,
    readonly height: number,
  ) {
    this.#width = width;
    canvases.push(this);
  }
  get width() {
    return this.#width;
  }
  set width(value: number) {
    this.widths.push(value);
    this.#width = value;
  }
  getContext(kind: string) {
    this.contexts.push(kind);
    return { kind };
  }
  transferToImageBitmap() {
    return { from: this.#width };
  }
}

let canvases: FakeCanvas[] = [];
let fromFrame: (event: { data: unknown }) => void = () => undefined;
const frame = vi.fn();
const say = (data: unknown) => {
  fromFrame({ data });
};

/** A fresh worker that has loaded `hash`, with what it answered. */
async function loadedWorker(hash: string) {
  vi.resetModules();
  await import('./square-worker');
  frame.mockClear();
  say({ type: 'load', hash });
  await vi.waitFor(() => {
    expect(frame).toHaveBeenCalled();
  });
  return frame.mock.calls.at(-1) as unknown[];
}

beforeEach(() => {
  vi.useFakeTimers();
  frame.mockClear();
  canvases = [];
  drawn.length = 0;
  vi.stubGlobal('postMessage', frame);
  vi.stubGlobal('OffscreenCanvas', FakeCanvas);
  vi.stubGlobal('addEventListener', (type: string, listener: typeof fromFrame) => {
    if (type === 'message') fromFrame = listener;
  });
});
afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

describe('loading a square that is not one', () => {
  it.each([
    ['#booth/sjmaple', "Error: The booth sjmaple doesn't export its NorthPoleSquare"],
    ['#booth/hamzaoza', "Error: The booth hamzaoza doesn't export its NorthPoleSquare"],
    ['#booth/pstember', "Error: The booth pstember doesn't export its NorthPoleSquare"],
    ['#attraction/no-such-ride', 'Error: No attraction called no-such-ride'],
    ['#level/jedi4ever/no-such-hut', 'Error: No level called no-such-hut'],
  ])('refuses %s, saying why', async (hash, message) => {
    expect(await loadedWorker(hash)).toEqual([{ type: 'error', message }, []]);
  });

  it('sends a ready square with no stall at all as one without', async () => {
    expect(await loadedWorker('#booth/jedi4ever')).toEqual([
      { type: 'ready', name: 'Snow globe', description: 'A globe.', stall: undefined },
      [],
    ]);
  });
});

describe('drawing a frame', () => {
  it('draws on a 2d context of a canvas the size asked, with the time and pointer', async () => {
    await loadedWorker('#booth/jedi4ever');
    const pointer = { x: 1, y: 2, down: true, presses: 3 };
    say({ type: 'draw', size: 48, time: 5, pointer });
    expect(canvases.map((canvas) => [canvas.width, canvas.height])).toEqual([[48, 48]]);
    expect(canvases[0]?.contexts).toEqual(['2d']);
    expect(drawn).toEqual([[{ kind: '2d' }, 48, 5, pointer, undefined]]);
  });

  it('passes on the keys heard, and drops a list it cannot read', async () => {
    await loadedWorker('#booth/jedi4ever');
    say({ type: 'draw', size: 48, time: 5, keys: ['right', 'space'] });
    say({ type: 'draw', size: 48, time: 6, keys: ['right', 'Escape'] });
    expect(drawn).toEqual([
      [{ kind: '2d' }, 48, 5, undefined, ['right', 'space']],
      [{ kind: '2d' }, 48, 6, undefined, undefined],
    ]);
  });

  it('says how long the drawing took, and asks for no link when the square has no ask', async () => {
    await loadedWorker('#booth/jedi4ever');
    vi.advanceTimersByTime(1000);
    say({ type: 'draw', size: 48, time: 0 });
    expect(Object.keys(frame.mock.lastCall?.[0] as object)).toEqual(['type', 'bitmap', 'drawMs']);
    expect(frame).toHaveBeenLastCalledWith({ type: 'frame', bitmap: { from: 48 }, drawMs: 7 }, [
      { from: 48 },
    ]);
  });

  it('wipes the canvas it keeps before each frame of the same size', async () => {
    await loadedWorker('#booth/jedi4ever');
    say({ type: 'draw', size: 48, time: 0 });
    say({ type: 'draw', size: 48, time: 1 });
    say({ type: 'draw', size: 48, time: 2 });
    expect(canvases).toHaveLength(1);
    expect(canvases[0]?.widths).toEqual([48, 48]);
    expect(canvases[0]?.contexts).toEqual(['2d', '2d', '2d']);
  });

  it('ignores a load message once loaded, and reads anything else as a draw request', async () => {
    await loadedWorker('#booth/jedi4ever');
    frame.mockClear();
    say({ type: 'load', hash: '#booth/jedi4ever' });
    say({ type: 'load', hash: 5 });
    say({ type: 'other', size: 48, time: 0 });
    await Promise.resolve();
    expect(frame).not.toHaveBeenCalled();
    expect(drawn).toEqual([]);
  });

  it('loads nothing until a load message names an address', async () => {
    vi.resetModules();
    await import('./square-worker');
    frame.mockClear();
    say({ type: 'draw', size: 48, time: 0 });
    say({ type: 'load', hash: 5 });
    say({ type: 'load' });
    // A load the worker started would answer within a few turns of the promise queue.
    for (let turn = 0; turn < 10; turn++) await Promise.resolve();
    expect(frame).not.toHaveBeenCalled();
  });
});
