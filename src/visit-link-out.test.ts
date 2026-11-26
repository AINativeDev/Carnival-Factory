// @vitest-environment happy-dom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { followLinkAsks } from './visit-link-out';

/** A stand-in sandboxed square that can ask for a link, as its frame would. */
function asking() {
  let listener: ((link: number) => void) | undefined;
  const square = {
    onLink: (heard: (link: number) => void) => {
      listener = heard;
      return () => {
        listener = undefined;
      };
    },
  };
  return { square, ask: (link: number) => listener?.(link) };
}

afterEach(() => {
  vi.restoreAllMocks();
  vi.useRealTimers();
  document.body.replaceChildren();
});

describe("a North Pole place's game opening its links", () => {
  it('opens the asked link in a new tab, once, just after a tap on the page', () => {
    vi.useFakeTimers();
    const opened = vi.spyOn(window, 'open').mockReturnValue(null);
    const frame = document.createElement('div');
    const { square, ask } = asking();
    const follow = followLinkAsks(frame, square, 'attraction', 'the-studio');
    ask(0);
    expect(opened).not.toHaveBeenCalled();
    frame.dispatchEvent(new Event('pointerdown'));
    ask(1);
    expect(opened).toHaveBeenCalledExactlyOnceWith(
      expect.stringContaining('youtube.com'),
      '_blank',
      'noopener',
    );
    ask(1);
    frame.dispatchEvent(new Event('pointerdown'));
    ask(5);
    vi.advanceTimersByTime(2000);
    ask(0);
    expect(opened).toHaveBeenCalledOnce();
    follow.stop();
    frame.dispatchEvent(new Event('pointerdown'));
    ask(0);
    expect(opened).toHaveBeenCalledOnce();
  });

  it("never listens for a booth, a place without links, or a square that can't ask", () => {
    const frame = document.createElement('div');
    const { square, ask } = asking();
    const opened = vi.spyOn(window, 'open').mockReturnValue(null);
    followLinkAsks(frame, square, 'booth', 'ana').stop();
    followLinkAsks(frame, square, 'attraction', 'ferris-wheel').stop();
    followLinkAsks(frame, {}, 'attraction', 'the-factory').stop();
    frame.dispatchEvent(new Event('pointerdown'));
    ask(0);
    expect(opened).not.toHaveBeenCalled();
  });
});
