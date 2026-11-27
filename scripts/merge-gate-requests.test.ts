/**
 * The booth request behind a factory pull request, and the pull requests that
 * closed lately, read from the scripted GitHub.
 */
import { describe, expect, it } from 'vitest';
import { scriptedGitHub } from './merge-gate-fake-github.ts';
import type { Issue, Pull } from './merge-gate-github.ts';
import { boothRequest, closedSince } from './merge-gate-requests.ts';

const REPOSITORY = 'north/pole';

const issue = (change: Partial<Issue> = {}): Issue => ({
  number: 5,
  state: 'open',
  title: 'My booth',
  body: '',
  user: { login: 'Elf', type: 'User' },
  labels: [{ name: 'booth-request' }, { name: 'tessl' }],
  ...change,
});

const pull = (change: Partial<Pull> = {}): Pull => ({
  number: 7,
  title: 'Build my booth',
  body: 'Closes #5',
  user: { login: 'tessl-app[bot]', type: 'Bot' },
  labels: [],
  updated_at: '2026-11-01T00:00:00Z',
  merged_at: null,
  head: { ref: 'booth', sha: 'a'.repeat(40), repo: null },
  ...change,
});

describe('boothRequest', () => {
  it('is the booth request the pull request closes', async () => {
    const github = scriptedGitHub({ 'GET issues/5': issue() });
    await expect(boothRequest(github.client, REPOSITORY, pull())).resolves.toEqual(issue());
    expect(github.requests.map((r) => r.path)).toEqual(['issues/5']);
  });

  it.each<[string, Pull]>([
    ['no body', pull({ body: null })],
    ['a body that links no issue', pull({ body: 'A booth.' })],
  ])('is nothing, without asking GitHub, for %s', async (_, without) => {
    const github = scriptedGitHub({ 'GET issues/5': issue() });
    await expect(boothRequest(github.client, REPOSITORY, without)).resolves.toBeUndefined();
    expect(github.requests).toEqual([]);
  });

  it.each<[string, Issue]>([
    ['a bot', issue({ user: { login: 'dependabot[bot]', type: 'Bot' } })],
    ['a level request', issue({ labels: [{ name: 'level-request' }, { name: 'tessl' }] })],
  ])('is nothing for an issue by %s', async (_, linked) => {
    const github = scriptedGitHub({ 'GET issues/5': linked });
    await expect(boothRequest(github.client, REPOSITORY, pull())).resolves.toBeUndefined();
  });
});

describe('closedSince', () => {
  const since = new Date('2026-11-10T00:00:00Z').getTime();
  const at = (number: number, updated: string) => pull({ number, updated_at: updated });

  it('keeps the pull requests updated at or after the time, asking for the newest first', async () => {
    const github = scriptedGitHub({
      'GET pulls?state=closed&sort=updated&direction=desc': [
        at(1, '2026-11-12T00:00:00Z'),
        at(2, '2026-11-10T00:00:00Z'),
        at(3, '2026-11-09T23:59:59Z'),
      ],
    });
    const pulls = await closedSince(github.client, since);
    expect(pulls.map((p) => p.number)).toEqual([1, 2]);
    expect(github.requests.map((r) => r.path)).toEqual([
      'pulls?state=closed&sort=updated&direction=desc&per_page=100&page=1',
    ]);
  });

  it('reads the next page while every pull request on a full one is recent', async () => {
    const recent = Array.from({ length: 100 }, (_, n) => at(n, '2026-11-11T00:00:00Z'));
    const github = scriptedGitHub({
      'GET pulls?state=closed&sort=updated&direction=desc': [
        ...recent,
        at(100, '2026-11-01T00:00:00Z'),
      ],
    });
    expect(await closedSince(github.client, since)).toHaveLength(100);
    expect(github.requests).toHaveLength(2);
  });

  it('reads on past a full page that ends exactly at the time', async () => {
    const page = Array.from({ length: 100 }, (_, n) =>
      at(n, n < 99 ? '2026-11-11T00:00:00Z' : '2026-11-10T00:00:00Z'),
    );
    const github = scriptedGitHub({
      'GET pulls?state=closed&sort=updated&direction=desc': page,
    });
    expect(await closedSince(github.client, since)).toHaveLength(100);
    expect(github.requests).toHaveLength(2);
  });

  it('stops at a full page that reaches older pull requests', async () => {
    const page = Array.from({ length: 100 }, (_, n) =>
      at(n, n < 99 ? '2026-11-11T00:00:00Z' : '2026-11-01T00:00:00Z'),
    );
    const github = scriptedGitHub({
      'GET pulls?state=closed&sort=updated&direction=desc': [...page, ...page],
    });
    expect(await closedSince(github.client, since)).toHaveLength(99);
    expect(github.requests).toHaveLength(1);
  });
});
