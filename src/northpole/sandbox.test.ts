import { describe, expect, it } from 'vitest';
import { framesToRelease, IDLE_RELEASE_MS, MAX_LIVE_FRAMES } from './sandbox';

const frames = (...lastDrawn: number[]) => lastDrawn.map((t, i) => ({ id: i, lastDrawn: t }));

describe('framesToRelease', () => {
  it('keeps frames drawn recently', () => {
    expect(framesToRelease(frames(990, 995, 1000), 1000)).toEqual([]);
  });

  it('releases frames nobody has drawn for a while', () => {
    const live = frames(0, 1000 + IDLE_RELEASE_MS);
    expect(framesToRelease(live, 1001 + IDLE_RELEASE_MS).map((f) => f.id)).toEqual([0]);
  });

  it('makes room for a new frame by releasing the least recently drawn', () => {
    const live = frames(...Array.from({ length: MAX_LIVE_FRAMES }, (_, i) => 1000 + i));
    expect(framesToRelease(live, 1000 + MAX_LIVE_FRAMES, { adding: 1 }).map((f) => f.id)).toEqual([
      0,
    ]);
  });

  it('never keeps more than the limit running', () => {
    const live = frames(...Array.from({ length: 40 }, (_, i) => 5000 - i));
    const released = framesToRelease(live, 5000, { adding: 1 });
    expect(live.length - released.length + 1).toBe(MAX_LIVE_FRAMES);
  });

  it('keeps a frame drawn exactly the idle time ago, and releases one a moment older', () => {
    const live = frames(1000, 999);
    expect(framesToRelease(live, 1000 + IDLE_RELEASE_MS).map((f) => f.id)).toEqual([1]);
  });

  it('keeps every frame while there is room, one short of the limit included', () => {
    const live = frames(...Array.from({ length: MAX_LIVE_FRAMES - 1 }, (_, i) => 1000 + i));
    expect(framesToRelease(live, 1000)).toEqual([]);
    expect(framesToRelease(live, 1000, { adding: 1 })).toEqual([]);
    expect(framesToRelease(live, 1000, { adding: 2 }).map((f) => f.id)).toEqual([0]);
  });

  it('releases the idle first, then the least recently drawn of the rest, oldest first', () => {
    const live = frames(500, 30, 0, 40, 20, 10);
    const released = framesToRelease(live, 100, { max: 2, idleMs: 95 });
    expect(released.map((f) => f.id)).toEqual([2, 5, 4, 1]);
  });

  it('takes its own limit and idle time', () => {
    const live = frames(0, 10, 20);
    expect(framesToRelease(live, 25, { max: 1 }).map((f) => f.id)).toEqual([0, 1]);
    expect(framesToRelease(live, 25, { idleMs: 10 }).map((f) => f.id)).toEqual([0, 1]);
  });
});
