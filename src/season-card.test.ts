// @vitest-environment happy-dom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { NorthPoleSquare } from './northpole/square';
import { renderSeason } from './season-card';

/** What the mocked modules give: the booths there are, the links set, and the season's numbers. */
const given = vi.hoisted(() => ({
  booths: new Map<string, NorthPoleSquare>(),
  keepPosted: '',
  offer: undefined as { url: string; text: string } | undefined,
  stats: undefined as { requests: number; shipped: number } | undefined,
}));

vi.mock('./northpole/booths', () => ({
  boothRegistry: { get: (id: string) => given.booths.get(id) },
}));
vi.mock('./northpole/links', async (original) => ({
  ...(await original<typeof import('./northpole/links')>()),
  get KEEP_POSTED_URL() {
    return given.keepPosted;
  },
  signupOffer: () => given.offer,
}));
// What the card draws is pinned in src/season-card-drawing.test.ts: here, only its booth.
vi.mock('./season-card-drawing', async (original) => ({
  ...(await original<typeof import('./season-card-drawing')>()),
  drawCard: (
    ctx: CanvasRenderingContext2D,
    _login: string,
    _name: string,
    booth: (ctx: CanvasRenderingContext2D, size: number) => void,
  ) => {
    booth(ctx, 259);
  },
}));
vi.mock('../scripts/season', async (original) => ({
  ...(await original<typeof import('../scripts/season')>()),
  seasonStats: () => given.stats,
}));

/** A booth as its sandbox gives it: named once its frame is ready. */
function sandboxed(id: string) {
  let ready = () => {
    // Nothing until the square's frame is ready.
  };
  const square = {
    id,
    name: id,
    description: '',
    draw: vi.fn(),
    onReady: (then: () => void) => {
      ready = then;
    },
  };
  return {
    square,
    ready: () => {
      ready();
    },
  };
}

let frames: FrameRequestCallback[];
beforeEach(() => {
  frames = [];
  given.booths.clear();
  given.keepPosted = '';
  given.offer = undefined;
  given.stats = undefined;
  vi.stubGlobal('requestAnimationFrame', (paint: FrameRequestCallback) => {
    frames.push(paint);
    return frames.length;
  });
  vi.stubGlobal('cancelAnimationFrame', vi.fn());
});
afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

const app = () => document.createElement('main');
const text = (root: HTMLElement, selector: string) => root.querySelector(selector)?.textContent;

describe('renderSeason', () => {
  it('says there is no season yet for a login without a booth', () => {
    const page = app();
    const stop = renderSeason(page, 'nobody');
    expect(document.body.dataset.view).toBe('booth');
    expect(text(page, 'h1')).toBe('No season yet');
    expect(text(page, '.description')).toBe("@nobody doesn't have a booth yet.");
    expect(stop).not.toThrow();
  });

  it("shows the card, the way back and a share text, and names the booth once it's ready", () => {
    const { square, ready } = sandboxed('ana');
    given.booths.set('ana', square);
    given.stats = { requests: 2, shipped: 0 };
    const page = app();
    document.body.append(page);
    const ctx = { setTransform: vi.fn() } as unknown as CanvasRenderingContext2D;
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(ctx);
    const stop = renderSeason(page, 'ana');

    const back = page.querySelector<HTMLAnchorElement>('.season-back');
    expect(back?.getAttribute('href')).toBe('#/booth/ana');
    expect(back?.textContent).toBe("← Back to @ana's booth");
    expect(page.querySelector('.season-keep-posted')?.getAttribute('target')).toBeNull();
    expect(page.querySelector<HTMLElement>('.season-offer')?.hidden).toBe(true);
    const share = page.querySelector<HTMLTextAreaElement>('.season-share-text');
    expect(share?.value).toMatch(/^My season at Carnival Factory as @ana: I built ana\./);
    const canvas = page.querySelector('canvas');
    expect(canvas?.getAttribute('aria-label')).toBe("@ana's season card: ana, 2 requests made.");
    expect([canvas?.width, canvas?.height]).toEqual([1200, 630]);

    square.name = "Ana's cocoa";
    ready();
    expect(share?.value).toContain("I built Ana's cocoa.");
    share?.dispatchEvent(new Event('input'));
    square.name = 'Renamed';
    ready();
    expect(share?.value).toContain("I built Ana's cocoa.");
    expect(canvas?.getAttribute('aria-label')).toContain('Renamed');

    // Each frame draws the booth as it is now, and asks for the next.
    frames.shift()?.(500);
    expect(square.draw).toHaveBeenCalledWith(expect.anything(), 259, 0.5);
    expect(frames).toHaveLength(1);
    stop();
    expect(cancelAnimationFrame).toHaveBeenCalled();

    // A card no longer on the page isn't touched once its booth is ready.
    page.remove();
    square.name = 'Gone';
    ready();
    expect(canvas?.getAttribute('aria-label')).not.toContain('Gone');
  });

  it('opens Keep me posted in a new tab when it leaves the site, and shows an offer when there is one', () => {
    given.booths.set('ana', { id: 'ana', name: 'Ana', description: '', draw: vi.fn() });
    given.keepPosted = 'https://example.test/list';
    given.offer = { url: 'https://example.test/signup', text: 'Free credits' };
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(null);
    const page = app();
    const stop = renderSeason(page, 'ana');
    expect(page.querySelector('.season-keep-posted')?.getAttribute('target')).toBe('_blank');
    expect(page.querySelector('.season-keep-posted')?.getAttribute('rel')).toBe('noopener');
    const offer = page.querySelector<HTMLAnchorElement>('.season-offer-link');
    expect([offer?.href, offer?.textContent]).toEqual([
      'https://example.test/signup',
      'Free credits',
    ]);
    expect(page.querySelector<HTMLElement>('.season-offer')?.hidden).toBe(false);
    expect(page.querySelector('canvas')?.getAttribute('aria-label')).toBe(
      "@ana's season card: Ana.",
    );
    // Without a canvas to draw on, nothing is painted.
    expect(frames).toHaveLength(0);
    stop();
  });
});
