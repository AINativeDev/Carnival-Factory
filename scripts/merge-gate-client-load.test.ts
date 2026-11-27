/**
 * What the merge gate's GitHub client sets up as it loads: the waits between
 * tries, the answers worth trying again, and the codes of a connection that
 * never reached GitHub (docs/specs/auto-merge-gate.md).
 */
import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  HttpFailure,
  InTurn,
  scriptedGitHub,
  Unreachable,
  type Routes,
} from './merge-gate-fake-github.ts';

const API = 'https://api.example';

afterEach(() => {
  vi.unstubAllGlobals();
});

/**
 * The client loaded afresh, so what it sets up as it loads (the waits, the
 * answers worth trying again, and the codes of a connection that never reached
 * GitHub) is set up inside the test that checks it.
 */
async function freshClient(routes: Routes) {
  vi.resetModules();
  const { githubClient: fresh } = await import('./merge-gate-github.ts');
  const github = scriptedGitHub(routes);
  vi.stubGlobal('fetch', github.fetchFrom(API, 'north/pole'));
  const waits: number[] = [];
  const gate = fresh(API, 'north/pole', 'secret', (ms) => {
    waits.push(ms);
    return Promise.resolve();
  });
  return { ...github, waits, gate };
}

describe('the client as it loads', () => {
  it('waits a second, then three, between its three tries', async () => {
    const { gate, waits } = await freshClient({ 'GET issues/5': new HttpFailure(502) });
    await expect(gate.call('GET', 'issues/5')).rejects.toThrow('HTTP 502');
    expect(waits).toEqual([1000, 3000]);
  });

  it.each([502, 503, 504])('tries a read again after a %d', async (status) => {
    const { gate, requests } = await freshClient({
      'GET issues/5': new InTurn([new HttpFailure(status), {}]),
    });
    await gate.call('GET', 'issues/5');
    expect(requests).toHaveLength(2);
  });

  it.each([
    'ECONNREFUSED',
    'ENOTFOUND',
    'EAI_AGAIN',
    'ENETUNREACH',
    'EHOSTUNREACH',
    'UND_ERR_CONNECT_TIMEOUT',
  ])('tries a merge again when its connection failed with %s', async (code) => {
    const { gate, writes } = await freshClient({
      'PUT pulls/12/merge': new InTurn([new Unreachable(code), { merged: true }]),
    });
    await expect(gate.call('PUT', 'pulls/12/merge')).resolves.toEqual({ merged: true });
    expect(writes()).toHaveLength(2);
  });

  it('never tries a merge of a pull request numbered past 9 again after an answer', async () => {
    const { gate, writes } = await freshClient({
      'PUT pulls/12/merge': new InTurn([new HttpFailure(504), {}]),
    });
    await expect(gate.call('PUT', 'pulls/12/merge')).rejects.toThrow('HTTP 504');
    expect(writes()).toHaveLength(1);
  });

  it('tries labels on an issue numbered past 9 again', async () => {
    const { gate, writes } = await freshClient({
      'POST issues/12/labels': new InTurn([new HttpFailure(504), []]),
    });
    await gate.call('POST', 'issues/12/labels', { labels: ['x'] });
    expect(writes()).toHaveLength(2);
  });
});

describe('the real wait', () => {
  it('ends on its own', async () => {
    vi.resetModules();
    const { pause } = await import('./merge-gate-github.ts');
    const waited = pause(1);
    expect(waited).toBeInstanceOf(Promise);
    const late = new Promise((resolve) => {
      setTimeout(() => {
        resolve('late');
      }, 200);
    });
    expect(await Promise.race([waited, late])).toBeUndefined();
  });
});
