/**
 * The map's side of the sandbox. The map never runs a booth's or an
 * attraction's code: each one runs in an `<iframe sandbox="allow-scripts">`
 * of its own (square.html), with an opaque origin and a strict content
 * security policy. What the map gets is a stand-in `NorthPoleSquare` whose
 * `draw` asks the frame for a frame and paints the latest bitmap it sent, so
 * the rest of the map draws it like any other square.
 *
 * A frame that doesn't say it's ready within `READY_TIMEOUT`, or keeps
 * failing, is broken: its stand-in draws the "Under construction" placeholder.
 * Which frames run is sandbox-schedule.ts, the frame element sandbox-frame.ts,
 * and what passes between them sandbox-messages.ts.
 */
import type { SquareKind } from './frame-protocol';
import { drawPlaceholder, openFrame } from './sandbox-frame';
import { askForFrame, hearFrame } from './sandbox-messages';
import { forgetFrame, newRun, setState, type SquareInfo } from './sandbox-run';
import { startRunning, stopRunning, type LiveFrame } from './sandbox-schedule';
import type { NorthPoleSquare, SquarePointer } from './square';

export { framesToRelease, IDLE_RELEASE_MS, MAX_LIVE_FRAMES } from './sandbox-schedule';

/** How long a square may take to open, its download included. */
const READY_TIMEOUT = 10_000;

/** A stand-in for a sandboxed square, with what the page needs beyond drawing. */
export interface SandboxedSquare extends NorthPoleSquare {
  readonly kind: SquareKind;
  /** Calls `listener` once the frame has said its name, at once if it already has. */
  onReady(listener: (info: SquareInfo) => void): void;
}

/**
 * A sandboxed stand-in for the booth or attraction `id`, or for the square
 * `id` of the level `level`. Its frame starts on first draw.
 */
export function sandboxedSquare(kind: SquareKind, id: string, level?: string): SandboxedSquare {
  const address = kind === 'level' ? `${level}/${id}` : id;
  const run = newRun(kind, id);
  // The running frame's record, made when its frame starts, so it never needs a stand-in release.
  let live: LiveFrame | undefined;

  const start = () => {
    const iframe = openFrame(kind, address, run.state);
    const onMessage = (event: MessageEvent) => {
      if (event.source === iframe.contentWindow) hearFrame(run, iframe, event.data);
    };
    window.addEventListener('message', onMessage);
    run.iframe = iframe;
    // Stops this frame, keeping the square's name and last picture.
    const frame: LiveFrame = {
      lastDrawn: performance.now(),
      release: () => {
        window.removeEventListener('message', onMessage);
        iframe.remove();
        stopRunning(frame);
        forgetFrame(run);
      },
    };
    live = frame;
    startRunning(frame);
    setTimeout(() => {
      // Only while this very frame runs: a released or restarted one has its own clock.
      if (run.iframe === iframe && run.state === 'loading') {
        console.error(`The ${kind} ${id} didn't open within ${READY_TIMEOUT / 1000}s`);
        setState(run, iframe, 'broken');
      }
    }, READY_TIMEOUT);
    return iframe;
  };

  return Object.freeze({
    kind,
    id,
    get name() {
      return run.info.name;
    },
    get description() {
      return run.info.description;
    },
    /** Until the frame is ready, or when its option was invalid, the usual stall. */
    get stall() {
      return run.info.stall;
    },
    onReady(listener: (info: SquareInfo) => void) {
      if (run.state === 'ready') listener(run.info);
      else run.listeners.push(listener);
    },
    draw(ctx: CanvasRenderingContext2D, size: number, time: number, pointer?: SquarePointer) {
      if (live) live.lastDrawn = performance.now();
      if (run.state === 'broken') {
        // Its frame already said why, once: draw the placeholder, quietly.
        drawPlaceholder(ctx, size, 'surface', 'Under construction');
        return;
      }
      askForFrame(run, run.iframe ?? start(), size, time, pointer);
      if (run.latest) ctx.drawImage(run.latest, 0, 0, size, size);
      else drawPlaceholder(ctx, size, 'snow', 'Opening…');
    },
  });
}
