import { describe, expect, it } from 'vitest';
import { seasonRequests } from './season-data';

const noMore = { hasNextPage: false };

/** A booth request as the GraphQL API gives it, with these closing pull requests. */
const request = (number: number, login: string | null, pulls: object[] = []) => ({
  number,
  author: login === null ? null : { login },
  closedByPullRequestsReferences: { pageInfo: noMore, nodes: pulls },
});
const pull = (number: number, threads: object[] = [], more = false) => ({
  number,
  merged: true,
  reviewThreads: { pageInfo: { hasNextPage: more }, nodes: threads },
});
const thread = (isResolved: boolean, login?: string | null) => ({
  isResolved,
  comments: { nodes: login === undefined ? [] : [{ author: login === null ? null : { login } }] },
});
const page = (nodes: object[], endCursor: string | null = null) => ({
  data: {
    repository: { issues: { pageInfo: { hasNextPage: endCursor !== null, endCursor }, nodes } },
  },
});

/** A GraphQL API that answers each page by the cursor it is asked for. */
const pages =
  (byCursor: Record<string, unknown>) => (_query: string, variables: Record<string, unknown>) =>
    Promise.resolve(byCursor[String(variables.after)]);

describe('seasonRequests', () => {
  it('reads every page of booth requests, with their pull requests and threads', async () => {
    const ask = pages({
      null: page(
        [request(1, 'ana', [pull(2, [thread(true, 'tessl-reviewer'), thread(false, null)])])],
        'next',
      ),
      next: page([request(3, null, [pull(4, [thread(false)])])]),
    });
    expect(await seasonRequests(ask, 'o', 'r')).toEqual([
      {
        author: 'ana',
        pulls: [
          {
            number: 2,
            merged: true,
            threads: [
              { resolved: true, author: 'tessl-reviewer' },
              { resolved: false, author: null },
            ],
          },
        ],
      },
      {
        author: null,
        pulls: [{ number: 4, merged: true, threads: [{ resolved: false, author: null }] }],
      },
    ]);
  });

  it('fails rather than count from an answer with errors or without data', async () => {
    const partial = { ...page([]), errors: [{ message: 'rate limited' }] };
    await expect(seasonRequests(pages({ null: partial }), 'o', 'r')).rejects.toThrow(
      'rate limited',
    );
    await expect(seasonRequests(pages({ null: {} }), 'o', 'r')).rejects.toThrow('with errors');
    const empty = { ...page([]), errors: [] };
    expect(await seasonRequests(pages({ null: empty }), 'o', 'r')).toEqual([]);
  });

  it('fails rather than count a request with more than a page of pull requests or threads', async () => {
    const manyPulls = request(1, 'ana');
    manyPulls.closedByPullRequestsReferences.pageInfo = { hasNextPage: true };
    await expect(seasonRequests(pages({ null: page([manyPulls]) }), 'o', 'r')).rejects.toThrow(
      'Issue #1 has more closing pull requests than one page',
    );
    const manyThreads = request(1, 'ana', [pull(2, [], true)]);
    await expect(seasonRequests(pages({ null: page([manyThreads]) }), 'o', 'r')).rejects.toThrow(
      'Pull request #2 has more review threads than one page',
    );
  });
});
