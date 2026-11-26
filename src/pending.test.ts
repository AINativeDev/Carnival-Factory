// @vitest-environment happy-dom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { PendingBooth } from './northpole/construction-sites';
import { followPending, knownPending, loadSites, saveSites } from './pending';

const ANA: PendingBooth = { login: 'ana', issue: 12, spot: 30, stage: 'building' };

/** A fake `fetch` that answers every request for pending.json with `answer`. */
function servePending(answer: unknown) {
  const fetch = vi.fn((url: URL, init: RequestInit) => {
    expect(url.pathname.endsWith('/pending.json')).toBe(true);
    expect(url.searchParams.has('t')).toBe(true);
    expect(init.cache).toBe('no-store');
    if (answer === 'offline') return Promise.reject(new Error('offline'));
    if (answer === 'missing') return Promise.resolve({ ok: false } as Response);
    return Promise.resolve({ ok: true, json: () => Promise.resolve(answer) } as Response);
  });
  vi.stubGlobal('fetch', fetch);
  return fetch;
}

/** Lets the reads that are in flight finish. */
const settle = () => vi.advanceTimersByTimeAsync(0);

beforeEach(() => {
  vi.useFakeTimers();
  localStorage.clear();
});
afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('the construction sites this browser last saw', () => {
  it('starts with none, and remembers the logins it is given, up to 100', () => {
    expect(loadSites()).toEqual([]);
    saveSites(['ana', 'bob']);
    expect(loadSites()).toEqual(['ana', 'bob']);
    saveSites(Array.from({ length: 150 }, (_, index) => `elf-${String(index)}`));
    expect(loadSites()).toHaveLength(100);
  });

  it('reads only logins back, and nothing from a broken or foreign value', () => {
    localStorage.setItem('north-pole-sites', JSON.stringify(['ana', 7, null, 'bob']));
    expect(loadSites()).toEqual(['ana', 'bob']);
    localStorage.setItem('north-pole-sites', JSON.stringify({ ana: true }));
    expect(loadSites()).toEqual([]);
    localStorage.setItem('north-pole-sites', '{not json');
    expect(loadSites()).toEqual([]);
  });

  it('carries on without storage, so a landed booth just does not sparkle', () => {
    const off = () => {
      throw new Error('storage is off');
    };
    vi.stubGlobal('localStorage', { getItem: off, setItem: off });
    expect(() => {
      saveSites(['ana']);
    }).not.toThrow();
    expect(loadSites()).toEqual([]);
  });
});

describe('following the booths being built', () => {
  it('shows nothing until a list is read, then the list now and every two minutes', async () => {
    expect(knownPending()).toBeUndefined();
    const fetch = servePending([ANA, { login: 'not a login' }]);
    const show = vi.fn();
    const stop = followPending(show);
    await settle();
    expect(show).toHaveBeenLastCalledWith([ANA]);
    expect(knownPending()).toEqual([ANA]);

    await vi.advanceTimersByTimeAsync(2 * 60 * 1000);
    expect(fetch).toHaveBeenCalledTimes(2);
    expect(show).toHaveBeenCalledTimes(2);

    stop();
    await vi.advanceTimersByTimeAsync(10 * 60 * 1000);
    expect(fetch).toHaveBeenCalledTimes(2);
  });

  it('keeps what it showed when the list is missing or the network is down', async () => {
    for (const answer of ['missing', 'offline']) {
      servePending(answer);
      const show = vi.fn();
      const stop = followPending(show);
      await settle();
      expect(show).not.toHaveBeenCalled();
      stop();
    }
    expect(knownPending()).toEqual([ANA]);
  });

  it('shows nothing that arrives after it was stopped', async () => {
    servePending([]);
    const show = vi.fn();
    const stop = followPending(show);
    stop();
    await settle();
    expect(show).not.toHaveBeenCalled();
    expect(knownPending()).toEqual([ANA]);
  });
});
