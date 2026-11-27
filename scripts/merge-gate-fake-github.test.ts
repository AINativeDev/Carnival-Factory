/**
 * The scripted GitHub the merge gate's tests run against answers as GitHub
 * does: a hundred to a page, answers in turn, failures as GitHub's or as a
 * broken connection's, and no body where GitHub sends none.
 */
import { describe, expect, it } from 'vitest';
import { HttpFailure, InTurn, scriptedGitHub, Unreachable } from './merge-gate-fake-github.ts';

const API = 'https://api.example';
const at = (path: string) => `${API}/repos/north/pole/${path}`;

describe('scriptedGitHub', () => {
  it('serves a list a hundred to a page, from the first page when none is named', async () => {
    const { client } = scriptedGitHub({ 'GET pulls': Array.from({ length: 150 }, (_, n) => n) });
    expect(await client.call('GET', 'pulls')).toHaveLength(100);
    expect(await client.call('GET', 'pulls?per_page=100&page=2')).toEqual(
      Array.from({ length: 50 }, (_, n) => n + 100),
    );
  });

  it('pages check runs, and serves any other answer whole', async () => {
    const runs = Array.from({ length: 101 }, (_, n) => n);
    const { client } = scriptedGitHub({
      'GET commits/a/check-runs': { total_count: 101, check_runs: runs },
      'GET odd': { check_runs: 'none' },
      'GET nothing': null,
    });
    expect(await client.call('GET', 'commits/a/check-runs?page=2')).toEqual({
      total_count: 101,
      check_runs: [100],
    });
    expect(await client.call('GET', 'odd?page=2')).toEqual({ check_runs: 'none' });
    expect(await client.call('GET', 'nothing')).toBeNull();
  });

  it('gives answers in turn, then the last one again', async () => {
    const { client } = scriptedGitHub({ 'GET issues/1': new InTurn(['a', 'b']) });
    const answers = [];
    for (let n = 0; n < 3; n++) answers.push(await client.call('GET', 'issues/1'));
    expect(answers).toEqual(['a', 'b', 'b']);
  });

  it('fails on a 400 as GitHub does', async () => {
    const { client } = scriptedGitHub({ 'GET issues/1': new HttpFailure(400) });
    await expect(client.call('GET', 'issues/1')).rejects.toThrow('GET issues/1 answered HTTP 400');
  });

  it('rejects as fetch does when the connection fails', async () => {
    const { fetchFrom } = scriptedGitHub({ 'GET issues/1': new Unreachable('ECONNREFUSED') });
    const failure = fetchFrom(API, 'north/pole')(at('issues/1'), { method: 'GET' });
    await expect(failure).rejects.toThrow(new TypeError('fetch failed'));
    await expect(failure).rejects.toMatchObject({ cause: { code: 'ECONNREFUSED' } });
  });

  it('sends no body with a 204 or a 404, and JSON with an answer', async () => {
    const { fetchFrom } = scriptedGitHub({ 'GET issues/1': { number: 1 } });
    const fetch = fetchFrom(API, 'north/pole');
    const written = await fetch(at('issues/1/labels'), { method: 'POST', body: '{}' });
    const missing = await fetch(at('issues/2'), { method: 'GET' });
    const found = await fetch(at('issues/1'), { method: 'GET' });
    expect([written.status, await written.text()]).toEqual([204, '']);
    expect([missing.status, await missing.text()]).toEqual([404, '']);
    expect([found.status, await found.text()]).toEqual([200, '{"number":1}']);
  });
});
