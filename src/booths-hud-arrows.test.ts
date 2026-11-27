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

const press = (target: EventTarget, key: string) => {
  const event = new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true });
  target.dispatchEvent(event);
  return event;
};

/**
 * Searches the panel for `query`, with only the results showing: happy-dom
 * lays nothing out, so each entry says whether it shows, as a browser would.
 */
function searching(query: string) {
  const opened = openPanel({
    booths: [square('ana', 'Cocoa'), square('bob', 'Bakery'), square('cy', 'Cake')],
  });
  const input = opened.panel.querySelector<HTMLInputElement>('.hud-search-input');
  if (!input) throw new Error('No search box');
  input.value = query;
  input.dispatchEvent(new Event('input'));
  for (const button of opened.panel.querySelectorAll<HTMLElement>('.hud-go'))
    Object.defineProperty(button, 'offsetParent', {
      value: button.closest('.hud-found') ? opened.panel : null,
    });
  const found = [...opened.panel.querySelectorAll<HTMLElement>('.hud-found .hud-go')];
  return { ...opened, input, found };
}

describe('the arrow keys through the results', () => {
  it('go down and up one result at a time, wrapping, and skip what is hidden', () => {
    const { input, found } = searching('c');
    expect(found.map((button) => button.dataset.id)).toEqual(['cy', 'ana']);
    press(input, 'ArrowDown');
    expect(document.activeElement).toBe(found[0]);
    press(found[0] ?? input, 'ArrowDown');
    expect(document.activeElement).toBe(found[1]);
    press(found[1] ?? input, 'ArrowDown');
    expect(document.activeElement).toBe(found[0]);
    press(found[0] ?? input, 'ArrowUp');
    expect(document.activeElement).toBe(found[1]);
    press(input, 'ArrowUp');
    expect(document.activeElement).toBe(found[1]);
  });

  it('do nothing when nothing is found', () => {
    const { input } = searching('zzz');
    input.focus();
    expect(() => press(input, 'ArrowDown')).not.toThrow();
    expect(document.activeElement).toBe(input);
  });

  it('are let go when the panel stops', () => {
    const { input, hud } = searching('c');
    hud.stop();
    expect(press(input, 'ArrowDown').defaultPrevented).toBe(false);
  });
});

describe('the / key beside fields of its own', () => {
  it('is only held back by a real text field, not one merely named like one', () => {
    openPanel();
    for (const tag of ['x-input', 'input-x']) {
      const custom = document.createElement(tag);
      document.body.append(custom);
      expect(press(custom, '/').defaultPrevented, tag).toBe(true);
    }
  });
});
