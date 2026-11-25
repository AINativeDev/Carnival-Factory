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
    expect(linksOf('the-academy')).toEqual(['https://tessl.io/academy']);
  });

  it("links out of a North Pole level's stalls", () => {
    expect(linksOf('video-set', 'the-studio')).toEqual([
      'https://tessl.io/podcast/',
      'https://www.youtube.com/@tessl-ai',
    ]);
  });

  it("never links out of an ordinary attraction or a participant's level", () => {
    expect(linksOf('ferris-wheel')).toEqual([]);
    expect(linksOf('hut', 'bo')).toEqual([]);
  });
});
