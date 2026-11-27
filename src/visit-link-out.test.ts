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

  it('opens the link asked for up to a second and a half after the tap, and no later', () => {
    vi.useFakeTimers();
    const opened = vi.spyOn(window, 'open').mockReturnValue(null);
    const frame = document.createElement('div');
    const { square, ask } = asking();
    followLinkAsks(frame, square, 'attraction', 'the-studio');
    frame.dispatchEvent(new Event('pointerdown'));
    vi.advanceTimersByTime(1500);
    ask(0);
    expect(opened).toHaveBeenCalledExactlyOnceWith(
      expect.stringContaining('podcast'),
      '_blank',
      'noopener',
    );
    frame.dispatchEvent(new Event('pointerdown'));
    vi.advanceTimersByTime(1501);
    ask(0);
    expect(opened).toHaveBeenCalledOnce();
  });

  it("hears a tap on the place's frame before anything inside it can stop it", () => {
    const opened = vi.spyOn(window, 'open').mockReturnValue(null);
    const frame = document.createElement('div');
    const inside = document.createElement('canvas');
    frame.append(inside);
    inside.addEventListener('pointerdown', (event) => {
      event.stopPropagation();
    });
    const { square, ask } = asking();
    followLinkAsks(frame, square, 'attraction', 'the-studio');
    inside.dispatchEvent(new Event('pointerdown', { bubbles: true }));
    ask(1);
    expect(opened).toHaveBeenCalledOnce();
  });

  it('stops hearing taps once the visit ends', () => {
    const frame = document.createElement('div');
    const removed = vi.spyOn(frame, 'removeEventListener');
    const added = vi.spyOn(frame, 'addEventListener');
    followLinkAsks(frame, asking().square, 'attraction', 'the-studio').stop();
    expect(added).toHaveBeenCalledExactlyOnceWith('pointerdown', expect.any(Function), true);
    expect(removed).toHaveBeenCalledExactlyOnceWith('pointerdown', added.mock.calls[0]?.[1], true);
  });

  it("follows a level's own place, and opens only links on its list", () => {
    const opened = vi.spyOn(window, 'open').mockReturnValue(null);
    const frame = document.createElement('div');
    const { square, ask } = asking();
    followLinkAsks(frame, square, 'level', 'the-studio');
    frame.dispatchEvent(new Event('pointerdown'));
    ask(2);
    ask(-3);
    expect(opened).not.toHaveBeenCalled();
    ask(-1);
    expect(opened).toHaveBeenCalledExactlyOnceWith(
      expect.stringContaining('youtube.com'),
      '_blank',
      'noopener',
    );
  });
});
