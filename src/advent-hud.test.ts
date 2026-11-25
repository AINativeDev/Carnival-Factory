// @vitest-environment happy-dom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ADVENT_CALENDAR, openAdventHud } from './advent';

const YEAR = ADVENT_CALENDAR.year;

/** Opens the calendar over a fresh map frame at `now`, the way the router does. */
function open(now: Date) {
  document.body.innerHTML =
    '<a id="advent-link" href="#/advent">Advent</a><div class="map-frame"><canvas tabindex="0"></canvas></div>';
  const frame = document.querySelector<HTMLElement>('.map-frame');
  if (!frame) throw new Error('The test page has no map frame');
  document.querySelector<HTMLElement>('#advent-link')?.focus();
  const onClose = vi.fn();
  const hud = openAdventHud(frame, { now, onClose });
  const card = frame.querySelector<HTMLElement>('.advent');
  if (!card) throw new Error('The advent calendar did not open');
  return { frame, card, hud, onClose };
}

const openDays = (card: HTMLElement) =>
  [...card.querySelectorAll<HTMLElement>('.advent-door[data-open]')].map(
    (door) => door.querySelector('.advent-day')?.textContent,
  );

beforeEach(() => {
  vi.useFakeTimers();
});
afterEach(() => {
  vi.useRealTimers();
  document.body.innerHTML = '';
});

describe('the advent calendar page', () => {
  it('shows every door shut, with the day it opens, before December', () => {
    const { frame, card } = open(new Date(YEAR, 10, 25, 12));
    expect(frame.dataset.factory).toBe('');
    expect(card.querySelectorAll('.advent-door')).toHaveLength(24);
    expect(openDays(card)).toEqual([]);
    expect(card.querySelector('.advent-shut')?.textContent).toBe('Opens on 1 December');
    expect(card.querySelector('.factory-note')?.textContent).toBe(
      `The first door opens on 1 December ${String(YEAR)}.`,
    );
    expect(document.activeElement).toBe(card.querySelector('.visit-title'));
  });

  it("sets each open door's challenge as text, with how to check it and its docs", () => {
    const { card } = open(new Date(YEAR, 11, 2, 9));
    expect(openDays(card)).toEqual(['1', '2']);
    const first = ADVENT_CALENDAR.challenges.at(0);
    if (!first) throw new Error('The calendar has no challenges');
    const door = card.querySelector('.advent-door[data-open]');
    expect(door?.querySelector('.advent-title')?.textContent).toBe(first.title);
    expect(door?.querySelector('.advent-check')?.textContent).toBe(
      `You'll know it worked when: ${first.check}`,
    );
    const docs = door?.querySelector<HTMLAnchorElement>('a');
    expect(docs?.href).toBe(first.docs);
    expect(docs?.rel).toBe('noopener');
  });

  it('opens the next door at midnight while it stays open, and stops once closed', async () => {
    vi.setSystemTime(new Date(YEAR, 11, 3, 23, 59));
    const { card, hud } = open(new Date());
    expect(openDays(card)).toHaveLength(3);
    await vi.advanceTimersByTimeAsync(2 * 60 * 1000);
    expect(openDays(card)).toHaveLength(4);
    hud.close();
    expect(vi.getTimerCount()).toBe(0);
  });

  it('leaves with Esc or the Leave button, and keeps every other key from the map', () => {
    const { card, onClose } = open(new Date(YEAR, 11, 24));
    const mapKeys = vi.fn();
    window.addEventListener('keydown', mapKeys);
    const walk = new KeyboardEvent('keydown', { key: 'ArrowUp', bubbles: true, cancelable: true });
    document.dispatchEvent(walk);
    expect(mapKeys).not.toHaveBeenCalled();
    expect(walk.defaultPrevented).toBe(false);

    const escape = new KeyboardEvent('keydown', { key: 'Escape', cancelable: true });
    document.dispatchEvent(escape);
    expect(escape.defaultPrevented).toBe(true);
    card.querySelector<HTMLButtonElement>('.visit-close')?.click();
    expect(onClose).toHaveBeenCalledTimes(2);
    window.removeEventListener('keydown', mapKeys);
  });

  it('closes, giving focus back to what had it, unless focus had already moved', () => {
    const first = open(new Date(YEAR, 11, 24));
    first.hud.close();
    expect(first.frame.querySelector('.advent')).toBeNull();
    expect(first.frame.dataset.factory).toBeUndefined();
    expect(document.activeElement?.id).toBe('advent-link');
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    expect(first.onClose).not.toHaveBeenCalled();

    const second = open(new Date(YEAR, 11, 24));
    const canvas = second.frame.querySelector('canvas');
    canvas?.focus();
    second.hud.close();
    expect(document.activeElement).toBe(canvas);
  });
});
