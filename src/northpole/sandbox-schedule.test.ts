import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { LiveFrame } from './sandbox-schedule';

/** A fresh schedule per test, since it keeps the running frames and its sweeper. */
async function schedule() {
  vi.resetModules();
  return import('./sandbox-schedule');
}

/** A running frame that, released, leaves the schedule the way sandbox.ts's frames do. */
function running(stopRunning: (frame: LiveFrame) => void, lastDrawn = performance.now()) {
  const frame = {
    lastDrawn,
    release: vi.fn(() => {
      stopRunning(frame);
    }),
  };
  return frame;
}

beforeEach(() => {
  vi.useFakeTimers();
});
afterEach(() => {
  vi.useRealTimers();
});

describe('which frames keep running', () => {
  it('checks every five seconds, and releases a frame once it has been idle too long', async () => {
    const { startRunning, stopRunning, IDLE_RELEASE_MS } = await schedule();
    const frame = running(stopRunning);
    startRunning(frame);
    expect(vi.getTimerCount()).toBe(1);
    vi.advanceTimersByTime(IDLE_RELEASE_MS + 4999);
    expect(frame.release).not.toHaveBeenCalled();
    vi.advanceTimersByTime(1);
    expect(frame.release).toHaveBeenCalledOnce();
    expect(vi.getTimerCount()).toBe(0);
  });

  it('keeps one sweeper for every frame, running while any frame does', async () => {
    const { startRunning, stopRunning, IDLE_RELEASE_MS } = await schedule();
    const early = running(stopRunning);
    const late = running(stopRunning);
    startRunning(early);
    startRunning(late);
    expect(vi.getTimerCount()).toBe(1);
    vi.advanceTimersByTime(IDLE_RELEASE_MS / 2);
    late.lastDrawn = performance.now();
    vi.advanceTimersByTime(IDLE_RELEASE_MS / 2 + 5000);
    expect(early.release).toHaveBeenCalledOnce();
    expect(late.release).not.toHaveBeenCalled();
    expect(vi.getTimerCount()).toBe(1);
    vi.advanceTimersByTime(IDLE_RELEASE_MS);
    expect(late.release).toHaveBeenCalledOnce();
    expect(vi.getTimerCount()).toBe(0);
  });

  it('makes room for a frame that starts, releasing the least recently drawn', async () => {
    const { startRunning, stopRunning, MAX_LIVE_FRAMES } = await schedule();
    const frames = Array.from({ length: MAX_LIVE_FRAMES }, (_, i) => running(stopRunning, i));
    for (const frame of frames) startRunning(frame);
    expect(frames.filter((frame) => frame.release.mock.calls.length)).toEqual([]);
    startRunning(running(stopRunning, MAX_LIVE_FRAMES));
    expect(frames.filter((frame) => frame.release.mock.calls.length)).toEqual([frames[0]]);
  });

  it('forgets a frame stopped by hand, so it is never released again', async () => {
    const { startRunning, stopRunning, IDLE_RELEASE_MS } = await schedule();
    const kept = running(stopRunning);
    const stopped = running(stopRunning);
    startRunning(kept);
    startRunning(stopped);
    stopRunning(stopped);
    vi.advanceTimersByTime(IDLE_RELEASE_MS + 5000);
    expect(stopped.release).not.toHaveBeenCalled();
    expect(kept.release).toHaveBeenCalledOnce();
  });
});
