import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

/**
 * The worker that runs a square's own code (square-worker.ts), with the frame
 * as a recorder and a canvas that only counts its frames. Two booths are
 * stand-ins: jedi4ever's draws, and fails on the frame at time 13;
 * sjmaple's exports nothing the map can use. The worker keeps its square once
 * loaded, so each test loads it afresh.
 */
/** What the stand-in booth asks of the page after its latest frame. */
let asked: unknown;

vi.mock('../../carnival/booths/jedi4ever/booth.ts', () => ({
  default: {
    id: 'jedi4ever',
    name: 'Snow globe',
    description: 'A globe.',
    stall: { shape: 'shed', roof: 'gold', extra: 'dropped' },
    draw: (_ctx: unknown, _size: number, time: number) => {
      if (time === 13) throw new Error('melted');
      asked = time === 7 ? { open: 0 } : time === 8 ? { open: 2.5 } : undefined;
    },
    ask: () => asked,
  },
}));
vi.mock('../../carnival/booths/sjmaple/booth.ts', () => ({ default: { id: 'someone-else' } }));

class FakeCanvas {
  constructor(
    public width: number,
    public height: number,
  ) {
    canvases.push(this);
  }
  getContext() {
    return {};
  }
  transferToImageBitmap() {
    return { from: this.width };
  }
}

let canvases: FakeCanvas[] = [];
let fromFrame: (event: { data: unknown }) => void = () => undefined;
const frame = vi.fn();

/** Starts the worker, and gives back what it said once its script ran. */
async function startWorker() {
  vi.resetModules();
  await import('./square-worker');
  return frame.mock.calls.map(([message]) => message as unknown);
}

/** The frame posts `data` to the worker. */
const say = (data: unknown) => {
  fromFrame({ data });
};

/** Asks the worker to load the square at `hash`, and gives back its answer once loading settles. */
async function load(hash: string) {
  const before = frame.mock.calls.length;
  say({ type: 'load', hash });
  await vi.waitFor(() => {
    expect(frame.mock.calls.length).toBeGreaterThan(before);
  });
  return frame.mock.calls.at(-1)?.[0] as Record<string, unknown>;
}

beforeEach(() => {
  frame.mockClear();
  canvases = [];
  vi.stubGlobal('postMessage', frame);
  vi.stubGlobal('OffscreenCanvas', FakeCanvas);
  vi.stubGlobal('addEventListener', (_type: string, listener: typeof fromFrame) => {
    fromFrame = listener;
  });
});

afterEach(() => {
  vi.unstubAllGlobals();
});

/** A worker with jedi4ever's booth loaded. */
async function loaded() {
  await startWorker();
  await load('#booth/jedi4ever');
  frame.mockClear();
}

describe('loading a square', () => {
  it('says it started, then sends the checked name, description and stall', async () => {
    expect(await startWorker()).toEqual([{ type: 'started' }]);
    expect(await load('#booth/jedi4ever')).toEqual({
      type: 'ready',
      name: 'Snow globe',
      description: 'A globe.',
      stall: { shape: 'shed', roof: 'gold' },
    });
  });

  it("loads every one of the North Pole's attractions and every level's own squares", async () => {
    const addresses = [
      ...Object.keys(import.meta.glob('../../carnival/attractions/*/attraction.ts')).map(
        (path) => `#attraction/${path.split('/').slice(-2, -1).join('')}`,
      ),
      ...Object.keys(import.meta.glob('../../carnival/levels/*/squares/*/square.ts')).map(
        (path) =>
          `#level/${path.split('/').slice(-4, -3).join('')}/${path.split('/').slice(-2, -1).join('')}`,
      ),
    ];
    expect(addresses).toContain('#level/jedi4ever/cocoa-hut');
    for (const hash of addresses) {
      await startWorker();
      expect((await load(hash)).type, hash).toBe('ready');
    }
  });

  it.each([
    ['#nowhere', 'Not a square: #nowhere'],
    ['#booth/nobody-here', 'No booth called nobody-here'],
    ['#booth/sjmaple', "The booth sjmaple doesn't export its NorthPoleSquare"],
  ])('fails to load %s, saying why', async (hash, why) => {
    await startWorker();
    expect(await load(hash)).toEqual({ type: 'error', message: `Error: ${why}` });
  });

  it('loads only once, and only from a load message with an address', async () => {
    await loaded();
    say({ type: 'load', hash: '#attraction/ferris-wheel' });
    say({ type: 'load' });
    say(null);
    await Promise.resolve();
    expect(frame).not.toHaveBeenCalled();
  });
});

describe('drawing a square', () => {
  it('draws nothing before its square has loaded, or for a request it cannot read', async () => {
    await startWorker();
    say({ type: 'draw', size: 64, time: 0 });
    await loaded();
    say({ type: 'draw', size: 0, time: 0 });
    expect(frame).not.toHaveBeenCalled();
  });

  it('sends each frame as a bitmap, with how long it took to draw', async () => {
    await loaded();
    say({ type: 'draw', size: 64, time: 0 });
    expect(frame).toHaveBeenCalledWith(
      { type: 'frame', bitmap: { from: 64 }, drawMs: expect.any(Number) as number },
      [{ from: 64 }],
    );
  });

  it("passes on a link the drawing asks for with its frame, and drops an ask it can't read", async () => {
    await loaded();
    const drawMs = expect.any(Number) as number;
    say({ type: 'draw', size: 64, time: 7 });
    expect(frame).toHaveBeenLastCalledWith(
      { type: 'frame', bitmap: { from: 64 }, drawMs, open: 0 },
      [{ from: 64 }],
    );
    say({ type: 'draw', size: 64, time: 8 });
    expect(frame).toHaveBeenLastCalledWith({ type: 'frame', bitmap: { from: 64 }, drawMs }, [
      { from: 64 },
    ]);
  });

  it('keeps its canvas while the size stays, and makes a new one when it changes', async () => {
    await loaded();
    say({ type: 'draw', size: 64, time: 0 });
    say({ type: 'draw', size: 64, time: 1 });
    expect(canvases).toHaveLength(1);
    say({ type: 'draw', size: 32, time: 2 });
    expect(canvases).toHaveLength(2);
  });

  it('says so when a frame fails, and draws the next one', async () => {
    await loaded();
    say({ type: 'draw', size: 64, time: 13 });
    expect(frame).toHaveBeenLastCalledWith({ type: 'error', message: 'Error: melted' }, []);
    say({ type: 'draw', size: 64, time: 14 });
    expect(frame).toHaveBeenLastCalledWith(expect.objectContaining({ type: 'frame' }), [
      { from: 64 },
    ]);
  });
});
