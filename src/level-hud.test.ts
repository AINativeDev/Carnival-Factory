import { describe, expect, it } from 'vitest';
import { labelLevel } from './level-hud';

/** A HUD with the three lines a level shows, and the map's label. */
function hud(selectors = ['.level-name', '.level-owner', '.level-description']) {
  const lines = new Map<string, { textContent: string | null }>(
    selectors.map((selector) => [selector, { textContent: '' }]),
  );
  const label = new Map<string, string>();
  return {
    root: { querySelector: (selector: string) => lines.get(selector) ?? null },
    map: { setAttribute: (name: string, value: string) => label.set(name, value) },
    text: (selector: string) => lines.get(selector)?.textContent,
    label: () => label.get('aria-label'),
  };
}

const level = { name: 'The Factory', description: 'How a booth gets built.' };

describe('labelLevel', () => {
  it('credits the North Pole for its own level, on the HUD and the map', () => {
    const view = hud();
    labelLevel(view.root, view.map, level, 'the North Pole');
    expect(view.text('.level-name')).toBe('The Factory');
    expect(view.text('.level-owner')).toBe('A level by the North Pole');
    expect(view.text('.level-description')).toBe('How a booth gets built.');
    expect(view.label()).toMatch(/^The Factory, a level by the North Pole\. Walk with WASD/);
  });

  it("credits a participant's level to their login", () => {
    const view = hud();
    labelLevel(view.root, view.map, level, '@jedi4ever');
    expect(view.text('.level-owner')).toBe('A level by @jedi4ever');
    expect(view.label()).toContain('a level by @jedi4ever.');
  });

  it('labels the map even when a HUD line is missing', () => {
    const view = hud(['.level-name']);
    labelLevel(view.root, view.map, level, '@jedi4ever');
    expect(view.text('.level-name')).toBe('The Factory');
    expect(view.label()).toContain('a level by @jedi4ever.');
  });
});
