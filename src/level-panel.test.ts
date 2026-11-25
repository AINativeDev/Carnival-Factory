// @vitest-environment happy-dom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { openLevelPanel } from './level-panel';
import { LEVEL_REQUEST_URL } from './northpole/links';

/** The one element a selector must find, or a failed test saying which. */
function the(root: ParentNode, selector: string): HTMLElement {
  const found = root.querySelector<HTMLElement>(selector);
  if (!found) throw new Error(`Nothing matches ${selector}`);
  return found;
}

const level = (id: string) => ({
  id,
  name: 'Ice <b>Maze</b>',
  description: 'A maze of ice, at dusk.',
});

/** Opens a level's panel in a fresh page, beside its map, the way renderLevel does. */
function open(id = 'bo') {
  document.body.innerHTML =
    '<section class="map"><div class="map-frame"><canvas tabindex="0"></canvas></div></section>';
  const frame = the(document, '.map-frame');
  the(frame, 'canvas').focus();
  const panel = openLevelPanel(frame, level(id));
  return { frame, panel, card: the(document, '.hud-level') };
}

// A test never reaches the network: by default there is no history file beside the page.
beforeEach(() => {
  vi.stubGlobal('fetch', () => Promise.resolve({ ok: false } as Response));
});
afterEach(() => {
  vi.unstubAllGlobals();
});

describe("a level's panel", () => {
  it("is a square's panel: its name shown as text, its owner, its description, then how it was built", () => {
    const { card } = open();
    expect(card.classList.contains('visit')).toBe(false);
    expect(card.dataset.kind).toBe('level');
    expect(the(card, '.visit-title').textContent).toBe('Ice <b>Maze</b>');
    expect(the(card, '.level-owner').textContent).toBe('A level by @bo');
    expect(the(card, '.visit-description').textContent).toBe('A maze of ice, at dusk.');
    const steps = [...card.querySelectorAll('.story-step')].map((step) => step.textContent);
    expect(steps).toEqual(['Made by @bo', 'On the map']);
    expect(card.getAttribute('aria-labelledby')).toBe('visit-title');
    expect(the(document, 'canvas').getAttribute('aria-label')).toMatch(
      /^Ice <b>Maze<\/b>, a level by @bo\./,
    );
  });

  it('shares the level, asks for a level of your own, and has no remix, vote, leaving or map link', () => {
    const { card } = open();
    const share = the(card, '.visit-share-text') as HTMLTextAreaElement;
    expect(share.value).toContain('@bo built Ice <b>Maze</b>, a level,');
    expect(share.value).toMatch(/#\/level\/bo$/);
    expect(the(card, '.visit-build').getAttribute('href')).toBe(LEVEL_REQUEST_URL);
    expect(the(card, '.visit-build').textContent).toBe('Get a level');
    for (const hidden of ['.visit-remix-link', '.visit-vote', '.visit-leave', '.visit-map'])
      expect(the(card, hidden).hidden).toBe(true);
    expect(the(card, '.visit-claim').hidden).toBe(true);
    expect(the(card, '.visit-help').textContent).toContain('Is this yours?');
  });

  it("credits the North Pole's own level to nobody", () => {
    const { card } = open('the-factory');
    expect(the(card, '.level-owner').textContent).toBe('A level by the North Pole');
    expect(card.querySelectorAll('.story-step')).toHaveLength(0);
    expect(the(card, '.history-empty').hidden).toBe(false);
  });

  it("shows a North Pole level's links out under its description, and none for a participant's", () => {
    const academy = open('the-academy').card;
    const start = the(academy, '.level-links a.level-link') as HTMLAnchorElement;
    expect(start.textContent).toBe('Start the Academy');
    expect(start.href).toBe('https://tessl.io/academy');
    expect(start.target).toBe('_blank');
    expect(start.rel).toBe('noopener');
    expect(the(academy, '.visit-description').nextElementSibling).toBe(start.parentElement);
    expect(open('bo').card.querySelectorAll('.level-link')).toHaveLength(0);
  });

  it('leaves the focus on the map, and Esc to the squares', () => {
    const { frame } = open();
    expect(document.activeElement).toBe(the(frame, 'canvas'));
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    expect(frame.nextElementSibling?.classList.contains('hud-level')).toBe(true);
  });

  it('stands beside the map, not over it', () => {
    const { frame, card } = open();
    expect(frame.nextElementSibling).toBe(card);
  });

  it("steps aside while the player is inside one of the level's squares, and comes back after", async () => {
    const { frame, card } = open();
    let resized = 0;
    window.addEventListener('resize', () => (resized += 1));
    frame.dataset.visiting = 'attraction:hut';
    await vi.waitFor(() => {
      expect(card.isConnected).toBe(false);
    });
    // From one square straight into another, it stays aside, and the map isn't resized again.
    frame.dataset.visiting = 'attraction:igloo';
    await Promise.resolve();
    expect(resized).toBe(1);
    delete frame.dataset.visiting;
    await vi.waitFor(() => {
      expect(frame.nextElementSibling).toBe(card);
    });
    expect(resized).toBe(2);
  });

  it('closes for good, even if the player goes in and out again', async () => {
    const { frame, panel, card } = open();
    panel.close();
    expect(card.isConnected).toBe(false);
    frame.dataset.visiting = 'attraction:hut';
    delete frame.dataset.visiting;
    await Promise.resolve();
    expect(card.isConnected).toBe(false);
  });
});
