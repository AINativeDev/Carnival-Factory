import { describe, expect, it } from 'vitest';
import { historyOf, readRequests } from './write-square-history';
import { issue, pull, thread } from './test-support/github-requests';

/** Where a connection ends. */
const last: { hasNextPage: boolean; endCursor: string | null } = {
  hasNextPage: false,
  endCursor: null,
};
const more = (endCursor: string | null) => ({ hasNextPage: true, endCursor });

/** A pull request as the first query gives it: its files and threads paged. */
const paged = (number: number, files: { path: string }[] | null, filesMore = last) => ({
  ...pull(number, `tessl/issue-${number - 1}`, []),
  files: files && { nodes: files, pageInfo: filesMore },
  reviewThreads: { nodes: [thread('tessl-reviewer', true)], pageInfo: more('t2') },
});

/** GitHub's GraphQL API, answering each query by what it lists and the page it asks for. */
function api(answers: Record<string, unknown>) {
  const asked: string[] = [];
  const ask = (query: string, variables: Record<string, unknown>) => {
    const list = /list: (\w+)/.exec(query)?.[1] ?? '';
    const pullNumber = typeof variables.number === 'number' ? `#${variables.number}` : '';
    const key = `${list}${pullNumber}@${String(variables.after)}`;
    asked.push(key);
    return Promise.resolve(answers[key] ?? { errors: [{ message: `nothing for ${key}` }] });
  };
  return { ask, asked };
}
const repository = (list: unknown) => ({ data: { repository: { list } } });
const ofPull = (list: unknown) => ({ data: { repository: { pullRequest: { list } } } });

describe('readRequests', () => {
  it('reads every page of issues and pull requests, and the rest of each pull request', async () => {
    const { ask, asked } = api({
      'issues@null': repository({
        nodes: [issue(1, 'ana', [], '2026-11-20T10:00:00Z')],
        pageInfo: more('i2'),
      }),
      // A next page without a cursor to read it by is where the list ends.
      'issues@i2': repository({
        nodes: [issue(2, 'bob', [], '2026-11-21T10:00:00Z')],
        pageInfo: more(null),
      }),
      'pullRequests@null': repository({
        nodes: [paged(2, [{ path: 'carnival/booths/ana/booth.ts' }], more('f2')), paged(3, null)],
        pageInfo: last,
      }),
      'files#2@f2': ofPull({ nodes: [{ path: 'carnival/booths/ana/README.md' }], pageInfo: last }),
      'reviewThreads#2@t2': ofPull({ nodes: [thread('someone', false)], pageInfo: last }),
      'reviewThreads#3@t2': ofPull({ nodes: [], pageInfo: last }),
    });
    const { issues, pulls } = await readRequests(ask, 'o', 'r');
    expect(issues.map((read) => read.number)).toEqual([1, 2]);
    expect(pulls[0]?.files).toEqual({
      nodes: [{ path: 'carnival/booths/ana/booth.ts' }, { path: 'carnival/booths/ana/README.md' }],
    });
    expect(pulls[0]?.reviewThreads.nodes).toHaveLength(2);
    expect(pulls[1]?.files).toBeNull();
    expect(asked).not.toContain('files#3@null');
  });

  it("fails with GitHub's own error, or says there was no data", async () => {
    await expect(readRequests(api({}).ask, 'o', 'r')).rejects.toThrow(
      'GraphQL failed: nothing for issues@null',
    );
    const silent = api({ 'issues@null': { errors: [] } });
    await expect(readRequests(silent.ask, 'o', 'r')).rejects.toThrow('GraphQL failed: no data');
    const empty = api({ 'issues@null': {} });
    await expect(readRequests(empty.ask, 'o', 'r')).rejects.toThrow('GraphQL failed: no data');
  });
});

describe('historyOf', () => {
  it("shapes every square's history, with the factory's numbers beside it", () => {
    const requests = {
      issues: [issue(1, 'ana', ['booth-request', 'tessl'], '2026-11-20T10:00:00Z')],
      pulls: [pull(2, 'tessl/issue-1', ['carnival/booths/ana/booth.ts'])],
    };
    const history = historyOf(
      requests,
      ['booth/ana'],
      'https://o.github.io/r/',
      '2026-11-24T00:00:00Z',
    );
    expect(Object.keys(history.squares)).toEqual(['booth/ana']);
    expect(history.factory).toMatchObject({ builds: 1, merged: 1 });
  });
});
