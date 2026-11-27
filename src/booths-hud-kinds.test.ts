// @vitest-environment happy-dom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { stopPanels, openPanel, square } from './test-support/booths-panel';

beforeEach(() => {
  localStorage.clear();
});
afterEach(() => {
  stopPanels();
  vi.restoreAllMocks();
});

/** A booth and an attraction that share an id, so only their kinds tell them apart. */
const twins = () => ({
  attractions: [square('bob', 'Bob’s ride')],
  booths: [square('ana', 'Cocoa'), square('bob', 'Bakery')],
});

describe("the Booths panel's entries, by kind and id", () => {
  it('features the square of the kind asked for, in a list of its own', () => {
    const { attractions, booths } = twins();
    const bakery = booths[1] ?? square('bob');
    const { panel } = openPanel({
      attractions,
      booths,
      featured: { kind: 'booth', square: bakery },
    });
    const featured = panel.querySelector('.hud-featured ul');
    expect(featured?.className).toBe('hud-list');
    expect(featured?.querySelector('.name')?.textContent).toBe('Bakery');
    expect(featured?.querySelector('.owner')?.textContent).toBe('@bob');
  });

  it('labels only the featured entry', () => {
    const { panel } = openPanel();
    expect(
      [...panel.querySelectorAll('.hud-all .label')].map((label) => label.textContent),
    ).toEqual(['', '']);
  });

  it('names an attraction by the name the build read, until its frame says its own', () => {
    const { names } = openPanel({ attractions: [square('ferris-wheel', 'ferris-wheel')] });
    expect(names('.hud-attractions')).toEqual(['Ferris Wheel']);
  });

  it('highlights only the picked square, not its twin of the other kind', () => {
    const { hud, entry } = openPanel(twins());
    hud.showSelected({ kind: 'booth', id: 'bob' });
    expect(entry('.hud-all', 'bob').classList.contains('selected')).toBe(true);
    expect(entry('.hud-attractions', 'bob').classList.contains('selected')).toBe(false);
    expect(entry('.hud-attractions', 'bob').getAttribute('aria-pressed')).toBe('false');
  });

  it('jumps to a square picked while its twin is the one picked', () => {
    const { map, entry } = openPanel(twins(), { selected: { kind: 'booth', id: 'bob' } });
    entry('.hud-attractions', 'bob').click();
    expect(map.jumpTo).toHaveBeenCalledWith('attraction', 'bob');
    expect(map.clearSelection).not.toHaveBeenCalled();
    entry('.hud-all', 'ana').click();
    expect(map.jumpTo).toHaveBeenLastCalledWith('booth', 'ana');
  });

  it('walks there with the map focused, without scrolling the page', () => {
    const { canvas, map, entry } = openPanel();
    const focus = vi.spyOn(canvas, 'focus');
    entry('.hud-all', 'bob').dispatchEvent(new MouseEvent('click', { shiftKey: true }));
    expect(map.walkTo).toHaveBeenCalledWith('booth', 'bob');
    expect(focus).toHaveBeenCalledWith({ preventScroll: true });
  });
});

describe("a square's own name in the panel", () => {
  it("renames only that square's entries, cut to 80 characters, and only when it changes", () => {
    const { attractions, booths } = twins();
    const bakery = booths[1] ?? square('bob');
    const { named, entry, names } = openPanel({ attractions, booths });
    const heard: string[] = [];
    entry('.hud-attractions', 'bob').addEventListener('named', () => heard.push('attraction'));
    entry('.hud-all', 'bob').addEventListener('named', () => heard.push('booth'));
    const show = named.get('bob');
    bakery.name = 'B'.repeat(100);
    // The registry keeps the last square shown for an id: here the booth's.
    show?.();
    expect(names('.hud-all')).toContain('B'.repeat(80));
    expect(heard).toEqual(['booth']);
    bakery.name = `${'B'.repeat(80)}more`;
    show?.();
    expect(heard).toEqual(['booth']);
  });

  it('copes with a new name while nothing in the panel has the focus', () => {
    const ana = square('ana', 'Cocoa');
    const { named, names } = openPanel({ booths: [ana] });
    document.body.focus();
    ana.name = 'Aardvark';
    expect(() => named.get('ana')?.()).not.toThrow();
    expect(names('.hud-all')).toEqual(['Aardvark']);
  });
});
