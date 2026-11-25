/**
 * A running map in happy-dom, for the map's own tests: its canvases record
 * instead of drawing, its frames are stepped by hand at chosen times, and its
 * clock stands still unless a test moves it. Pinning the map's frames with it
 * proves a split of src/northpole/map.ts draws exactly the same
 * (docs/adr/0019-small-files.md, docs/adr/0024-test-first.md).
 */
import { drawingOf, type CanvasCall } from './recording-canvas';
import { startMap } from '../northpole/map';
import type { MapControls, MapOptions } from '../northpole/map-options';

export interface MapHarness {
  frame: HTMLElement;
  canvas: HTMLCanvasElement;
  prompt: HTMLButtonElement;
  controls: MapControls;
  /** What starting the map drew: its sky, mountains, island and fence layers. */
  started: CanvasCall[];
  /** Draws the next frame at `time`, with the clock at `time` too, and gives back its calls. */
  step(time: number): CanvasCall[];
  /** Runs `act` with the canvases recording, for what it redraws. */
  record(act: () => void): CanvasCall[];
  /** Sets the clock that `performance.now()` reads. */
  setClock(time: number): void;
  /** The tag over a plot, as the page shows it. */
  tag(): HTMLElement | null;
  /** Everything the map says on the page itself, in one line, for pinning beside the drawing. */
  page(): string;
  /** Stops the map and puts back everything the harness stood in for. */
  stop(): void;
}

/** How the page looks to the map: its size, a touch screen, and reduced motion. */
export interface Screen {
  width?: number;
  height?: number;
  coarse?: boolean;
  reduced?: boolean;
}

/** Canvases and images go into the record by name and size, not as page elements. */
const named = (arg: unknown) =>
  arg instanceof HTMLCanvasElement
    ? `canvas ${String(arg.width)}x${String(arg.height)}`
    : arg instanceof HTMLImageElement
      ? 'image'
      : arg;

/** A context that hands every call on to whichever recording context is current. */
function forwarding(current: () => CanvasRenderingContext2D) {
  return new Proxy(
    {},
    {
      get: (_target, key) => {
        const value: unknown = Reflect.get(current(), key);
        return typeof value === 'function'
          ? (...args: unknown[]) => Reflect.apply(value, undefined, args.map(named)) as unknown
          : value;
      },
      set: (_target, key, value: unknown) => Reflect.set(current(), key, value),
    },
  ) as CanvasRenderingContext2D;
}

/** Starts the map with `options` in a frame of the screen's size. */
export function startHarness(options: MapOptions, screen: Screen = {}): MapHarness {
  const { width = 1200, height = 800 } = screen;
  let sink!: CanvasRenderingContext2D;
  drawingOf((ctx) => (sink = ctx));
  let current = sink;
  const shared = forwarding(() => current);
  const record = (act: () => void) =>
    drawingOf((ctx) => {
      current = ctx;
      try {
        act();
      } finally {
        current = sink;
      }
    });

  const getContext = Reflect.get(HTMLCanvasElement.prototype, 'getContext') as unknown;
  Reflect.set(HTMLCanvasElement.prototype, 'getContext', () => shared);
  const now = Reflect.get(performance, 'now') as unknown;
  let clock = 0;
  Reflect.defineProperty(performance, 'now', { value: () => clock, configurable: true });
  let next: FrameRequestCallback | undefined;
  const saved = ['requestAnimationFrame', 'cancelAnimationFrame', 'matchMedia'].map(
    (name) => [name, Reflect.get(window, name) as unknown] as const,
  );
  window.requestAnimationFrame = (callback) => {
    next = callback;
    return 1;
  };
  window.cancelAnimationFrame = () => (next = undefined);
  window.matchMedia = (query: string) =>
    ({
      matches: query.includes('coarse') ? !!screen.coarse : !!screen.reduced,
    }) as MediaQueryList;

  const frame = document.createElement('div');
  Reflect.defineProperty(frame, 'clientWidth', { value: width });
  Reflect.defineProperty(frame, 'clientHeight', { value: height });
  const canvas = document.createElement('canvas');
  canvas.getBoundingClientRect = () => new DOMRect(0, 0, width, height);
  const prompt = document.createElement('button');
  frame.append(canvas, prompt);
  document.body.append(frame);

  let controls!: MapControls;
  const started = record(() => (controls = startMap(frame, canvas, prompt, options)));
  const tag = () => frame.querySelector<HTMLElement>('.map-tag');
  return {
    frame,
    canvas,
    prompt,
    controls,
    started,
    record,
    tag,
    setClock: (time) => (clock = time),
    step(time) {
      clock = time;
      return record(() => {
        const draw = next;
        next = undefined;
        draw?.(time);
      });
    },
    page: () =>
      JSON.stringify({
        canvas: Object.entries(canvas.dataset),
        frame: Object.entries(frame.dataset),
        prompt: [prompt.hidden, prompt.title, prompt.textContent, prompt.dataset.plot],
        at: [prompt.style.translate, prompt.style.opacity],
        tag: [tag()?.className, tag()?.textContent, tag()?.style.transform, tag()?.dataset.plot],
        cursor: canvas.style.cursor,
      }),
    stop() {
      controls.stop();
      frame.remove();
      Reflect.set(HTMLCanvasElement.prototype, 'getContext', getContext);
      Reflect.defineProperty(performance, 'now', { value: now, configurable: true });
      for (const [name, value] of saved) Reflect.set(window, name, value);
    },
  };
}
