import { describe, expect, it } from 'vitest';
import { grantMarker } from './badge-grants';
import { readBadgeHolders } from './badge-holders';
import { fakeGitHub } from './test-support/fake-github';

const app = { login: 'tessl-app[bot]', type: 'Bot' };

describe('readBadgeHolders', () => {
  it("reads each accepted request's comments for the Tessl App's grants", async () => {
    const reader = fakeGitHub({
      'repos/o/r/issues?labels=badge-request,badge-granted&state=all': [
        { number: 1, user: { login: 'Ana' } },
        { number: 2, user: { login: 'bob' } },
        { number: 3, user: { login: 'pr-author' }, pull_request: {} },
      ],
      'repos/o/r/issues/1/comments': [
        {
          user: app,
          body: grantMarker('ana/workshop', 'gold'),
          created_at: '2026-12-02T00:00:00Z',
        },
      ],
    });
    expect(await readBadgeHolders(reader, 'o/r')).toEqual([
      expect.objectContaining({ login: 'ana', repo: 'ana/workshop', tier: 'gold' }),
    ]);
    // A pull request on the list is never read as a request.
    expect(reader.asked).not.toContain('repos/o/r/issues/3/comments');
    expect(reader.asked).toContain('repos/o/r/issues/2/comments');
  });
});
