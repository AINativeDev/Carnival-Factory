/**
 * Runs inside a square's sandboxed frame (square.html) and supervises it. The
 * square's own code runs in a worker, on a thread of its own, so this frame
 * stays free to notice when it hangs and stop it: a square stuck in a loop
 * then only stops itself, never the other squares or the map.
 *
 * The worker is started from a blob: URL so it keeps this frame's content
 * security policy, and with it no network. Vite builds it as one classic
 * script with every square in it, but only this square's code ever runs.
 */
import workerUrl from './square-worker.ts?worker&url';
import { readDrawRequest } from './frame-protocol';

/** How long a square may take to load, or to draw one frame, before it's stopped. */
const HANG_MS = 1000;

const toMap = (message: object, transfer: Transferable[] = []) =>
  parent.postMessage(message, '*', transfer);

const script = new URL(workerUrl, location.href).href;
// A classic worker: a module worker from a blob: URL won't start in an
// opaque-origin frame, but one that loads its script with importScripts does.
const blob = new Blob([`importScripts(${JSON.stringify(script)});`], {
  type: 'text/javascript',
});
const worker = new Worker(URL.createObjectURL(blob));

/** What the worker owes the frame, and so what may answer it. */
type Pending = 'start' | 'load' | 'draw' | undefined;
const ANSWERS: Record<Exclude<Pending, undefined>, readonly string[]> = {
  start: ['started'],
  load: ['ready', 'error'],
  draw: ['frame', 'error'],
};
/** Errors after which the frame gives up on the square and stops its worker. */
const MAX_ERRORS = 3;

let pending: Pending = 'start';
let watchdog: ReturnType<typeof setTimeout> | undefined;
let errors = 0;
let stopped = false;

const stop = (why: string) => {
  if (stopped) return;
  stopped = true;
  clearTimeout(watchdog);
  worker.terminate();
  toMap({ type: 'error', message: why });
};

/**
 * Waits for the worker to finish `next`. Starting isn't timed: that's the
 * download of its script, and the map's own ready timeout covers it. Loading
 * the square and drawing a frame are the square's own code, so they get
 * `HANG_MS`, and only a message that finishes them stops the clock.
 */
const expect = (next: Exclude<Pending, 'start' | undefined>) => {
  pending = next;
  clearTimeout(watchdog);
  watchdog = setTimeout(
    () =>
      stop(
        `It took over ${HANG_MS} ms to ${next === 'load' ? 'load' : 'draw a frame'}, so it was stopped`,
      ),
    HANG_MS,
  );
};

worker.addEventListener('message', (event: MessageEvent) => {
  const data = event.data as { type?: unknown; bitmap?: unknown };
  const type = typeof data?.type === 'string' ? data.type : undefined;
  // The square's code shares the worker, so it can post too: anything that
  // isn't the answer the frame is waiting for is dropped, and the clock runs on.
  if (stopped || !pending || !type || !ANSWERS[pending].includes(type)) {
    if (data?.bitmap instanceof ImageBitmap) data.bitmap.close();
    return;
  }
  clearTimeout(watchdog);
  const was = pending;
  pending = undefined;
  if (was === 'start') {
    expect('load');
    worker.postMessage({ type: 'load', hash: location.hash });
    return;
  }
  toMap(data as object, data.bitmap instanceof ImageBitmap ? [data.bitmap] : []);
  if (type === 'error' && (was === 'load' || ++errors >= MAX_ERRORS)) {
    stop('It kept failing, so it was stopped');
  } else if (type === 'frame') {
    errors = 0;
  }
});
worker.addEventListener('error', (event) => {
  event.preventDefault();
  stop(event.message || 'Its code failed to load');
});

addEventListener('message', (event) => {
  if (event.source !== parent || stopped || pending) return;
  const request = readDrawRequest(event.data);
  if (!request) return;
  expect('draw');
  worker.postMessage(request);
});
