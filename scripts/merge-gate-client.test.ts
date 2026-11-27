/**
 * What the merge gate's GitHub client sends and reads back: the address, the
 * token and the body, an empty answer, every page of a list, and which
 * requests it may send twice (docs/specs/auto-merge-gate.md).
 */
import { afterEach, describe, expect, it, vi } from 'vitest';
import { HttpFailure, InTurn, scriptedGitHub, type Routes } from './merge-gate-fake-github.ts';
import { getAll, githubClient, names } from './merge-gate-github.ts';

const API = 'https://api.example';

afterEach(() => {
  vi.unstubAllGlobals();
});

/** A client whose `fetch` records each call's address and options. */
function recorded(answer: () => Response) {
  const calls: [string, RequestInit][] = [];
  vi.stubGlobal('fetch', (url: string, init: RequestInit) => {
    calls.push([url, init]);
    return Promise.resolve(answer());
  });
  return { calls, gate: githubClient(API, 'north/pole', 'secret', () => Promise.resolve()) };
}

describe('a request', () => {
  it('goes to the repository’s address with the token, as JSON', async () => {
    const { calls, gate } = recorded(() => new Response('{"ok":true}'));
    await expect(gate.call('POST', 'issues/7/comments', { body: 'hi' })).resolves.toEqual({
      ok: true,
    });
    expect(calls).toEqual([
      [
        'https://api.example/repos/north/pole/issues/7/comments',
        {
          method: 'POST',
          headers: {
            Authorization: 'Bearer secret',
            Accept: 'application/vnd.github+json',
            'Content-Type': 'application/json',
          },
          body: '{"body":"hi"}',
        },
      ],
    ]);
  });

  it('sends no body when it has none', async () => {
    const { calls, gate } = recorded(() => new Response('[]'));
    await gate.call('GET', 'issues');
    expect(calls[0]?.[1]).not.toHaveProperty('body');
  });

  it('reads an answer with no content as nothing', async () => {
    const { gate } = recorded(() => new Response(null, { status: 204 }));
    await expect(gate.call('DELETE', 'issues/7/labels/x')).resolves.toBeUndefined();
  });

  it('says which request failed, and why, when the connection broke', async () => {
    vi.stubGlobal('fetch', () => Promise.reject(new TypeError('fetch failed')));
    const gate = githubClient(API, 'north/pole', 'secret', () => Promise.resolve());
    await expect(gate.call('POST', 'issues/7/comments')).rejects.toThrow(
      'POST issues/7/comments failed: TypeError: fetch failed',
    );
  });
});

describe('a request GitHub failed for now', () => {
  /** How many times the client sent `method path` when GitHub answered 503 first. */
  async function tries(method: string, path: string) {
    const github = scriptedGitHub({
      [`${method} ${path}`]: new InTurn([new HttpFailure(503), {}]),
    });
    vi.stubGlobal('fetch', github.fetchFrom(API, 'north/pole'));
    const gate = githubClient(API, 'north/pole', 'secret', () => Promise.resolve());
    await gate.call(method, path).catch(() => undefined);
    return github.requests.length;
  }

  it.each([
    ['PUT', 'issues/7/labels'],
    ['PUT', 'pulls/7/merge/again'],
    ['PUT', 'x/pulls/7/merge'],
    ['PUT', 'pulls/seven/merge'],
  ])('is tried again: %s %s, which is not a merge', async (method, path) => {
    expect(await tries(method, path)).toBe(2);
  });

  it.each([
    ['POST', 'issues/7/labels/more'],
    ['POST', 'x/issues/7/labels'],
    ['POST', 'issues/seven/labels'],
  ])('is not tried again: %s %s, which is not adding labels', async (method, path) => {
    expect(await tries(method, path)).toBe(1);
  });
});

describe('getAll', () => {
  const pageOf = (length: number) => Array.from({ length }, (_, n) => n);

  async function pages(routes: Routes, path: string, stop?: (page: number[]) => boolean) {
    const github = scriptedGitHub(routes);
    const all = await getAll<number>(github.client, path, stop);
    return { all, paths: github.requests.map((r) => r.path) };
  }

  it('reads every page, a hundred at a time, until one is not full', async () => {
    const { all, paths } = await pages({ 'GET pulls': pageOf(250) }, 'pulls');
    expect(all).toHaveLength(250);
    expect(paths).toEqual([
      'pulls?per_page=100&page=1',
      'pulls?per_page=100&page=2',
      'pulls?per_page=100&page=3',
    ]);
  });

  it('asks for one more page after exactly a hundred', async () => {
    const { paths } = await pages({ 'GET pulls': pageOf(100) }, 'pulls');
    expect(paths).toHaveLength(2);
  });

  it('adds the page to a query the path already has', async () => {
    const { paths } = await pages({ 'GET pulls?state=closed': [] }, 'pulls?state=closed');
    expect(paths).toEqual(['pulls?state=closed&per_page=100&page=1']);
  });

  it('stops early when asked, and goes on when not', async () => {
    const routes = { 'GET pulls': pageOf(150) };
    expect((await pages(routes, 'pulls', () => true)).all).toHaveLength(100);
    expect((await pages(routes, 'pulls', () => false)).all).toHaveLength(150);
  });
});

describe('names', () => {
  it('is the labels’ names', () => {
    expect(names([{ name: 'tessl' }, { name: 'booth-request' }])).toEqual([
      'tessl',
      'booth-request',
    ]);
  });
});
