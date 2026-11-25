import { mkdirSync, mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { boothPlots, pendingRequests } from './write-pending';
import { fakeGitHub } from './test-support/fake-github';

/** A checkout with these pins and booth folders, each holding these files. */
function checkout(pins: Record<string, number>, booths: Record<string, Record<string, string>>) {
  const root = mkdtempSync(join(tmpdir(), 'pending-'));
  mkdirSync(join(root, 'src', 'northpole'), { recursive: true });
  writeFileSync(join(root, 'src/northpole/plots.json'), JSON.stringify({ booths: pins }));
  for (const [id, files] of Object.entries(booths)) {
    mkdirSync(join(root, 'carnival', 'booths', id), { recursive: true });
    for (const [name, text] of Object.entries(files)) {
      writeFileSync(join(root, 'carnival', 'booths', id, name), text);
    }
  }
  return root;
}

describe('boothPlots', () => {
  it('places each booth by its pin, then its own plot.json, as the map does', () => {
    const root = checkout(
      { ana: 30 },
      {
        ana: { 'booth.ts': '' },
        bob: { 'booth.ts': '', 'plot.json': '{ "plot": 40, "issue": 7 }' },
        cy: { 'booth.ts': '', 'plot.json': 'not json' },
        draft: { 'README.md': '' },
      },
    );
    const plots = boothPlots(root);
    expect(plots.get('ana')).toBe(30);
    expect(plots.get('bob')).toBe(40);
    expect(plots.has('cy')).toBe(true);
    expect(plots.has('draft')).toBe(false);
  });
});

const ISSUES = 'repos/o/r/issues?state=open&labels=booth-request,tessl';
const pullsOf = (issue: number) =>
  `repos/o/r/pulls?state=open&head=${encodeURIComponent(`o:tessl/issue-${issue}`)}`;
const issue = (number: number, login: string, type = 'User') => ({
  number,
  user: { login, type },
  labels: [{ name: 'booth-request' }, { name: 'tessl' }],
});

describe('pendingRequests', () => {
  it("gives each person's latest request, with its pull request's labels and checks", async () => {
    const reader = fakeGitHub({
      [ISSUES]: [
        issue(1, 'Ana'),
        issue(2, 'ana'),
        issue(3, 'bob'),
        issue(4, 'renovate[bot]', 'Bot'),
        { ...issue(5, 'cy'), pull_request: {} },
        { ...issue(6, 'ghost'), user: null },
        issue(7, 'dee'),
        issue(8, 'eve'),
      ],
      [pullsOf(2)]: [
        { head: { sha: 'abc', repo: { full_name: 'o/r' } }, labels: [{ name: 'needs-human' }] },
      ],
      'repos/o/r/commits/abc/check-runs?per_page=100': {
        check_runs: [{ status: 'completed', conclusion: 'success' }],
      },
      // A fork's pull request, and one whose fork is gone, are not the factory's.
      [pullsOf(3)]: [{ head: { sha: 'f', repo: { full_name: 'bob/r' } }, labels: [] }],
      [pullsOf(7)]: [{ head: { sha: 'g', repo: null }, labels: [] }],
      [pullsOf(8)]: [{ head: { sha: 'h', repo: { full_name: 'o/r' } }, labels: [] }],
    });
    const requests = await pendingRequests(reader, 'o/r');
    expect(requests).toEqual([
      {
        login: 'ana',
        issue: 2,
        labels: ['booth-request', 'tessl'],
        pull: { labels: ['needs-human'], checks: 'passed' },
      },
      { login: 'bob', issue: 3, labels: ['booth-request', 'tessl'] },
      { login: 'dee', issue: 7, labels: ['booth-request', 'tessl'] },
      // No check runs to read yet counts as running.
      {
        login: 'eve',
        issue: 8,
        labels: ['booth-request', 'tessl'],
        pull: { labels: [], checks: 'running' },
      },
    ]);
  });

  it('reads the pull requests ten at a time, and a request without one is still being built', async () => {
    const many = Array.from({ length: 12 }, (_, n) => issue(n + 1, `elf${n}`));
    const requests = await pendingRequests(fakeGitHub({ [ISSUES]: many }), 'o/r');
    expect(requests).toHaveLength(12);
    expect(requests.every((request) => request.pull === undefined)).toBe(true);
  });
});
