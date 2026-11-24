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
 */
import { canvasFont, theme } from './theme';
import { BUILD_ID } from '../src/updates';
import { readFrameMessage, type SquareKind } from './frame-protocol';
import { rescale, withOwedPress } from './pointer';
import type { NorthPoleSquare, SquarePointer } from './square';

/** How long a square may take to open, its download included. */
export const READY_TIMEOUT = 10_000;
/** Frames left out of the slowest-frame record while a square warms up. */
const WARM_UP_FRAMES = 5;
/** A frame not drawn for this long is released, and restarts when it's drawn again. */
export const IDLE_RELEASE_MS = 20_000;
/** The most squares running at once; starting another releases the least recently drawn. */
export const MAX_LIVE_FRAMES = 24;

/**
 * Which running frames to release: any idle for `idleMs`, and then the least
 * recently drawn, until there's room for `adding` more within `max`. Pure, so
 * the policy can be tested without a browser.
 */
export function framesToRelease<T extends { lastDrawn: number }>(
  live: readonly T[],
  now: number,
  { max = MAX_LIVE_FRAMES, idleMs = IDLE_RELEASE_MS, adding = 0 } = {},
): T[] {
  const idle = live.filter((frame) => now - frame.lastDrawn > idleMs);
  const rest = live
    .filter((frame) => !idle.includes(frame))
    .sort((a, b) => a.lastDrawn - b.lastDrawn);
  const over = Math.max(0, rest.length + adding - max);
  return [...idle, ...rest.slice(0, over)];
}

interface LiveFrame {
  lastDrawn: number;
  release(): void;
}
/** Every square whose frame is running now. */
const live = new Set<LiveFrame>();
let sweeper: ReturnType<typeof setInterval> | undefined;

/** Releases what `framesToRelease` picks; `adding` makes room for frames about to start. */
function sweep(adding = 0) {
  for (const frame of framesToRelease([...live], performance.now(), { adding })) frame.release();
  if (live.size === 0 && sweeper) {
    clearInterval(sweeper);
    sweeper = undefined;
  }
}

/** Errors in a row after which a square counts as broken. */
export const MAX_ERRORS = 3;
/** How long a frame may take to answer before it counts as an error. */
export const FRAME_TIMEOUT = 2000;

type State = 'loading' | 'ready' | 'broken';

/** The square's name and description, as its frame reported them once ready. */
export interface SquareInfo {
  name: string;
  description: string;
}

/** A stand-in for a sandboxed square, with what the page needs beyond drawing. */
export interface SandboxedSquare extends NorthPoleSquare {
  readonly kind: SquareKind;
  /** Calls `listener` once the frame has said its name, at once if it already has. */
  onReady(listener: (info: SquareInfo) => void): void;
}

const isBitmap = (value: unknown): value is ImageBitmap =>
  typeof ImageBitmap !== 'undefined' && value instanceof ImageBitmap;

let holder: HTMLElement | undefined;

/** Where the frames live: off screen, out of the way of clicks and screen readers. */
function frameHolder(): HTMLElement {
  if (!holder) {
    holder = document.createElement('div');
    holder.setAttribute('aria-hidden', 'true');
    Object.assign(holder.style, {
      position: 'fixed',
      left: '-10px',
      top: '-10px',
      width: '1px',
      height: '1px',
      overflow: 'hidden',
      opacity: '0',
      pointerEvents: 'none',
    });
    document.body.append(holder);
  }
  return holder;
}

/** A sandboxed stand-in for the booth or attraction `id`. Its frame starts on first draw. */
export function sandboxedSquare(kind: SquareKind, id: string): SandboxedSquare {
  let state: State = 'loading';
  let info: SquareInfo = { name: id, description: '' };
  const listeners: ((info: SquareInfo) => void)[] = [];
  let iframe: HTMLIFrameElement | undefined;
  let latest: ImageBitmap | undefined;
  let waitingFor: number | undefined;
  let waitingSince = 0;
  /** A press drawn while the frame was busy, kept until a request carries it. */
  let owedPress: { pointer: SquarePointer; size: number } | undefined;
  let errors = 0;
  let frames = 0;
  let slowest = 0;
  /** Counts the frames started, so a released frame's timers can't touch the next one. */
  let generation = 0;
  const self: LiveFrame = { lastDrawn: 0, release: () => release() };

  /**
   * Stops this square's frame, keeping its name and last picture, so it shows
   * at once when it's next drawn while a new frame starts.
   */
  const release = () => {
    if (!iframe) return;
    window.removeEventListener('message', onMessage);
    iframe.remove();
    iframe = undefined;
    live.delete(self);
    waitingFor = undefined;
    owedPress = undefined;
    errors = 0;
    if (state !== 'broken') state = 'loading';
  };

  const fail = (why: string) => {
    waitingFor = undefined;
    console.error(`The ${kind} ${id} failed:`, why);
    if (++errors >= MAX_ERRORS) setState('broken');
  };

  const setState = (next: State) => {
    state = next;
    if (iframe) iframe.dataset.state = next;
  };

  const onMessage = (event: MessageEvent) => {
    if (!iframe || event.source !== iframe.contentWindow) return;
    const message = readFrameMessage(event.data, waitingFor, isBitmap);
    if (!message) return;
    switch (message.type) {
      case 'ready':
        if (state !== 'loading') return;
        info = { name: message.name, description: message.description };
        setState('ready');
        if (frames > 0) break; // a restarted frame: the page already knows its name
        for (const listener of listeners.splice(0)) {
          // One page's listener failing mustn't keep the others from hearing.
          try {
            listener(info);
          } catch (error) {
            console.error(error);
          }
        }
        break;
      case 'frame':
        latest?.close();
        latest = message.bitmap;
        waitingFor = undefined;
        errors = 0;
        iframe.dataset.drawMs = String(Math.round(message.drawMs * 10) / 10);
        // The slowest frame after warming up, for the smoke test's budget.
        if (++frames > WARM_UP_FRAMES) slowest = Math.max(slowest, message.drawMs);
        iframe.dataset.slowestDrawMs = String(Math.round(slowest * 10) / 10);
        break;
      case 'error':
        if (state === 'loading') setState('broken');
        fail(message.message);
        break;
    }
  };

  const start = () => {
    sweep(1);
    const mine = ++generation;
    iframe = document.createElement('iframe');
    iframe.sandbox.add('allow-scripts');
    iframe.referrerPolicy = 'no-referrer';
    iframe.tabIndex = -1;
    iframe.title = `${kind} ${id}`;
    iframe.dataset.kind = kind;
    iframe.dataset.id = id;
    iframe.dataset.state = state;
    // The frame page of this page's own build, so a cached page and its frames
    // always come from the same build, even while caches catch up.
    iframe.src = new URL(`square.html?v=${BUILD_ID}#${kind}/${id}`, document.baseURI).href;
    window.addEventListener('message', onMessage);
    frameHolder().append(iframe);
    live.add(self);
    sweeper ??= setInterval(() => sweep(), 5000);
    setTimeout(() => {
      if (generation === mine && iframe && state === 'loading') {
        console.error(`The ${kind} ${id} didn't open within ${READY_TIMEOUT / 1000}s`);
        setState('broken');
      }
    }, READY_TIMEOUT);
  };

  return Object.freeze({
    kind,
    id,
    get name() {
      return info.name;
    },
    get description() {
      return info.description;
    },
    onReady(listener: (info: SquareInfo) => void) {
      if (state === 'ready') listener(info);
      else listeners.push(listener);
    },
    draw(ctx: CanvasRenderingContext2D, size: number, time: number, pointer?: SquarePointer) {
      self.lastDrawn = performance.now();
      if (!iframe && state !== 'broken') start();
      if (state === 'broken') {
        // Its frame already said why, once: draw the placeholder, quietly.
        ctx.fillStyle = theme.colors.surface;
        ctx.fillRect(0, 0, size, size);
        ctx.fillStyle = theme.colors.muted;
        ctx.font = canvasFont('small');
        ctx.textAlign = 'center';
        ctx.fillText('Under construction', size / 2, size / 2, size);
        return;
      }
      // Ask for the next frame once the last one is in, so a slow square only
      // slows itself down.
      if (state === 'ready' && waitingFor !== undefined) {
        if (performance.now() - waitingSince > FRAME_TIMEOUT) fail('it stopped answering');
      }
      if (pointer?.down) owedPress = { pointer, size };
      if (state === 'ready' && waitingFor === undefined) {
        waitingFor = Math.round(size);
        waitingSince = performance.now();
        // A quick tap may have come and gone while the last frame was drawing.
        const sent = withOwedPress(
          pointer && rescale(pointer, size, waitingFor),
          owedPress && rescale(owedPress.pointer, owedPress.size, waitingFor),
        );
        owedPress = undefined;
        // The frame checks the pointer again: it only ever passes on x, y and down.
        const request = sent
          ? { type: 'draw', size: waitingFor, time, pointer: sent }
          : { type: 'draw', size: waitingFor, time };
        iframe!.contentWindow?.postMessage(request, '*');
      }
      if (latest) {
        ctx.drawImage(latest, 0, 0, size, size);
      } else {
        ctx.fillStyle = theme.colors.snow;
        ctx.fillRect(0, 0, size, size);
        ctx.fillStyle = theme.colors.muted;
        ctx.font = canvasFont('small');
        ctx.textAlign = 'center';
        ctx.fillText('Opening…', size / 2, size / 2, size);
      }
    },
  });
}
