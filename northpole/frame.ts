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

let busy: ReturnType<typeof setTimeout> | undefined;
let stopped = false;

const watch = (what: string) => {
  clearTimeout(busy);
  busy = setTimeout(() => {
    stopped = true;
    worker.terminate();
    toMap({ type: 'error', message: `It took over ${HANG_MS} ms to ${what}, so it was stopped` });
  }, HANG_MS);
};

worker.addEventListener('message', (event: MessageEvent) => {
  clearTimeout(busy);
  const data = event.data as { bitmap?: ImageBitmap };
  toMap(event.data as object, data?.bitmap ? [data.bitmap] : []);
});
worker.addEventListener('error', (event) => {
  clearTimeout(busy);
  toMap({ type: 'error', message: event.message || 'Its code failed to load' });
});

addEventListener('message', (event) => {
  if (event.source !== parent || stopped) return;
  const request = readDrawRequest(event.data);
  if (!request) return;
  watch('draw a frame');
  worker.postMessage(request);
});

watch('load');
worker.postMessage({ type: 'load', hash: location.hash });
