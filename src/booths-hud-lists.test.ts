// @vitest-environment happy-dom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { stopPanels, openPanel, square } from './test-support/booths-panel';

/** A booth the build knows the date of (vite.config.ts), so it's Recently added. */
const DATED = 'hamzaoza';

beforeEach(() => {
  localStorage.clear();
  vi.useFakeTimers();
});
afterEach(() => {
  stopPanels();
  vi.useRealTimers();
  vi.restoreAllMocks();
});

const summaries = (panel: HTMLElement) =>
  [...panel.querySelectorAll('.hud-section > summary')].map((summary) => summary.textContent);

describe("the Booths panel's lists", () => {
  it('head each section with how many it holds', () => {
    const { panel, map } = openPanel({ booths: [square('ana', 'Cocoa'), square(DATED)] });
    expect(summaries(panel)).toContain('Recently added (1)');
    expect(summaries(panel)).toContain('Attractions (1)');
    expect(summaries(panel)).toContain('All booths (2)');
    map.near = [
      { kind: 'booth', id: 'ana' },
      { kind: 'attraction', id: 'ferris-wheel' },
    ];
    vi.advanceTimersByTime(1000);
    expect(summaries(panel)).toContain('Near you (2)');
  });

  it('ask the map for the five nearest, and list only squares of the kind it names', () => {
    const { map, names } = openPanel();
    const nearest = vi.spyOn(map, 'nearest');
    map.near = [
      { kind: 'attraction', id: 'bob' },
      { kind: 'booth', id: 'ana' },
    ];
    vi.advanceTimersByTime(999);
    expect(nearest).not.toHaveBeenCalled();
    vi.advanceTimersByTime(1);
    expect(nearest).toHaveBeenCalledWith(5);
    expect(names('.hud-near')).toEqual(['Cocoa']);
  });

  it('show All booths twenty at a time, with no More when twenty is all', () => {
    const twenty = Array.from({ length: 20 }, (_, n) => square(`b${String(n).padStart(2, '0')}`));
    const { panel, names } = openPanel({ booths: twenty });
    expect(names('.hud-all')).toHaveLength(20);
    expect(panel.querySelector<HTMLElement>('.hud-more')?.hidden).toBe(true);
  });

  it('count the search results in their heading', () => {
    const { panel } = openPanel();
    const input = panel.querySelector<HTMLInputElement>('.hud-search-input');
    if (!input) throw new Error('No search box');
    input.value = 'b';
    input.dispatchEvent(new Event('input'));
    expect(panel.querySelector('.hud-results-title')?.textContent).toBe('Results (1)');
  });
});
