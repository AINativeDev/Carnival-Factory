// @vitest-environment happy-dom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { openVisitHud, type VisitHudOptions } from './visit-hud';

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

describe("a booth's panel's own buttons", () => {
  it('claims the plot next door for someone who came by a shared link', () => {
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
