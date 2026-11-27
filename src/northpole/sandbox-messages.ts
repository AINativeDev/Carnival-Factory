/**
 * The messages between the map and one square's frame, from the map's side:
 * what it does with what the frame sends, once `readFrameMessage` has checked
 * it, and the draw requests it sends, one at a time, carrying the pointer.
 */
import { readFrameMessage, stallFor } from './frame-protocol';
import { rescale, withOwedPress } from './pointer';
import { fail, setState, type SquareRun } from './sandbox-run';
import { MAX_PRESSES, type SquarePointer } from './square';

/** Frames left out of the slowest-frame record while a square warms up. */
const WARM_UP_FRAMES = 5;
/** How long a frame may take to answer before it counts as an error. */
const FRAME_TIMEOUT = 2000;

const isBitmap = (value: unknown): value is ImageBitmap =>
  typeof ImageBitmap !== 'undefined' && value instanceof ImageBitmap;

/** Acts on what the square's frame sent, ignoring anything that fails the checks. */
export function hearFrame(run: SquareRun, iframe: HTMLIFrameElement, data: unknown) {
  const message = readFrameMessage(data, run.waitingFor, isBitmap);
  if (!message) return;
  switch (message.type) {
    case 'ready':
      if (run.state !== 'loading') return;
      run.info = {
        name: message.name,
        description: message.description,
        stall: stallFor(run.kind, message.stall),
      };
      setState(run, iframe, 'ready');
      // Everyone still waiting hears it, a restarted frame's too: each listener is
      // taken off as it's called, so none hears twice and none is left behind.
      for (const listener of run.listeners.splice(0)) {
        // One page's listener failing mustn't keep the others from hearing.
        try {
          listener(run.info);
        } catch (error) {
          console.error(error);
        }
      }
      break;
    case 'frame':
      run.latest?.close();
      run.latest = message.bitmap;
      run.waitingFor = undefined;
      run.errors = 0;
      iframe.dataset.drawMs = String(Math.round(message.drawMs * 10) / 10);
      // The slowest frame after warming up, for the smoke test's budget.
      if (++run.frames > WARM_UP_FRAMES) run.slowest = Math.max(run.slowest, message.drawMs);
      iframe.dataset.slowestDrawMs = String(Math.round(run.slowest * 10) / 10);
      if (message.open !== undefined)
        for (const listener of run.linkListeners) listener(message.open);
      break;
    case 'error':
      if (run.state === 'loading') setState(run, iframe, 'broken');
      fail(run, iframe, message.message);
      break;
  }
}

/**
 * Asks the frame for its next frame once the last one is in, so a slow square
 * only slows itself down, and counts one that stopped answering as an error.
 */
export function askForFrame(
  run: SquareRun,
  iframe: HTMLIFrameElement,
  size: number,
  time: number,
  pointer?: SquarePointer,
) {
  const hung = run.waitingFor !== undefined && performance.now() - run.waitingSince > FRAME_TIMEOUT;
  if (run.state === 'ready' && hung) fail(run, iframe, 'it stopped answering');
  if (pointer?.down) run.owedPress = { pointer, size };
  run.owedPresses += pointer?.presses ?? 0;
  if (run.state !== 'ready' || run.waitingFor !== undefined) return;
  const asked = Math.round(size);
  run.waitingFor = asked;
  run.waitingSince = performance.now();
  // A quick tap may have come and gone while the last frame was drawing.
  const presses = Math.min(MAX_PRESSES, run.owedPresses);
  const { owedPress } = run;
  const sent = withOwedPress(
    pointer && rescale(pointer, size, asked),
    owedPress && rescale(owedPress.pointer, owedPress.size, asked),
    presses,
  );
  run.owedPress = undefined;
  if (sent) run.owedPresses -= presses;
  // The frame checks the pointer again: it only ever passes on x, y, down and presses.
  const request = sent
    ? { type: 'draw', size: asked, time, pointer: sent }
    : { type: 'draw', size: asked, time };
  // The square's frame is sandboxed with an opaque origin ("null"), so there's no
  // origin to name: '*' is the only way to reach it. What's sent is a size, a time
  // and the pointer, nothing private, and the frame checks it (readDrawRequest).
  // deepcode ignore PostMessageWildcard: the sandboxed frame's origin is opaque, so it has none to name.
  iframe.contentWindow?.postMessage(request, '*');
}
