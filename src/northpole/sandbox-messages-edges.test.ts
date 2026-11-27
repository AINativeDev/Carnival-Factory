// @vitest-environment happy-dom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { bitmap, FakeBitmap } from './sandbox-fakes';
import { askForFrame, hearFrame } from './sandbox-messages';
import { newRun, type SquareRun } from './sandbox-run';

/**
 * The map's side of a frame's messages at their edges (sandbox-messages.ts),
 * called directly on a square's record: what counts as a picture, which
 * listeners hear what, and when a frame counts as stuck.
 */
function readyRun(): SquareRun {
  const run = newRun('booth', 'elf');
  run.state = 'ready';
  return run;
}

/** A frame element that records what the map posts to it. */
function frameElement() {
  const iframe = document.createElement('iframe');
  const postMessage = vi.fn();
  Object.defineProperty(iframe, 'contentWindow', { value: { postMessage } });
  return { iframe, postMessage };
}

beforeEach(() => {
  vi.stubGlobal('ImageBitmap', FakeBitmap);
  vi.spyOn(console, 'error').mockImplementation(() => undefined);
});
afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('what counts as a picture from the frame', () => {
  it('takes nothing for one where pictures are unknown, without failing', () => {
    vi.stubGlobal('ImageBitmap', undefined);
    const run = readyRun();
    run.waitingFor = 100;
    const picture = { width: 100, height: 100 };
    expect(() => {
      hearFrame(run, frameElement().iframe, { type: 'frame', bitmap: picture, drawMs: 1 });
    }).not.toThrow();
    expect(run.latest).toBeUndefined();
    expect(run.waitingFor).toBe(100);
  });

  it('takes only a real picture, not something shaped like one', () => {
    const run = readyRun();
    run.waitingFor = 100;
    const { iframe } = frameElement();
    hearFrame(run, iframe, { type: 'frame', bitmap: { width: 100, height: 100 }, drawMs: 1 });
    expect(run.latest).toBeUndefined();
    const picture = bitmap(100);
    hearFrame(run, iframe, { type: 'frame', bitmap: picture, drawMs: 1 });
    expect(run.latest).toBe(picture);
  });
});

describe("the page's listeners", () => {
  it('tells a page that asked while a released frame restarted, once, and keeps no listener', () => {
    const run = newRun('booth', 'elf');
    run.frames = 3;
    const listener = vi.fn();
    run.listeners.push(listener);
    const { iframe } = frameElement();
    hearFrame(run, iframe, { type: 'ready', name: 'Elf Shop', description: '' });
    expect(listener).toHaveBeenCalledExactlyOnceWith(run.info);
    expect(run.listeners).toEqual([]);
    expect(run.info.name).toBe('Elf Shop');
    expect(iframe.dataset.state).toBe('ready');
  });

  it('says what went wrong in a listener that failed, and still tells the rest', () => {
    const run = newRun('booth', 'elf');
    const failure = new Error('one page’s listener');
    const heard = vi.fn();
    run.listeners.push(() => {
      throw failure;
    }, heard);
    hearFrame(run, frameElement().iframe, { type: 'ready', name: 'Elf Shop', description: '' });
    expect(console.error).toHaveBeenCalledExactlyOnceWith(failure);
    expect(heard).toHaveBeenCalledOnce();
  });

  it('tells the link listeners nothing for a frame that asks for no link', () => {
    const run = readyRun();
    run.waitingFor = 100;
    const heard = vi.fn();
    run.linkListeners.push(heard);
    hearFrame(run, frameElement().iframe, { type: 'frame', bitmap: bitmap(100), drawMs: 1 });
    expect(heard).not.toHaveBeenCalled();
  });
});

describe('asking a frame for its next picture', () => {
  it('never counts a frame that owes nothing, or has not opened, as stuck', () => {
    vi.spyOn(performance, 'now').mockReturnValue(1_000_000);
    const ready = readyRun();
    askForFrame(ready, frameElement().iframe, 100, 0);
    expect(ready.errors).toBe(0);
    const opening = newRun('booth', 'elf');
    opening.waitingFor = 100;
    askForFrame(opening, frameElement().iframe, 100, 0);
    expect(opening.errors).toBe(0);
    expect(console.error).not.toHaveBeenCalled();
  });

  it('keeps presses owed while no pointer goes with a request', () => {
    const run = readyRun();
    const { iframe, postMessage } = frameElement();
    run.waitingFor = 100;
    run.waitingSince = performance.now();
    askForFrame(run, iframe, 100, 0, { x: 1, y: 1, down: false, presses: 2 });
    run.waitingFor = undefined;
    askForFrame(run, iframe, 100, 1);
    expect(postMessage).toHaveBeenLastCalledWith({ type: 'draw', size: 100, time: 1 }, '*');
    run.waitingFor = undefined;
    askForFrame(run, iframe, 100, 2, { x: 1, y: 1, down: false, presses: 0 });
    expect(postMessage).toHaveBeenLastCalledWith(
      { type: 'draw', size: 100, time: 2, pointer: { x: 1, y: 1, down: false, presses: 2 } },
      '*',
    );
  });

  it('asks nothing of a frame whose window has gone', () => {
    const run = readyRun();
    const iframe = document.createElement('iframe');
    Object.defineProperty(iframe, 'contentWindow', { value: null });
    expect(() => {
      askForFrame(run, iframe, 100, 0);
    }).not.toThrow();
  });
});
