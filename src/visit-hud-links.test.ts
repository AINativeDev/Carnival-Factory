// @vitest-environment happy-dom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { openVisitHud } from './visit-hud';

/** The links out a square's panel shows, opened in a fresh page the way the map does. */
function linksOf(id: string, level?: string) {
  document.body.innerHTML = '<div class="map-frame"></div>';
  const frame = document.querySelector<HTMLElement>('.map-frame');
  if (!frame) throw new Error('no frame');
  openVisitHud(frame, {
    kind: 'attraction',
    square: { id, name: id, description: 'At dusk.' },
    invite: false,
    onClose: () => undefined,
    onClaim: () => undefined,
    ...(level ? { level } : {}),
  });
  return [...frame.querySelectorAll<HTMLAnchorElement>('.level-link')].map((link) => link.href);
}

// A test never reaches the network: by default there is no history file beside the page.
beforeEach(() => {
  vi.stubGlobal('fetch', () => Promise.resolve({ ok: false } as Response));
});
afterEach(() => {
  vi.unstubAllGlobals();
});

describe("a square's panel, for the North Pole's own levels (ADR 0038)", () => {
  it("links out of a landmark's room", () => {
    const academy = linksOf('the-academy');
    expect(academy[0]).toBe(
      'https://tessl.io/academy?utm_source=carnival-factory&utm_medium=the-academy&utm_campaign=christmas-edition',
    );
    // Then the ways on: a booth of your own, AI DevCon, the blog and the podcast (ADR 0063).
    expect(academy).toHaveLength(5);
    expect(academy[1]).toMatch(/\/issues\/new\?template=01-your-booth\.yml$/);
  });

  it("links out of a North Pole level's stalls", () => {
    expect(linksOf('camera', 'the-studio')).toEqual([
      'https://tessl.io/podcast/?utm_source=carnival-factory&utm_medium=the-studio&utm_campaign=christmas-edition',
      'https://www.youtube.com/@tessl-ai?utm_source=carnival-factory&utm_medium=the-studio&utm_campaign=christmas-edition',
    ]);
  });

  it("shows a Year in Review item's answers after its link to add yours", () => {
    expect(linksOf('hot-take', 'the-year-in-review')).toHaveLength(1);
    const after = document.querySelector('.visit .level-links')?.nextElementSibling;
    expect(after?.className).toBe('year-answers');
  });

  it("never links out of an ordinary attraction or a participant's level", () => {
    expect(linksOf('ferris-wheel')).toEqual([]);
    expect(linksOf('hut', 'bo')).toEqual([]);
  });
});
