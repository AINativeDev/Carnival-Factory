// @vitest-environment happy-dom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { stopPanels, openPanel } from './test-support/booths-panel';

beforeEach(() => {
  localStorage.clear();
});
afterEach(() => {
  stopPanels();
  vi.restoreAllMocks();
});

const press = (target: EventTarget, key: string, init: KeyboardEventInit = {}) => {
  const event = new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true, ...init });
  target.dispatchEvent(event);
  return event;
};

/** Opens the panel and types `query` into its search box. */
function searching(query: string) {
  const opened = openPanel();
  const input = opened.panel.querySelector<HTMLInputElement>('.hud-search-input');
  if (!input) throw new Error('No search box');
  input.value = query;
  input.dispatchEvent(new Event('input'));
  return { ...opened, input };
}

describe("the Booths panel's search", () => {
  it('shows its results instead of the sections while it has text', () => {
    const { panel, input, names } = searching('@bo');
    expect(names('.hud-found')).toEqual(['Bakery']);
    expect(panel.querySelector('.hud-results-title')?.textContent).toMatch(/^Results/);
    expect(panel.querySelector<HTMLElement>('.hud-sections')?.hidden).toBe(true);
    input.value = '  ';
    input.dispatchEvent(new Event('input'));
    expect(panel.querySelector<HTMLElement>('.hud-results')?.hidden).toBe(true);
    expect(panel.querySelector<HTMLElement>('.hud-sections')?.hidden).toBe(false);
  });

  it('jumps to the first result on Enter, and to nothing when there is none', () => {
    const { input, map } = searching('bakery');
    expect(press(input, 'Enter').defaultPrevented).toBe(true);
    expect(map.jumpTo).toHaveBeenCalledWith('booth', 'bob');
    input.value = 'nothing like it';
    input.dispatchEvent(new Event('input'));
    press(input, 'Enter');
    expect(map.jumpTo).toHaveBeenCalledTimes(1);
  });

  it('moves through the entries with the arrow keys, from the search box or an entry, and wraps', () => {
    const { input, entry } = searching('a');
    expect(press(input, 'ArrowDown').defaultPrevented).toBe(true);
    const first = document.activeElement;
    expect(first?.classList.contains('hud-go')).toBe(true);
    press(first ?? input, 'ArrowUp');
    expect(document.activeElement).not.toBe(first);
    expect(document.activeElement?.classList.contains('hud-go')).toBe(true);
    // Anywhere else in the panel, the arrow keys are the player's.
    expect(
      press(entry('.hud-all', 'ana').nextElementSibling ?? input, 'ArrowDown').defaultPrevented,
    ).toBe(false);
  });

  it('clears the search on Esc, then lets go of the picked square', () => {
    const { input, map, entry } = searching('ana');
    press(input, 'Escape');
    expect(input.value).toBe('');
    expect(document.activeElement).toBe(input);
    expect(map.clearSelection).not.toHaveBeenCalled();
    press(entry('.hud-all', 'ana'), 'Escape');
    expect(map.clearSelection).toHaveBeenCalled();
    press(entry('.hud-all', 'ana').nextElementSibling ?? input, 'Escape');
    expect(map.clearSelection).toHaveBeenCalledTimes(1);
    press(input, 'x');
    expect(input.value).toBe('');
  });
});

describe("the Booths panel's / key", () => {
  it('opens the panel and focuses the search, but not in a text field, with a modifier or inside a square', () => {
    const { panel, map, hud } = openPanel();
    const input = panel.querySelector('.hud-search-input');
    panel.open = false;
    expect(press(document.body, '/').defaultPrevented).toBe(true);
    expect([panel.open, document.activeElement]).toEqual([true, input]);

    document.body.focus();
    for (const init of [{ ctrlKey: true }, { metaKey: true }, { altKey: true }])
      expect(press(document.body, '/', init).defaultPrevented).toBe(false);
    expect(press(input ?? document.body, '/').defaultPrevented).toBe(false);
    const editable = document.createElement('div');
    // happy-dom doesn't work out isContentEditable from the attribute, as a browser does.
    Object.defineProperty(editable, 'isContentEditable', { value: true });
    document.body.append(editable);
    expect(press(editable, '/').defaultPrevented).toBe(false);
    expect(press(window, '/').defaultPrevented).toBe(true);
    map.visiting = { kind: 'booth', id: 'ana' };
    expect(press(document.body, '/').defaultPrevented).toBe(false);

    map.visiting = undefined;
    hud.stop();
    expect(press(document.body, '/').defaultPrevented).toBe(false);
  });
});

describe("the Booths panel's keys and the map's", () => {
  it('keeps the arrow keys and Esc it uses from the map, and passes the rest on', () => {
    const { input, entry } = searching('a');
    const heard: string[] = [];
    const listen = (event: KeyboardEvent) => heard.push(event.key);
    window.addEventListener('keydown', listen);
    try {
      press(input, 'ArrowDown');
      press(document.activeElement ?? input, 'ArrowUp');
      press(input, 'Escape');
      press(entry('.hud-all', 'ana'), 'Escape');
      press(input, 'q');
      press(entry('.hud-all', 'ana').nextElementSibling ?? input, 'Escape');
    } finally {
      window.removeEventListener('keydown', listen);
    }
    expect(heard).toEqual(['q', 'Escape']);
  });

  it('leaves / to a text area or a list being typed in', () => {
    openPanel();
    for (const tag of ['textarea', 'select', 'input']) {
      const field = document.createElement(tag);
      document.body.append(field);
      expect(press(field, '/').defaultPrevented, tag).toBe(false);
    }
    const label = document.createElement('label');
    document.body.append(label);
    expect(press(label, '/').defaultPrevented).toBe(true);
  });
});
