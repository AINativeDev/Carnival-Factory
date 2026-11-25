/**
 * Which squares' frames run. A square's frame starts when the map first draws
 * it, so only squares in view wake; one nobody has drawn for a while is
 * released, and so is the least recently drawn when too many run at once, so a
 * long walk round the map never piles up frames (docs/specs/squares-and-sandbox.md).
 */

/** A frame not drawn for this long is released, and restarts when it's drawn again. */
export const IDLE_RELEASE_MS = 20_000;
/** The most squares running at once; starting another releases the least recently drawn. */
export const MAX_LIVE_FRAMES = 24;
/** How often the running frames are checked for ones nobody draws. */
const SWEEP_MS = 5000;

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

/** A square whose frame is running: when the map last drew it, and how to stop it. */
export interface LiveFrame {
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

/** Makes room for `frame`, which is starting, and keeps an eye on it while it runs. */
export function startRunning(frame: LiveFrame) {
  sweep(1);
  live.add(frame);
  sweeper ??= setInterval(() => {
    sweep();
  }, SWEEP_MS);
}

/** Forgets `frame`, whose frame has been released. */
export function stopRunning(frame: LiveFrame) {
  live.delete(frame);
}
