// @vitest-environment happy-dom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { drawBeat, INTRO_BEATS, STILL } from './intro-scene';
import { startIntro } from './intro';

/** A context that records which drawing calls it got, and the sizes of the rectangles filled. */
function recordingContext() {
  const calls: string[] = [];
  const ctx = new Proxy(
    {},
    {
      get: (_target, key) => {
        if (key === 'calls') return calls;
        if (key === 'createLinearGradient' || key === 'createRadialGradient')
          return () => ({ addColorStop() {} });
        return () => calls.push(String(key));
      },
      set: () => true,
    },
  );
  return ctx as unknown as CanvasRenderingContext2D & { calls: string[] };
}

// happy-dom's OffscreenCanvas draws nothing, so the diorama paints its backdrop straight on.
beforeEach(() => {
  vi.stubGlobal('OffscreenCanvas', undefined);
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("the intro's scenes", () => {
  it('has three beats, each a title and one short line', () => {
    expect(INTRO_BEATS.map(({ title }) => title)).toEqual([
      'Write an issue.',
      'The factory builds it.',
      'It lands on the map.',
    ]);
    for (const { line } of INTRO_BEATS) expect(line.length).toBeLessThan(70);
  });

  it('draws each beat as a diorama, through a whole loop of its animation', () => {
    for (const beat of [0, 1, 2]) {
      for (const time of [0, 0.5, 1.05, 1.3, 1.8, 2.6, STILL, 3.9]) {
        const ctx = recordingContext();
        drawBeat(ctx, beat, 240, time);
        expect(ctx.calls[0]).toBe('save');
        expect(ctx.calls.length).toBeGreaterThan(20);
      }
    }
  });

  it('pops the stall up a second into its beat, and shows it standing when still', () => {
    const count = (time: number) => {
      const ctx = recordingContext();
      drawBeat(ctx, 2, 240, time);
      return ctx.calls.filter((call) => call === 'fill').length;
    };
    expect(count(0.5)).toBeLessThan(count(1.05));
    expect(count(1.05)).toBeLessThan(count(STILL));
  });

  it('draws nothing for a beat it does not have', () => {
    const ctx = recordingContext();
    drawBeat(ctx, 3, 240, 0);
    expect(ctx.calls).toEqual([]);
  });
});

describe('the intro animating its scenes', () => {
  const open = (reduced: boolean) => {
    const ctx = recordingContext();
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(ctx);
    vi.stubGlobal('matchMedia', () => ({ matches: reduced }));
    const frames: FrameRequestCallback[] = [];
    vi.stubGlobal('requestAnimationFrame', (paint: FrameRequestCallback) => frames.push(paint));
    localStorage.clear();
    document.body.innerHTML = '';
    const intro = startIntro('#/');
    return { ctx, frames, intro };
  };

  it('draws every frame while it is open', () => {
    const { ctx, frames, intro } = open(false);
    const first = ctx.calls.length;
    frames[0]?.(1000);
    expect(ctx.calls.length).toBeGreaterThan(first);
    expect(frames).toHaveLength(2);
    intro.stop();
  });

  it('draws the three beats once, still, with reduced motion', () => {
    const { ctx, frames, intro } = open(true);
    expect(ctx.calls.filter((call) => call === 'save').length).toBeGreaterThanOrEqual(3);
    expect(frames).toEqual([]);
    intro.stop();
  });
});
