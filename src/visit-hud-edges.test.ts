// @vitest-environment happy-dom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { NorthPoleSquare } from './northpole/square';
import { shareLink } from './northpole/visit';
import { openVisitHud, type VisitHudOptions } from './visit-hud';

const square = (id: string, name: string): NorthPoleSquare => ({
  id,
  name,
  description: `${name}, at dusk.`,
  draw: () => undefined,
});

function the(root: ParentNode, selector: string): HTMLElement {
  const found = root.querySelector<HTMLElement>(selector);
  if (!found) throw new Error(`Nothing matches ${selector}`);
  return found;
}

/** Every panel a test opened, closed after it so none still hears Esc. */
const opened: { close(): void }[] = [];

/** Opens a panel in a fresh page beside a button outside it, which had the focus first. */
function open(options: Partial<VisitHudOptions> & Pick<VisitHudOptions, 'kind' | 'square'>) {
  document.body.innerHTML = '<button id="outside">Outside</button><div class="map-frame"></div>';
  the(document, '#outside').focus();
  const frame = the(document, '.map-frame');
  const onClose = vi.fn();
  const hud = openVisitHud(frame, {
    invite: false,
    onClose,
    onClaim: () => undefined,
    ...options,
  });
  opened.push(hud);
  return { hud, card: the(frame, '.visit'), onClose, frame };
}

const esc = () => {
  const event = new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true });
  document.dispatchEvent(event);
  return event;
};

let fetched: string[] = [];
beforeEach(() => {
  fetched = [];
  vi.stubGlobal('fetch', (url: string) => {
    fetched.push(url);
    return Promise.resolve({ ok: false } as Response);
  });
});
afterEach(() => {
  for (const hud of opened.splice(0)) hud.close();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("a square's panel, by whose it is", () => {
  it('is described by its description, and names no maker for an attraction', () => {
    const { card } = open({ kind: 'attraction', square: square('made-up', 'Made up') });
    expect(card.getAttribute('aria-describedby')).toBe('visit-description');
    expect(the(card, '.visit-by').textContent).toBe('');
    expect(the(card, '.visit-map').textContent).toBe('See it on the map');
  });

  it("credits a level's square to the level's owner, and finds it in the level", () => {
    const { card } = open({ kind: 'attraction', square: square('hut', 'Hut'), level: 'bo' });
    expect([...card.querySelectorAll('.story-step')].map((step) => step.textContent)).toEqual([
      'Made by @bo',
      'On the map',
    ]);
    expect(the(card, '.visit-map').textContent).toBe('See it in the level');
    expect(fetched).toEqual([]);
  });

  it('shares a booth by its own share page', () => {
    const { card } = open({ kind: 'booth', square: square('ana', "Ana's booth") });
    const text = (the(card, '.visit-share-text') as HTMLTextAreaElement).value;
    expect(text).toContain(shareLink('booth', 'ana', document.baseURI));
  });

  it('offers the spot next door only beside a booth', () => {
    const { card } = open({
      kind: 'attraction',
      square: square('made-up', 'Made up'),
      invite: true,
    });
    expect([the(card, '.visit-claim').hidden, the(card, '.visit-build').hidden]).toEqual([
      true,
      false,
    ]);
  });
});

describe("a level's own panel beside its map", () => {
  it('leaves the keys and the focus to the map', () => {
    const { onClose } = open({ kind: 'level', square: square('bo', 'Bo’s level') });
    expect(document.activeElement?.id).toBe('outside');
    expect(esc().defaultPrevented).toBe(false);
    expect(onClose).not.toHaveBeenCalled();
  });
});

describe("a square's panel, opening and closing", () => {
  it('takes the focus without scrolling the page', () => {
    const focus = vi.spyOn(HTMLElement.prototype, 'focus');
    open({ kind: 'booth', square: square('ana', "Ana's booth") });
    expect(focus.mock.calls.at(-1)).toEqual([{ preventScroll: true }]);
  });

  it('leaves the focus where the visitor put it, outside the panel, and stops hearing Esc', () => {
    const { hud, onClose } = open({ kind: 'booth', square: square('ana', "Ana's booth") });
    const elsewhere = document.createElement('button');
    document.body.append(elsewhere);
    elsewhere.focus();
    hud.close();
    expect(document.activeElement).toBe(elsewhere);
    esc();
    expect(onClose).not.toHaveBeenCalled();
  });
});
