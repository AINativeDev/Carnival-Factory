// @vitest-environment happy-dom
import { describe, expect, it } from 'vitest';
import type { NorthPoleSquare } from './northpole/square';
import { openVisitHud, type VisitHudOptions } from './visit-hud';

const square = (id: string, name: string): NorthPoleSquare => ({
  id,
  name,
  description: `${name}, at dusk.`,
  draw: () => undefined,
});

/** The one element a selector must find, or a failed test saying which. */
function the(root: ParentNode, selector: string): HTMLElement {
  const found = root.querySelector<HTMLElement>(selector);
  if (!found) throw new Error(`Nothing matches ${selector}`);
  return found;
}

/** Opens a square's panel in a fresh page, the way the map does. */
function open(options: Partial<VisitHudOptions> & Pick<VisitHudOptions, 'kind' | 'square'>) {
  document.body.innerHTML = '<div class="map-frame"></div>';
  const frame = the(document, '.map-frame');
  const hud = openVisitHud(frame, {
    invite: false,
    onClose: () => undefined,
    onClaim: () => undefined,
    ...options,
  });
  return { hud, card: the(frame, '.visit') };
}

describe("a square's panel", () => {
  it('shows its name and description as text, and its craft badges under them', () => {
    const { card } = open({
      kind: 'attraction',
      square: square('ferris-wheel', 'Ferris <b>Wheel</b>'),
    });
    expect(card.querySelector('.visit-title')?.textContent).toBe('Ferris <b>Wheel</b>');
    const craft = the(card, '.visit-craft');
    expect(craft.hidden).toBe(false);
    expect(
      [...craft.querySelectorAll('.visit-craft-badge')].map((badge) => badge.textContent),
    ).toEqual(['Small files', 'Tested', 'Documented', 'Clear names']);
  });

  it("hides the badges' line for a square the build knows nothing about", () => {
    const { card } = open({ kind: 'booth', square: square('nobody-here', 'Empty plot') });
    expect(card.querySelector<HTMLElement>('.visit-craft')?.hidden).toBe(true);
  });

  it("offers a booth's owner their next steps, and a level's square the way to a booth", () => {
    const booth = open({ kind: 'booth', square: square('ana', "Ana's booth") }).card;
    expect(booth.querySelector('.visit-help')?.textContent).toContain('Is this yours?');
    const levelSquare = open({
      kind: 'attraction',
      square: square('hut', 'Hut'),
      level: 'bo',
    }).card;
    expect(levelSquare.querySelector('.visit-help')?.textContent).toContain(
      "participant's own level",
    );
  });

  it('closes, taking the panel away', () => {
    const { hud, card } = open({ kind: 'booth', square: square('ana', "Ana's booth") });
    hud.close();
    expect(card.isConnected).toBe(false);
  });
});
