// @vitest-environment happy-dom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { openPanel, stopPanels } from './test-support/booths-panel';

const KEY = 'north-pole-booths-panel';
const saved = () => JSON.parse(localStorage.getItem(KEY) ?? 'null') as unknown;

beforeEach(() => {
  localStorage.clear();
});
afterEach(() => {
  stopPanels();
  vi.restoreAllMocks();
});

const section = (panel: HTMLElement, name: string) => {
  const found = panel.querySelector<HTMLDetailsElement>(`.hud-section[data-section="${name}"]`);
  if (!found) throw new Error(`No ${name} section`);
  return found;
};

describe('what the Booths panel remembers', () => {
  it('folds the sections as they were left, and remembers them as they are folded', () => {
    localStorage.setItem(KEY, JSON.stringify({ me: 'Ana', closed: ['all'] }));
    const { panel, map, hud } = openPanel();
    expect(section(panel, 'all').open).toBe(false);
    expect(section(panel, 'near').open).toBe(true);
    expect(hud.me).toBe('ana');
    expect(map.setMe).toHaveBeenCalledWith('ana');
    expect(panel.querySelector<HTMLSelectElement>('.hud-me-select')?.value).toBe('ana');

    section(panel, 'near').open = false;
    section(panel, 'near').dispatchEvent(new Event('toggle'));
    expect(saved()).toEqual({ me: 'ana', closed: ['near', 'all'] });
  });

  it('lets the visitor say which booth is theirs, there or from a visit', () => {
    const { panel, map, hud } = openPanel();
    const mine = panel.querySelector<HTMLSelectElement>('.hud-me-select');
    expect([...(mine?.options ?? [])].map((option) => option.textContent)).toEqual([
      'Pick your booth',
      '@bob',
      '@ana',
    ]);
    if (mine) mine.value = 'bob';
    mine?.dispatchEvent(new Event('change'));
    expect(map.setMe).toHaveBeenLastCalledWith('bob');
    expect(saved()).toEqual({ me: 'bob', closed: [] });

    hud.setMe('ana');
    expect([hud.me, mine?.value]).toEqual(['ana', 'ana']);
    hud.setMe('nobody');
    expect([hud.me, mine?.value]).toEqual(['nobody', '']);
    if (mine) mine.value = '';
    mine?.dispatchEvent(new Event('change'));
    expect(hud.me).toBeUndefined();
    expect(map.setMe).toHaveBeenLastCalledWith(undefined);
  });

  it('just forgets when the page has no storage', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('No storage');
    });
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('No storage');
    });
    const { hud, panel } = openPanel();
    expect(hud.me).toBeUndefined();
    expect(section(panel, 'all').open).toBe(true);
    expect(() => {
      hud.setMe('ana');
    }).not.toThrow();
    expect(hud.me).toBe('ana');
  });
});
