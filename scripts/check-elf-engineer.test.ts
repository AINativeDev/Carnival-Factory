import { describe, expect, it } from 'vitest';
import { checkBadgeRequest } from './check-elf-engineer';
import { fakeGitHub } from './test-support/fake-github';

const SEARCH = `search/issues?q=${encodeURIComponent('repo:octocat/workshop is:pr is:merged author:app/tessl-app')}`;

/** Badge request 3, by octocat, naming `repo` and the pull request `pull`. */
const request = (repo: string, pull = '') => ({
  'repos/o/r/issues/3': {
    user: { login: 'octocat' },
    title: 'Elf Engineer',
    body: `### Your repository\n\n${repo}\n\n### A pull request the factory opened there\n\n${pull}`,
  },
});
const workshop = (type = 'User', isPrivate = false) => ({
  'repos/octocat/workshop': {
    full_name: 'octocat/workshop',
    private: isPrivate,
    owner: { login: 'octocat', type },
  },
});
const factoryPull = {
  'repos/octocat/workshop/pulls/12': {
    number: 12,
    user: { login: 'tessl-app[bot]', type: 'Bot' },
  },
};

describe('checkBadgeRequest', () => {
  it('grants a working factory its tier, from its tessl.json, its pull request and its count', async () => {
    const reader = fakeGitHub({
      ...request('octocat/workshop', 'https://github.com/octocat/workshop/pull/12'),
      ...workshop(),
      ...factoryPull,
      'repos/octocat/workshop/contents/tessl.json': { type: 'file' },
      [SEARCH]: { total_count: 6, incomplete_results: false },
    });
    const { decision, facts } = await checkBadgeRequest(reader, 'o/r', '3');
    expect(decision).toEqual({ grant: true, repo: 'octocat/workshop', tier: 'silver' });
    expect(facts).toMatchObject({
      authorIsMember: false,
      hasTesslJson: true,
      merged: 6,
      pull: { repo: 'octocat/workshop', number: 12, author: 'tessl-app[bot]', authorIsBot: true },
    });
  });

  it("checks membership of an organisation's repository, and counts a folder as no tessl.json", async () => {
    const reader = fakeGitHub(
      {
        ...request('octocat/workshop'),
        ...workshop('Organization'),
        'repos/octocat/workshop/contents/tessl.json': [{ name: 'inside' }],
      },
      ['orgs/octocat/public_members/octocat'],
    );
    const { facts } = await checkBadgeRequest(reader, 'o/r', '3');
    expect(facts).toMatchObject({ authorIsMember: true, hasTesslJson: false, merged: 0 });
    expect(facts.pull).toBeUndefined();
  });

  it('leaves out a pull request in a private repository, one GitHub lacks, and one not found', async () => {
    const notFound = fakeGitHub({
      ...request('octocat/workshop', 'https://github.com/octocat/workshop/pull/12'),
      ...workshop(),
    });
    expect((await checkBadgeRequest(notFound, 'o/r', '3')).facts.pull).toBeUndefined();

    const gone = fakeGitHub({
      ...request('octocat/workshop', 'https://github.com/elves/gone/pull/1'),
      ...workshop(),
    });
    expect((await checkBadgeRequest(gone, 'o/r', '3')).facts.pull).toBeUndefined();

    const hidden = fakeGitHub({
      ...request('octocat/workshop', 'https://github.com/elves/secret/pull/1'),
      ...workshop(),
      'repos/elves/secret': { full_name: 'elves/secret', private: true },
    });
    expect((await checkBadgeRequest(hidden, 'o/r', '3')).facts.pull).toBeUndefined();
    expect(hidden.asked).not.toContain('repos/elves/secret/pulls/1');
  });

  it('reads nothing more of a private repository, as if GitHub could not find it', async () => {
    const reader = fakeGitHub({ ...request('octocat/workshop'), ...workshop('User', true) });
    const { decision, facts } = await checkBadgeRequest(reader, 'o/r', '3');
    expect(decision.grant).toBe(false);
    expect(facts.repo).toBeUndefined();
    expect(reader.asked).toEqual(['repos/o/r/issues/3', 'repos/octocat/workshop']);
  });

  it('decides nothing on an incomplete count', async () => {
    const reader = fakeGitHub({
      ...request('octocat/workshop'),
      ...workshop(),
      [SEARCH]: { total_count: 1, incomplete_results: true },
    });
    await expect(checkBadgeRequest(reader, 'o/r', '3')).rejects.toThrow('was incomplete');
  });

  it('throws for an issue that is not there, and reads an empty one as naming nothing', async () => {
    await expect(checkBadgeRequest(fakeGitHub({}), 'o/r', '9')).rejects.toThrow(
      'Issue 9 not found',
    );
    const empty = fakeGitHub({
      'repos/o/r/issues/3': { user: { login: 'octocat' }, title: 'Hi', body: null },
    });
    expect((await checkBadgeRequest(empty, 'o/r', '3')).decision.grant).toBe(false);
    expect(empty.asked).toEqual(['repos/o/r/issues/3']);
  });
});
