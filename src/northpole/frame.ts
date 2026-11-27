/**
 * Runs inside a square's sandboxed frame (square.html) and supervises it. The
 * square's own code runs in a worker, on a thread of its own, so this frame
 * stays free to notice when it hangs and stop it: a square stuck in a loop
 * then only stops itself, never the other squares or the map.
 *
 * The worker is built into this frame's own script and started from a blob:
 * URL, so it keeps this frame's content security policy, and with it no
 * network. Vite builds it as one classic script with every square in it, but
 * only this square's code ever runs. Nothing is loaded from a URL: Safari
 * reads `script-src 'self'` in this opaque-origin frame as matching nothing,
 * so a worker that loaded its script from the site never started there.
 */
import SquareWorker from './square-worker.ts?worker&inline';
import { readDrawRequest } from './frame-protocol';

/** How long a square may take to load, or to draw one frame, before it's stopped. */
const HANG_MS = 1000;

/**
 * The map's own origin. This frame's is opaque ("null"), sandboxed without
 * allow-same-origin, but its address is still the map's, so only the map
 * can hear what it sends, and only the map's messages are heard.
 */
const MAP_ORIGIN = location.origin;

const toMap = (message: object, transfer: Transferable[] = []) =>
  parent.postMessage(message, MAP_ORIGIN, transfer);

const worker = new SquareWorker();

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

// deepcode ignore InsufficientPostmessageValidation: a dedicated worker's messages have no origin; only this frame's own worker can send them, and each is checked against what the frame is waiting for.
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
  if (event.source !== parent || event.origin !== MAP_ORIGIN || stopped || pending) return;
  const request = readDrawRequest(event.data);
  if (!request) return;
  expect('draw');
  worker.postMessage(request);
});
