// @vitest-environment happy-dom
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { SquareAsk } from './northpole/square-ask';
import { switchFlags } from './test-support/feature-flags';
import { followAsks } from './visit-link-out';

/** A stand-in sandboxed square that can ask for a link or a place, as its frame would. */
function asking() {
  let listener: ((ask: SquareAsk) => void) | undefined;
  const square = {
    onAsk: (heard: (ask: SquareAsk) => void) => {
      listener = heard;
      return () => {
        listener = undefined;
      };
    },
  };
  return {
    square,
    ask: (link: number) => listener?.({ open: link }),
    visit: (place: string, open?: number) =>
      listener?.({ visit: place, ...(open === undefined ? {} : { open }) }),
  };
}

afterEach(() => {
  vi.restoreAllMocks();
  vi.useRealTimers();
  document.body.replaceChildren();
  location.hash = '';
});

describe("a North Pole place's game opening its links", () => {
  it('opens the asked link in a new tab, once, just after a tap on the page', () => {
    vi.useFakeTimers();
    const opened = vi.spyOn(window, 'open').mockReturnValue(null);
    const frame = document.createElement('div');
    const { square, ask } = asking();
    const follow = followAsks(frame, square, 'attraction', 'the-studio');
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
    followAsks(frame, square, 'booth', 'ana').stop();
    followAsks(frame, square, 'attraction', 'ferris-wheel').stop();
    followAsks(frame, {}, 'attraction', 'the-factory').stop();
    frame.dispatchEvent(new Event('pointerdown'));
    ask(0);
    expect(opened).not.toHaveBeenCalled();
  });

  it('opens the link asked for up to a second and a half after the tap, and no later', () => {
    vi.useFakeTimers();
    const opened = vi.spyOn(window, 'open').mockReturnValue(null);
    const frame = document.createElement('div');
    const { square, ask } = asking();
    followAsks(frame, square, 'attraction', 'the-studio');
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
    followAsks(frame, square, 'attraction', 'the-studio');
    inside.dispatchEvent(new Event('pointerdown', { bubbles: true }));
    ask(1);
    expect(opened).toHaveBeenCalledOnce();
  });

  it('stops hearing taps once the visit ends', () => {
    const frame = document.createElement('div');
    const removed = vi.spyOn(frame, 'removeEventListener');
    const added = vi.spyOn(frame, 'addEventListener');
    followAsks(frame, asking().square, 'attraction', 'the-studio').stop();
    expect(added).toHaveBeenCalledExactlyOnceWith('pointerdown', expect.any(Function), true);
    expect(removed).toHaveBeenCalledExactlyOnceWith('pointerdown', added.mock.calls[0]?.[1], true);
  });

  it("follows a level's own place, and opens only links on its list", () => {
    const opened = vi.spyOn(window, 'open').mockReturnValue(null);
    const frame = document.createElement('div');
    const { square, ask } = asking();
    followAsks(frame, square, 'level', 'the-studio');
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

describe("a North Pole place's game sending the visitor on", () => {
  it('goes to another North Pole place, once, just after a tap on the page', () => {
    vi.useFakeTimers();
    const frame = document.createElement('div');
    const { square, visit } = asking();
    followAsks(frame, square, 'attraction', 'the-factory');
    visit('the-academy');
    expect(location.hash).toBe('');
    frame.dispatchEvent(new Event('pointerdown'));
    visit('the-academy');
    expect(location.hash).toBe('#/attraction/the-academy');
    location.hash = '';
    visit('the-studio');
    expect(location.hash).toBe('');
    frame.dispatchEvent(new Event('pointerdown'));
    vi.advanceTimersByTime(1501);
    visit('the-studio');
    expect(location.hash).toBe('');
  });

  it('goes only to a place on the list, and keeps the tap for one that is', () => {
    const opened = vi.spyOn(window, 'open').mockReturnValue(null);
    const frame = document.createElement('div');
    const { square, visit } = asking();
    followAsks(frame, square, 'attraction', 'the-academy');
    frame.dispatchEvent(new Event('pointerdown'));
    for (const place of ['ferris-wheel', 'jedi4ever', 'constructor', '']) visit(place);
    expect(location.hash).toBe('');
    visit('the-factory', 99);
    expect(location.hash).toBe('#/attraction/the-factory');
    expect(opened).not.toHaveBeenCalled();
  });

  it('opens the link when an ask names both a link and a place', () => {
    const opened = vi.spyOn(window, 'open').mockReturnValue(null);
    const frame = document.createElement('div');
    const { square, visit } = asking();
    followAsks(frame, square, 'attraction', 'the-factory');
    frame.dispatchEvent(new Event('pointerdown'));
    visit('the-academy', 0);
    expect(opened).toHaveBeenCalledOnce();
    expect(location.hash).toBe('');
  });

  it('never sends anyone on from a booth', () => {
    const frame = document.createElement('div');
    const { square, visit } = asking();
    followAsks(frame, square, 'booth', 'ana');
    frame.dispatchEvent(new Event('pointerdown'));
    visit('the-academy');
    expect(location.hash).toBe('');
  });

  describe('with levels on', () => {
    switchFlags({ levels: true });

    it("goes to a landmark's level", () => {
      const frame = document.createElement('div');
      const { square, visit } = asking();
      followAsks(frame, square, 'attraction', 'the-factory');
      frame.dispatchEvent(new Event('pointerdown'));
      visit('the-academy');
      expect(location.hash).toBe('#/level/the-academy');
    });
  });
});
