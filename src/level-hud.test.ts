import { describe, expect, it } from 'vitest';
import { labelLevel } from './level-hud';

/** The map's canvas, keeping its label. */
function map() {
  const label = new Map<string, string>();
  return {
    map: { setAttribute: (name: string, value: string) => label.set(name, value) },
    label: () => label.get('aria-label'),
  };
}

const level = { name: 'The Factory' };

describe('labelLevel', () => {
  it('credits the North Pole for its own level on the map', () => {
    const view = map();
    labelLevel(view.map, level, 'the North Pole');
    expect(view.label()).toMatch(/^The Factory, a level by the North Pole\. Walk with WASD/);
  });

  it("credits a participant's level to their login", () => {
    const view = map();
    labelLevel(view.map, level, '@jedi4ever');
    expect(view.label()).toContain('a level by @jedi4ever.');
  });
});
