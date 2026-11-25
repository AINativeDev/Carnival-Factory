import { describe, expect, it } from 'vitest';
import { acceptMarker, ADVENT_MARKER } from './advent';
import { commentsByIssue, readAdventCounts } from './write-advent';
import { fakeGitHub } from './test-support/fake-github';

const app = { login: 'tessl-app[bot]', type: 'Bot' };
const accept = (issue: number, day: number) => ({
  user: app,
  body: `${ADVENT_MARKER}\n${acceptMarker(day)}`,
  created_at: '2026-12-05T00:00:00Z',
  issue_url: `https://api.github.com/repos/o/r/issues/${issue}`,
});

describe('commentsByIssue', () => {
  it('groups the comments by the issue they are on, and leaves out any it can’t place', () => {
    const odd = { ...accept(1, 1), issue_url: 'https://api.github.com/repos/o/r/pulls/x' };
    const grouped = commentsByIssue([accept(1, 1), accept(1, 2), accept(2, 3), odd]);
    expect([...grouped.keys()]).toEqual([1, 2]);
    expect(grouped.get(1)).toHaveLength(2);
  });
});

describe('readAdventCounts', () => {
  it('counts the accepted days from the comments since the first door, by each issue', async () => {
    const reader = fakeGitHub({
      'repos/o/r/issues?labels=advent-done,accepted&state=all': [
        { number: 1, user: { login: 'Ana' } },
        { number: 2, user: { login: 'bob' } },
        { number: 3, user: { login: 'pr-author' }, pull_request: {} },
        { number: 4, user: { login: 'ana' } },
      ],
      'repos/o/r/issues/comments?since=2026-11-30T00:00:00Z&sort=created&direction=asc': [
        accept(1, 1),
        accept(3, 4),
        accept(4, 2),
      ],
    });
    expect(await readAdventCounts(reader, 'o/r', 2026)).toEqual({ ana: 2 });
  });
});
