/**
 * The merge gate's GitHub client against the scripted GitHub: it retries
 * GitHub's temporary failures, and never a merge GitHub may have done
 * (docs/specs/auto-merge-gate.md). The waits are handed in, so nothing sleeps.
 */
import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  HttpFailure,
  InTurn,
  scriptedGitHub,
  Unreachable,
  type Routes,
} from './merge-gate-fake-github.ts';
import { githubClient, pause, RETRY_WAITS } from './merge-gate-github.ts';

const API = 'https://api.example';
const REPOSITORY = 'north/pole';

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

/** A client on `routes`, the waits it asked for, and the requests GitHub had. */
function client(routes: Routes) {
  const github = scriptedGitHub(routes);
  vi.stubGlobal('fetch', github.fetchFrom(API, REPOSITORY));
  const waits: number[] = [];
  const wait = (ms: number) => {
    waits.push(ms);
    return Promise.resolve();
  };
  const gate = githubClient(API, REPOSITORY, 'token', wait);
  const call = (method: string, path: string, body?: unknown) => gate.call(method, path, body);
  return { ...github, waits, call };
}
const MERGE = 'PUT pulls/7/merge';

describe('a temporary failure', () => {
  it('is tried again after a wait: a 504, then the answer', async () => {
    const github = client({ 'GET issues/5': new InTurn([new HttpFailure(504), { number: 5 }]) });
    await expect(github.call('GET', 'issues/5')).resolves.toEqual({ number: 5 });
    expect(github.waits).toEqual([1000]);
    expect(github.requests).toHaveLength(2);
  });

  it('fails after three tries, each wait longer than the last', async () => {
    const github = client({ 'GET issues/5': new HttpFailure(504) });
    await expect(github.call('GET', 'issues/5')).rejects.toThrow('GET issues/5 answered HTTP 504');
    expect(github.waits).toEqual(RETRY_WAITS);
    expect(github.requests).toHaveLength(3);
  });

  it.each([502, 503])('is a %d too', async (status) => {
    const github = client({ 'GET issues/5': new InTurn([new HttpFailure(status), {}]) });
    await expect(github.call('GET', 'issues/5')).resolves.toEqual({});
    expect(github.requests).toHaveLength(2);
  });

  it('is a connection that failed', async () => {
    const github = client({
      'GET issues/5': new InTurn([new Unreachable('ECONNRESET'), { number: 5 }]),
    });
    await expect(github.call('GET', 'issues/5')).resolves.toEqual({ number: 5 });
    expect(github.waits).toEqual([1000]);
  });

  it('is retried for a write that is not a merge', async () => {
    const github = client({ 'POST issues/7/labels': new InTurn([new HttpFailure(502), []]) });
    await expect(github.call('POST', 'issues/7/labels', { labels: ['x'] })).resolves.toEqual([]);
    expect(github.writes()).toHaveLength(2);
  });
});

describe('any other failure', () => {
  it('fails at once: a 404 is not tried again', async () => {
    const github = client({});
    await expect(github.call('GET', 'issues/5')).rejects.toThrow('GET issues/5 answered HTTP 404');
    expect(github.waits).toEqual([]);
    expect(github.requests).toHaveLength(1);
  });

  it('fails at once on a 500', async () => {
    const github = client({ 'GET issues/5': new HttpFailure(500) });
    await expect(github.call('GET', 'issues/5')).rejects.toThrow('HTTP 500');
    expect(github.requests).toHaveLength(1);
  });
});

describe('a merge', () => {
  it('is tried again when it timed out connecting, since nothing reached GitHub', async () => {
    const github = client({
      [MERGE]: new InTurn([new Unreachable('UND_ERR_CONNECT_TIMEOUT'), { merged: true }]),
    });
    await expect(github.call('PUT', 'pulls/7/merge', { sha: 'abc' })).resolves.toEqual({
      merged: true,
    });
    expect(github.writes()).toHaveLength(2);
  });

  it('gives up after three connections that failed', async () => {
    const github = client({ [MERGE]: new Unreachable('ECONNREFUSED') });
    await expect(github.call('PUT', 'pulls/7/merge')).rejects.toThrow('PUT pulls/7/merge failed');
    expect(github.writes()).toHaveLength(3);
  });

  it('is never tried again after GitHub answered, since it may have merged', async () => {
    const github = client({ [MERGE]: new InTurn([new HttpFailure(504), { merged: true }]) });
    await expect(github.call('PUT', 'pulls/7/merge')).rejects.toThrow('HTTP 504');
    expect(github.writes()).toHaveLength(1);
  });

  it('is never tried again when the connection broke after it was sent', async () => {
    const github = client({
      [MERGE]: new InTurn([new Unreachable('UND_ERR_HEADERS_TIMEOUT'), { merged: true }]),
    });
    await expect(github.call('PUT', 'pulls/7/merge')).rejects.toThrow('PUT pulls/7/merge failed');
    expect(github.writes()).toHaveLength(1);
  });
});

describe('the real wait', () => {
  it('waits the time it is given', async () => {
    vi.useFakeTimers();
    let done = false;
    const waiting = pause(1000).then(() => (done = true));
    await vi.advanceTimersByTimeAsync(999);
    expect(done).toBe(false);
    await vi.advanceTimersByTimeAsync(1);
    await waiting;
    expect(done).toBe(true);
  });
});
