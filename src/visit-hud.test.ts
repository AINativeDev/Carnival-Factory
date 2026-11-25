// @vitest-environment happy-dom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
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

// A test never reaches the network: by default there is no history file beside the page.
beforeEach(() => {
  vi.stubGlobal('fetch', () => Promise.resolve({ ok: false } as Response));
});
afterEach(() => {
  vi.unstubAllGlobals();
});

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

  it('leads with how it was built, a timeline that credits its maker even without history', () => {
    const { card } = open({ kind: 'booth', square: square('ana', "Ana's booth") });
    const sections = [...card.children].map((child) => child.className.split(' ')[0]);
    expect(sections.indexOf('visit-story')).toBeLessThan(sections.indexOf('visit-actions'));
    const steps = [...card.querySelectorAll<HTMLElement>('.story-step')];
    expect(steps.map((step) => step.dataset.kind)).toEqual(['made', 'live']);
    expect(steps[0]?.textContent).toBe('Made by @ana');
    expect(card.querySelector('.history-empty')?.getAttribute('hidden')).not.toBeNull();
  });

  it("says when there's no story to tell, for an attraction without history", () => {
    const { card } = open({
      kind: 'attraction',
      square: square('made-up-attraction', 'Made-up attraction'),
    });
    expect(card.querySelectorAll('.story-step')).toHaveLength(0);
    expect(card.querySelector<HTMLElement>('.history-empty')?.hidden).toBe(false);
  });

  it('keeps one quiet row of actions, with the map link and the message under More', () => {
    const { card } = open({ kind: 'booth', square: square('ana', "Ana's booth") });
    const actions = the(card, '.visit-actions');
    expect([...actions.querySelectorAll('button')].map((b) => b.textContent)).toEqual(['Share']);
    const options = the(card, '.visit-more');
    expect(options.querySelector('summary')?.textContent).toBe('More');
    expect(options.querySelector<HTMLAnchorElement>('.visit-map')?.getAttribute('href')).toBe(
      '#/?booth=ana',
    );
    expect(the(card, '.visit-share-text').textContent).toBe('');
    expect((the(card, '.visit-share-text') as HTMLTextAreaElement).value).toContain("Ana's booth");
  });

  it("lets a booth's owner share it as theirs, opening the message to edit", () => {
    let mine = false;
    const { card } = open({
      kind: 'booth',
      square: square('ana', "Ana's booth"),
      onMine: () => (mine = true),
    });
    the(card, '.visit-mine').click();
    expect(mine).toBe(true);
    expect((the(card, '.visit-more') as HTMLDetailsElement).open).toBe(true);
  });

  it('asks one thing: a booth of your own, or the plot next door after a shared link', () => {
    const visitor = open({ kind: 'booth', square: square('ana', "Ana's booth") }).card;
    expect(visitor.querySelector('.visit-want')?.textContent).toContain('Want one of your own?');
    expect(the(visitor, '.visit-build').hidden).toBe(false);
    expect(the(visitor, '.visit-claim').hidden).toBe(true);
    let claimed = false;
    const invited = open({
      kind: 'booth',
      square: square('ana', "Ana's booth"),
      invite: true,
      onClaim: () => (claimed = true),
    }).card;
    expect(the(invited, '.visit-build').hidden).toBe(true);
    the(invited, '.visit-claim').click();
    expect(claimed).toBe(true);
  });

  it('folds everything else under More', () => {
    const { card } = open({ kind: 'booth', square: square('ana', "Ana's booth") });
    const more = the(card, '.visit-more') as HTMLDetailsElement;
    expect(more.open).toBe(false);
    expect(more.querySelector('.visit-help')?.textContent).toContain('Is this yours?');
    expect(more.textContent).toContain("See the factory's numbers");
  });

  it("tells a preview's story from the history file beside it", async () => {
    const history = {
      squares: {
        'booth/ana': [
          {
            issue: 7,
            title: 'My booth',
            url: 'https://github.com/o/r/issues/7',
            author: 'ana',
            openedAt: '2026-11-24T10:00:00Z',
            decision: 'accepted',
            pulls: [],
          },
        ],
      },
      credits: {},
    };
    vi.stubGlobal('fetch', () =>
      Promise.resolve({ ok: true, json: () => Promise.resolve(history) } as Response),
    );
    const { card } = open({ kind: 'booth', square: square('ana', "Ana's booth") });
    await vi.waitFor(() => {
      expect(card.querySelector('.story-step')?.textContent).toContain('Asked for by @ana in #7');
    });
  });

  it('fills in the name and description again once a sandboxed square says it is ready', () => {
    let ready: (() => void) | undefined;
    const late = {
      ...square('ana', 'Opening…'),
      onReady: (listener: () => void) => {
        ready = listener;
      },
    };
    const { hud, card } = open({ kind: 'booth', square: late });
    late.name = "Ana's booth";
    ready?.();
    expect(card.querySelector('.visit-title')?.textContent).toBe("Ana's booth");
    hud.close();
    late.name = 'Changed after closing';
    ready?.();
    expect(card.querySelector('.visit-title')?.textContent).toBe("Ana's booth");
  });

  it('closes, taking the panel away', () => {
    const { hud, card } = open({ kind: 'booth', square: square('ana', "Ana's booth") });
    hud.close();
    expect(card.isConnected).toBe(false);
  });
});
