// @vitest-environment happy-dom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { keepUpToDate, QUIET_RELOAD_MS } from './updates';

/** What `version.json` answers: a build id, a failed response, or a network error. */
type Answer = { build?: unknown } | 'missing' | 'offline';

/** A fake `fetch` that answers every request for version.json with `answer`. */
function serveVersion(answer: Answer) {
  const fetch = vi.fn((url: URL, init: RequestInit) => {
    expect(url.pathname.endsWith('/version.json')).toBe(true);
    expect(url.searchParams.has('t')).toBe(true);
    expect(init.cache).toBe('no-store');
    if (answer === 'offline') return Promise.reject(new Error('offline'));
    if (answer === 'missing') return Promise.resolve({ ok: false } as Response);
    return Promise.resolve({ ok: true, json: () => Promise.resolve(answer) } as Response);
  });
  vi.stubGlobal('fetch', fetch);
  return fetch;
}

/** Lets the checks that are in flight finish. */
const settle = () => vi.advanceTimersByTimeAsync(0);

let replace: ReturnType<typeof vi.fn<(url: string | URL) => void>>;
beforeEach(() => {
  vi.useFakeTimers();
  history.replaceState(null, '', '/carnival/#/booth/ana');
  document.body.innerHTML = '';
  replace = vi.fn<(url: string | URL) => void>();
  vi.spyOn(location, 'replace').mockImplementation(replace);
});
afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('keeping the page on the latest build', () => {
  it('never checks while developing', async () => {
    const fetch = serveVersion({ build: 'new' });
    keepUpToDate();
    await settle();
    expect(fetch).not.toHaveBeenCalled();
  });

  it('moves a page that has only just opened to the new build, keeping its hash', async () => {
    serveVersion({ build: 'new' });
    keepUpToDate('old');
    await settle();
    expect(replace).toHaveBeenCalledWith(`${location.origin}/carnival/?v=new#/booth/ana`);
  });

  it('stays put on the published build, or when the build cannot be read', async () => {
    for (const answer of [{ build: 'old' }, { build: 42 }, 'missing', 'offline'] as Answer[]) {
      serveVersion(answer);
      keepUpToDate('old');
      await settle();
    }
    expect(replace).not.toHaveBeenCalled();
    expect(document.querySelector('.update-note')).toBeNull();
  });

  it('offers the new build once, instead of reloading again, to a page that already asked for it', async () => {
    history.replaceState(null, '', '/carnival/?v=new#/');
    const fetch = serveVersion({ build: 'new' });
    keepUpToDate('old');
    await settle();
    expect(replace).not.toHaveBeenCalled();
    await vi.advanceTimersByTimeAsync(5 * 60 * 1000);
    expect(fetch).toHaveBeenCalledTimes(2);
    expect(document.querySelectorAll('.update-note')).toHaveLength(1);
    expect(document.querySelector('.update-note')?.getAttribute('role')).toBe('status');
    document.querySelector<HTMLButtonElement>('.update-note button')?.click();
    expect(replace).toHaveBeenCalledWith(`${location.origin}/carnival/?v=new#/`);
  });

  it('offers the new build to someone already looking around, and checks again when the page comes back into view', async () => {
    const now = vi.spyOn(performance, 'now').mockReturnValue(0);
    serveVersion({ build: 'old' });
    keepUpToDate('old');
    await settle();

    now.mockReturnValue(QUIET_RELOAD_MS);
    const published = serveVersion({ build: 'new' });
    vi.spyOn(document, 'visibilityState', 'get').mockReturnValue('hidden');
    document.dispatchEvent(new Event('visibilitychange'));
    await settle();
    expect(published).not.toHaveBeenCalled();

    vi.spyOn(document, 'visibilityState', 'get').mockReturnValue('visible');
    document.dispatchEvent(new Event('visibilitychange'));
    await settle();
    expect(published).toHaveBeenCalled();
    expect(replace).not.toHaveBeenCalled();
    expect(document.querySelector('.update-note')?.textContent).toContain(
      'The North Pole just changed.',
    );
  });
});
