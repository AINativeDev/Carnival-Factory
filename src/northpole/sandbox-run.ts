/**
 * What the map knows of one sandboxed square while its frame runs: whether
 * it has opened, what it said its name was, the picture it last sent, the
 * request it's drawing and the presses it still owes. The frame's lifecycle
 * (sandbox.ts) and its messages (sandbox-messages.ts) share this one record.
 */
import type { SquareKind } from './frame-protocol';
import type { SquarePointer, StallStyle } from './square';

/** Errors in a row after which a square counts as broken. */
const MAX_ERRORS = 3;

/** Opening, drawing, or showing "Under construction" for good. */
export type FrameState = 'loading' | 'ready' | 'broken';

/** The square's name, description and stall, as its frame reported them once ready. */
export interface SquareInfo {
  name: string;
  description: string;
  stall?: StallStyle | undefined;
}

export interface SquareRun {
  readonly kind: SquareKind;
  readonly id: string;
  state: FrameState;
  info: SquareInfo;
  /** The page's listeners still waiting for the square's name. */
  readonly listeners: ((info: SquareInfo) => void)[];
  iframe?: HTMLIFrameElement | undefined;
  latest?: ImageBitmap | undefined;
  /** The size of the frame asked for and not yet sent, if one is. */
  waitingFor?: number | undefined;
  waitingSince: number;
  /** A press drawn while the frame was busy, kept until a request carries it. */
  owedPress?: { pointer: SquarePointer; size: number } | undefined;
  /** The presses the map has drawn since the last request, kept until one carries them. */
  owedPresses: number;
  errors: number;
  /** Frames drawn so far, and the slowest of them after warming up. */
  frames: number;
  slowest: number;
}

/** A square that hasn't started yet, known only by its id. */
export const newRun = (kind: SquareKind, id: string): SquareRun => ({
  kind,
  id,
  state: 'loading',
  info: { name: id, description: '' },
  listeners: [],
  waitingSince: 0,
  owedPresses: 0,
  errors: 0,
  frames: 0,
  slowest: 0,
});

/** Moves the square to `next`, and says so on its frame for the smoke test. */
export function setState(run: SquareRun, iframe: HTMLIFrameElement, next: FrameState) {
  run.state = next;
  iframe.dataset.state = next;
}

/** Counts one error, saying why once, and breaks the square after `MAX_ERRORS` in a row. */
export function fail(run: SquareRun, iframe: HTMLIFrameElement, why: string) {
  run.waitingFor = undefined;
  console.error(`The ${run.kind} ${run.id} failed:`, why);
  if (++run.errors >= MAX_ERRORS) setState(run, iframe, 'broken');
}

/**
 * Forgets a released frame, keeping the square's name and last picture so it
 * shows at once when it's next drawn while a new frame starts.
 */
export function forgetFrame(run: SquareRun) {
  run.iframe = undefined;
  run.waitingFor = undefined;
  run.owedPress = undefined;
  run.owedPresses = 0;
  run.errors = 0;
  if (run.state !== 'broken') run.state = 'loading';
}
