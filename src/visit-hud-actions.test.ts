// @vitest-environment happy-dom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { LEVEL_REQUEST_URL } from './northpole/links';
import { openVisitHud, type VisitHudOptions } from './visit-hud';
import { switchFlags } from './test-support/feature-flags';

// Ana holds the Elf Engineer badge and her booth is on the People's Choice ballot; nobody else is.
vi.mock('./northpole/badges', async (original) => ({
  ...(await original<typeof import('./northpole/badges')>()),
  badgeFor: (login: string) =>
    login === 'ana' ? { login: 'ana', repo: 'ana/elf factory', tier: 'gold' } : undefined,
}));
vi.mock('./northpole/peoples-choice', async (original) => ({
  ...(await original<typeof import('./northpole/peoples-choice')>()),
  voteUrl: (login: string) =>
    login === 'ana' ? 'https://github.com/north/pole/issues/9#issuecomment-1' : undefined,
}));

/** Opens a booth's panel in a fresh page, the way the map does. */
function open(id: string, options: Partial<VisitHudOptions> = {}) {
  document.body.innerHTML = '<div class="map-frame"></div>';
  const frame = document.querySelector<HTMLElement>('.map-frame');
  if (!frame) throw new Error('The test page has no map frame');
  const onClose = vi.fn();
  const onClaim = vi.fn();
  const panel = openVisitHud(frame, {
    kind: 'booth',
    square: { id, name: 'Cocoa', description: 'Warm cups at dusk.' },
    invite: false,
    onClose,
    onClaim,
    ...options,
  });
  return { card: panel.card, onClose, onClaim };
}

const part = (card: HTMLElement, selector: string) => {
  const found = card.querySelector<HTMLElement>(selector);
  if (!found) throw new Error(`The panel has no ${selector}`);
  return found;
};

beforeEach(() => {
  vi.stubGlobal('fetch', () => Promise.resolve({ ok: false } as Response));
});
afterEach(() => {
  vi.unstubAllGlobals();
  document.body.innerHTML = '';
});

describe("a booth's panel, for an Elf Engineer on the People's Choice ballot", () => {
  switchFlags({ elfEngineer: true });
  it("links to the owner's own factory and to the booth's place on the ballot", () => {
    const { card } = open('ana');
    expect(part(card, '.visit-factory').hidden).toBe(false);
    const factory = part(card, '.visit-factory a') as HTMLAnchorElement;
    expect(factory.href).toBe('https://github.com/ana/elf%20factory');
    expect(factory.textContent).toBe("See @ana's own factory");
    const vote = part(card, '.visit-vote') as HTMLAnchorElement;
    expect(vote.hidden).toBe(false);
    expect(vote.href).toBe('https://github.com/north/pole/issues/9#issuecomment-1');
  });

  it("keeps both links hidden for anyone else's booth", () => {
    const { card } = open('bob');
    expect(part(card, '.visit-factory').hidden).toBe(true);
    expect(part(card, '.visit-vote').hidden).toBe(true);
  });
});

describe("the feature flags in a booth's panel", () => {
  it("hides the Elf Engineer's factory link and Remix this booth while their flags are off", () => {
    const { card } = open('ana');
    expect(part(card, '.visit-factory').hidden).toBe(true);
    expect(part(card, '.visit-remix-link').hidden).toBe(true);
  });

  describe('with remixing switched on', () => {
    switchFlags({ remix: true });
    it("offers to remix a booth, but never a level's square", () => {
      const { card } = open('ana');
      const remix = part(card, '.visit-remix-link') as HTMLAnchorElement;
      expect(remix.hidden).toBe(false);
      expect(remix.href).toContain('template=');
      expect(part(open('ana', { level: 'bo' }).card, '.visit-remix-link').hidden).toBe(true);
    });
  });
});

describe("a booth's panel's own buttons", () => {
  it("keeps Get a booth for a booth's owner while the levels flag is off", () => {
    const owner = open('ana', { mine: true }).card;
    expect(part(owner, '.visit-want').hidden).toBe(false);
    expect(part(owner, '.visit-next').hidden).toBe(true);
  });

  it('claims the spot next door for someone who came by a shared link', () => {
    const { card, onClaim } = open('bob', { invite: true });
    expect(part(card, '.visit-build').hidden).toBe(true);
    part(card, '.visit-claim').click();
    expect(onClaim).toHaveBeenCalledOnce();
  });

  it('leaves with the Leave button, or with Esc and no other key', () => {
    const { card, onClose } = open('bob');
    part(card, '.visit-close').click();
    expect(onClose).toHaveBeenCalledOnce();

    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowUp' }));
    expect(onClose).toHaveBeenCalledOnce();
    const escape = new KeyboardEvent('keydown', { key: 'Escape', cancelable: true });
    document.dispatchEvent(escape);
    expect(escape.defaultPrevented).toBe(true);
    expect(onClose).toHaveBeenCalledTimes(2);
  });
});

describe("a booth's panel, with participants' levels switched on", () => {
  switchFlags({ levels: true });
  it("offers a booth's owner a level of their own next, instead of a booth", () => {
    const owner = open('ana', { mine: true }).card;
    expect(part(owner, '.visit-want').hidden).toBe(true);
    expect(part(owner, '.visit-next').hidden).toBe(false);
    expect(part(owner, '.visit-next').textContent).toBe('Next: get a level of your own');
    expect(part(owner, '.visit-next a').getAttribute('href')).toBe(LEVEL_REQUEST_URL);
    // Saying it's theirs from the panel itself offers the level too.
    const visitor = open('bob').card;
    expect(part(visitor, '.visit-next').hidden).toBe(true);
    part(visitor, '.visit-mine').click();
    expect(part(visitor, '.visit-want').hidden).toBe(true);
    expect(part(visitor, '.visit-next').hidden).toBe(false);
  });
});
