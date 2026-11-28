// @vitest-environment happy-dom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { NUDGE, nudgeDue, startNudge } from './nudge';

describe('when the nudge is due', () => {
  it('waits a minute after the page opens, then for a square enjoyed or a few looked round', () => {
    const settled = { sinceLoad: NUDGE.settle, inside: 0, visits: 1 };
    expect(nudgeDue({ ...settled, inside: NUDGE.inside })).toBe(true);
    expect(nudgeDue({ ...settled, visits: NUDGE.visits })).toBe(true);
    expect(nudgeDue({ ...settled, inside: NUDGE.inside - 1, visits: NUDGE.visits - 1 })).toBe(
      false,
    );
    expect(nudgeDue({ sinceLoad: NUDGE.settle - 1, inside: 60_000, visits: 9 })).toBe(false);
  });
});

describe('the nudge on the map', () => {
  let frame: HTMLElement;
  let mine = false;
  const showSpot = vi.fn();
  const card = () => frame.querySelector('.nudge');
  /** A nudge with the page open for `opened` ms, and the player inside `id` for `inside` ms. */
  const after = (opened: number) => {
    const nudge = startNudge(frame, { showSpot, mine: () => mine });
    vi.advanceTimersByTime(opened);
    return nudge;
  };
  const visit = (nudge: ReturnType<typeof startNudge>, id: string, inside: number) => {
    nudge.entered(id);
    vi.advanceTimersByTime(inside);
    nudge.left();
  };

  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout', 'performance'] });
    frame = document.createElement('div');
    document.body.append(frame);
    mine = false;
    showSpot.mockClear();
    localStorage.clear();
  });
  afterEach(() => {
    vi.useRealTimers();
    document.body.replaceChildren();
  });

  it('shows once, a moment after the player comes out of a square they enjoyed, then goes', () => {
    const nudge = after(NUDGE.settle);
    visit(nudge, 'booth:ana', NUDGE.inside);
    expect(card()).toBeNull();
    vi.advanceTimersByTime(NUDGE.delay);
    expect(card()?.getAttribute('role')).toBe('status');
    expect(card()?.textContent).toContain('free spot nearby');
    vi.advanceTimersByTime(NUDGE.shown);
    expect(card()).toBeNull();
    visit(nudge, 'booth:bo', NUDGE.inside);
    vi.advanceTimersByTime(NUDGE.delay);
    expect(card()).toBeNull();
  });

  it('shows after a third square looked round, however short the visits', () => {
    const nudge = after(NUDGE.settle);
    visit(nudge, 'booth:ana', 100);
    visit(nudge, 'booth:ana', 100);
    visit(nudge, 'booth:bo', 100);
    vi.advanceTimersByTime(NUDGE.delay);
    expect(card()).toBeNull();
    visit(nudge, 'attraction:ferris-wheel', 100);
    vi.advanceTimersByTime(NUDGE.delay);
    expect(card()).not.toBeNull();
  });

  it('waits for the page to settle, and counts nothing for coming out without going in', () => {
    const nudge = after(NUDGE.settle - NUDGE.inside - 1);
    visit(nudge, 'booth:ana', NUDGE.inside);
    nudge.left();
    vi.advanceTimersByTime(NUDGE.delay);
    expect(card()).toBeNull();
  });

  it('never shows when going straight into another square, and shows the next time out', () => {
    const nudge = after(NUDGE.settle);
    visit(nudge, 'booth:ana', NUDGE.inside);
    nudge.entered('booth:bo');
    vi.advanceTimersByTime(NUDGE.delay);
    expect(card()).toBeNull();
    vi.advanceTimersByTime(NUDGE.inside);
    nudge.left();
    nudge.left();
    vi.advanceTimersByTime(NUDGE.delay);
    expect(frame.querySelectorAll('.nudge')).toHaveLength(1);
  });

  it('takes the player to the free spot, once', () => {
    const nudge = after(NUDGE.settle);
    visit(nudge, 'booth:ana', NUDGE.inside);
    vi.advanceTimersByTime(NUDGE.delay);
    frame.querySelector<HTMLButtonElement>('.nudge-go')?.click();
    expect(showSpot).toHaveBeenCalledOnce();
    expect(card()).toBeNull();
    vi.advanceTimersByTime(NUDGE.shown);
    expect(card()).toBeNull();
  });

  it('stays closed for good once closed, even on the next page load', () => {
    visit(after(NUDGE.settle), 'booth:ana', NUDGE.inside);
    vi.advanceTimersByTime(NUDGE.delay);
    const close = frame.querySelector<HTMLButtonElement>('.nudge-close');
    expect(close?.getAttribute('aria-label')).toBe('Not now');
    close?.click();
    expect(card()).toBeNull();
    visit(after(NUDGE.settle), 'booth:bo', NUDGE.inside);
    vi.advanceTimersByTime(NUDGE.delay);
    expect(card()).toBeNull();
    expect(showSpot).not.toHaveBeenCalled();
  });

  it('never nudges someone who said which booth is theirs, or is already claiming a spot', () => {
    mine = true;
    visit(after(NUDGE.settle), 'booth:ana', NUDGE.inside);
    vi.advanceTimersByTime(NUDGE.delay);
    expect(card()).toBeNull();
    mine = false;
    const claiming = after(NUDGE.settle);
    claiming.entered('booth:ana');
    vi.advanceTimersByTime(NUDGE.inside);
    claiming.skip();
    claiming.left();
    vi.advanceTimersByTime(NUDGE.delay);
    expect(card()).toBeNull();
  });

  it('goes when the map stops, and still shows on a page without storage', () => {
    const blocked = vi.spyOn(localStorage, 'getItem').mockImplementation(() => {
      throw new Error('blocked');
    });
    vi.spyOn(localStorage, 'setItem').mockImplementation(() => {
      throw new Error('blocked');
    });
    const nudge = after(NUDGE.settle);
    visit(nudge, 'booth:ana', NUDGE.inside);
    vi.advanceTimersByTime(NUDGE.delay);
    expect(card()).not.toBeNull();
    frame.querySelector<HTMLButtonElement>('.nudge-close')?.click();
    expect(card()).toBeNull();
    blocked.mockRestore();
    vi.restoreAllMocks();
    const later = after(NUDGE.settle);
    visit(later, 'booth:ana', NUDGE.inside);
    later.stop();
    vi.advanceTimersByTime(NUDGE.delay);
    expect(card()).toBeNull();
  });
});
