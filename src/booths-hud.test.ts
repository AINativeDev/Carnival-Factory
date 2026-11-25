// @vitest-environment happy-dom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { stopPanels, openPanel, square } from './test-support/booths-panel';

/** A booth the build knows the date and name of (vite.config.ts), so it's Recently added. */
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

const summary = (panel: HTMLElement, section: string) =>
  panel.querySelector(`.hud-section[data-section="${section}"] > summary`)?.textContent;

describe('the Booths panel', () => {
  it('lists the featured square, the attractions and every booth A to Z, each as text', () => {
    const { panel, names } = openPanel({
      featured: { kind: 'attraction', square: square('ferris-wheel') },
    });
    expect(names('.hud-featured')).toEqual(['Ferris wheel']);
    expect(panel.querySelector('.hud-featured .label')?.textContent).toBe('Featured: ');
    expect(panel.querySelector<HTMLElement>('.hud-featured')?.hidden).toBe(false);
    expect(names('.hud-attractions')).toEqual(['Ferris wheel']);
    expect(names('.hud-all')).toEqual(['Bakery', 'Cocoa']);
    expect(panel.querySelector('.hud-all .owner')?.textContent).toBe('@bob');
    expect(panel.querySelector('.hud-attractions .owner')?.textContent).toBe('');
    expect(panel.querySelector('.hud-walk')?.getAttribute('aria-label')).toBe(
      'Walk to Ferris wheel',
    );
    expect(summary(panel, 'all')).toMatch(/^All booths/);
    expect(panel.querySelector<HTMLElement>('[data-section="recent"]')?.hidden).toBe(true);
  });

  it('features nothing when the featured square is not on the map', () => {
    const { panel } = openPanel({ featured: { kind: 'booth', square: square('nobody') } });
    expect(panel.querySelector<HTMLElement>('.hud-featured')?.hidden).toBe(true);
  });

  it('names an attraction the build read no name for by its own', () => {
    const { names } = openPanel({ attractions: [square('snow-maze', 'Snow maze')] });
    expect(names('.hud-attractions')).toEqual(['Snow maze']);
  });

  it('shows booths a page at a time, and the newest booths by the names the build read', () => {
    const many = Array.from({ length: 25 }, (_, n) => square(`b${String(n).padStart(2, '0')}`));
    const { panel, names } = openPanel({ booths: [...many, square(DATED)] });
    expect(names('.hud-all')).toHaveLength(20);
    const more = panel.querySelector<HTMLButtonElement>('.hud-more');
    expect(more?.hidden).toBe(false);
    more?.click();
    expect(names('.hud-all')).toHaveLength(26);
    expect(more?.hidden).toBe(true);
    expect(panel.querySelector<HTMLElement>('[data-section="recent"]')?.hidden).toBe(false);
    expect(names('.hud-recent')).toHaveLength(1);
    expect(names('.hud-recent')[0]).not.toBe(DATED);
  });

  it('lists the squares near the player, again as they walk', () => {
    const { panel, map, names } = openPanel();
    expect(names('.hud-near')).toEqual([]);
    map.near = [
      { kind: 'booth', id: 'bob' },
      { kind: 'booth', id: 'gone' },
    ];
    vi.advanceTimersByTime(1000);
    expect(names('.hud-near')).toEqual(['Bakery']);
    expect(summary(panel, 'near')).toMatch(/^Near you/);
    const listed = panel.querySelector('.hud-near .hud-go');
    vi.advanceTimersByTime(1000);
    expect(panel.querySelector('.hud-near .hud-go')).toBe(listed);
  });

  it('glides to a square on a click, lets go on a second, and walks on a shift-click or the walk icon', () => {
    const { hud, map, entry, canvas, onPicked } = openPanel();
    entry('.hud-all', 'ana').click();
    expect(map.jumpTo).toHaveBeenCalledWith('booth', 'ana');
    hud.showSelected({ kind: 'booth', id: 'ana' });
    expect(entry('.hud-all', 'ana').getAttribute('aria-pressed')).toBe('true');
    expect(entry('.hud-all', 'bob').classList.contains('selected')).toBe(false);
    entry('.hud-all', 'ana').click();
    expect(map.clearSelection).toHaveBeenCalled();
    entry('.hud-all', 'bob').dispatchEvent(new MouseEvent('click', { shiftKey: true }));
    expect(map.walkTo).toHaveBeenCalledWith('booth', 'bob');
    expect(document.activeElement).toBe(canvas);
    entry('.hud-all', 'bob').nextElementSibling?.dispatchEvent(new MouseEvent('click'));
    expect(map.walkTo).toHaveBeenCalledTimes(2);
    expect(onPicked).toHaveBeenCalledTimes(4);
    hud.showSelected(undefined);
    expect(entry('.hud-all', 'ana').getAttribute('aria-pressed')).toBe('false');
  });

  it('marks the square already picked when it opens, and picks without telling the page', () => {
    const { map, entry } = openPanel({}, { selected: { kind: 'booth', id: 'ana' }, quiet: true });
    expect(entry('.hud-all', 'ana').getAttribute('aria-pressed')).toBe('true');
    entry('.hud-all', 'ana').click();
    expect(map.clearSelection).toHaveBeenCalled();
  });

  it("shows a square's own name once its frame says it, keeping the entry that had the focus", () => {
    const ana = square('ana', 'Cocoa');
    const { names, named, entry } = openPanel({ booths: [ana, square('bob', 'Bakery')] });
    entry('.hud-all', 'ana').focus();
    ana.name = 'ana';
    named.get('ana')?.();
    expect(names('.hud-all')).toEqual(['Bakery', 'Cocoa']);
    ana.name = 'Aardvark cocoa';
    named.get('ana')?.();
    expect(names('.hud-all')).toEqual(['Aardvark cocoa', 'Bakery']);
    expect(document.activeElement).toBe(entry('.hud-all', 'ana'));
    named.get('ana')?.();
    expect(names('.hud-all')).toEqual(['Aardvark cocoa', 'Bakery']);
  });

  it('stops following the player when it stops', () => {
    const { hud, map, names } = openPanel();
    hud.stop();
    map.near = [{ kind: 'booth', id: 'bob' }];
    vi.advanceTimersByTime(1000);
    expect(names('.hud-near')).toEqual([]);
  });
});
