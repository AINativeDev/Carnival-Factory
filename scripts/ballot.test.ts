import { describe, expect, it } from 'vitest';
import { addBallotComment, findBallot, readBallotComments, type GraphQL } from './ballot';

const page = <T>(nodes: T[], endCursor: string | null = null) => ({
  nodes,
  pageInfo: { hasNextPage: endCursor !== null, endCursor },
});
const MAINTAINER = 70908;

/** A GraphQL API that answers from a script of replies, and records what it was asked. */
function fakeApi(replies: unknown[]) {
  const asked: { query: string; variables: Record<string, unknown> }[] = [];
  const graphql: GraphQL = (query, variables) => {
    asked.push({ query, variables });
    return Promise.resolve(replies.shift() as never);
  };
  return { graphql, asked };
}

const issue = (id: string, title: string, author: number | null) => ({
  id,
  title,
  url: `https://github.com/o/r/issues/${id}`,
  author: author === null ? null : { databaseId: author },
});

describe('findBallot', () => {
  it("finds the oldest issue with the ballot's title that a maintainer opened, across pages", async () => {
    const { graphql, asked } = fakeApi([
      { repository: { issues: page([issue('1', "People's Choice", 12345)], 'next') } },
      {
        repository: {
          issues: page([
            issue('2', " People's Choice ", MAINTAINER),
            issue('3', "People's Choice", MAINTAINER),
          ]),
        },
      },
    ]);
    const ballot = await findBallot(graphql, 'o', 'r', new Set([MAINTAINER]), "People's Choice");
    expect(ballot).toEqual({ id: '2', url: 'https://github.com/o/r/issues/2' });
    expect(asked[1]?.variables.after).toBe('next');
  });

  it('finds nothing when no maintainer opened one', async () => {
    const { graphql } = fakeApi([
      {
        repository: {
          issues: page([issue('1', 'Other', MAINTAINER), issue('2', "People's Choice", null)]),
        },
      },
    ]);
    expect(
      await findBallot(graphql, 'o', 'r', new Set([MAINTAINER]), "People's Choice"),
    ).toBeUndefined();
  });
});

const comment = (
  id: string,
  votes: { createdAt: string; user: { databaseId: number } | null }[],
  more: string | null = null,
) => ({
  id,
  url: `https://github.com/o/r/issues/2#issuecomment-${id}`,
  body: `entry ${id}`,
  createdAt: '2026-11-25T00:00:00Z',
  viewerDidAuthor: true,
  reactions: page(votes, more),
});
const vote = (user: number | null) => ({
  createdAt: '2026-11-26T00:00:00Z',
  user: user === null ? null : { databaseId: user },
});

describe('readBallotComments', () => {
  it('reads every comment and every 👍, following both kinds of page', async () => {
    const { graphql, asked } = fakeApi([
      { node: { comments: page([comment('10', [vote(1)], 'r1')], 'c1') } },
      { node: { comments: page([comment('11', [vote(null)])]) } },
      { node: { reactions: page([vote(2)]) } },
    ]);
    const comments = await readBallotComments(graphql, 'BALLOT');
    expect(comments.map((c) => c.votes.map((v) => v.userId))).toEqual([[1, 2], [null]]);
    expect(comments[0]).toMatchObject({ body: 'entry 10', viewerDidAuthor: true });
    expect(asked[0]?.query).toContain('... on Issue');
    expect(asked[2]?.query).toContain('... on IssueComment');
  });
});

describe('addBallotComment', () => {
  it('adds an entry as a comment on the ballot issue', async () => {
    const { graphql, asked } = fakeApi([{ addComment: { commentEdge: { node: { id: 'x' } } } }]);
    await addBallotComment(graphql, 'BALLOT', 'an entry');
    expect(asked[0]?.query).toContain('addComment(input: { subjectId: $id, body: $body })');
    expect(asked[0]?.variables).toEqual({ id: 'BALLOT', body: 'an entry' });
  });
});
