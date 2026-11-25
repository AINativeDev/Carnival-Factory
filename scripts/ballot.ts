/**
 * The People's Choice ballot on GitHub (docs/adr/0030-peoples-choice-on-an-issue.md):
 * finding the issue a maintainer opened, reading its comments with every 👍, and
 * adding a comment for a new entry. The API client is passed in, so the deploy
 * uses the real one and the tests a scripted one.
 */
import type { RawChoiceComment } from './peoples-choice.ts';

/** Runs one GraphQL query or mutation and gives back its data. */
export type GraphQL = <T>(query: string, variables: Record<string, unknown>) => Promise<T>;

interface Page<T> {
  nodes: T[];
  pageInfo: { hasNextPage: boolean; endCursor: string | null };
}

interface Reaction {
  createdAt: string;
  user: { databaseId: number } | null;
}

interface Comment {
  id: string;
  url: string;
  body: string;
  createdAt: string;
  viewerDidAuthor: boolean;
  reactions: Page<Reaction>;
}

type IssueNode = { id: string; title: string; url: string; author: { databaseId?: number } | null };

const REACTION_FIELDS =
  'nodes { createdAt user { databaseId } } pageInfo { hasNextPage endCursor }';

/**
 * The ballot: the oldest issue titled `title` that a maintainer opened, matched by
 * numeric id so a look-alike from anyone else is never counted.
 */
export async function findBallot(
  graphql: GraphQL,
  owner: string,
  name: string,
  maintainers: ReadonlySet<number>,
  title: string,
): Promise<{ id: string; url: string } | undefined> {
  let after: string | null = null;
  do {
    const found: { repository: { issues: Page<IssueNode> } } = await graphql(
      `
        query ($owner: String!, $name: String!, $after: String) {
          repository(owner: $owner, name: $name) {
            issues(first: 100, after: $after, orderBy: { field: CREATED_AT, direction: ASC }) {
              nodes {
                id
                title
                url
                author {
                  ... on User {
                    databaseId
                  }
                }
              }
              pageInfo {
                hasNextPage
                endCursor
              }
            }
          }
        }
      `,
      { owner, name, after },
    );
    const ballot = found.repository.issues.nodes.find(
      (node) => node.title.trim() === title && maintainers.has(node.author?.databaseId ?? -1),
    );
    if (ballot) return { id: ballot.id, url: ballot.url };
    const info = found.repository.issues.pageInfo;
    after = info.hasNextPage ? info.endCursor : null;
  } while (after);
  return undefined;
}

/** Every comment on the ballot, with all of its 👍, however many pages they span. */
export async function readBallotComments(
  graphql: GraphQL,
  ballotId: string,
): Promise<RawChoiceComment[]> {
  const comments: Comment[] = [];
  let after: string | null = null;
  do {
    const data: { node: { comments: Page<Comment> } } = await graphql(
      `query($id: ID!, $after: String) {
        node(id: $id) {
          ... on Issue {
            comments(first: 50, after: $after) {
              nodes {
                id url body createdAt viewerDidAuthor
                reactions(content: THUMBS_UP, first: 100) { ${REACTION_FIELDS} }
              }
              pageInfo { hasNextPage endCursor }
            }
          }
        }
      }`,
      { id: ballotId, after },
    );
    comments.push(...data.node.comments.nodes);
    const info = data.node.comments.pageInfo;
    after = info.hasNextPage ? info.endCursor : null;
  } while (after);

  for (const comment of comments) {
    let reactions = comment.reactions;
    while (reactions.pageInfo.hasNextPage && reactions.pageInfo.endCursor) {
      const data: { node: { reactions: Page<Reaction> } } = await graphql(
        `query($id: ID!, $after: String) {
          node(id: $id) {
            ... on IssueComment {
              reactions(content: THUMBS_UP, first: 100, after: $after) { ${REACTION_FIELDS} }
            }
          }
        }`,
        { id: comment.id, after: reactions.pageInfo.endCursor },
      );
      reactions = data.node.reactions;
      comment.reactions.nodes.push(...reactions.nodes);
    }
  }
  return comments.map((comment) => ({
    url: comment.url,
    body: comment.body,
    createdAt: comment.createdAt,
    viewerDidAuthor: comment.viewerDidAuthor,
    votes: comment.reactions.nodes.map((reaction) => ({
      createdAt: reaction.createdAt,
      userId: reaction.user?.databaseId ?? null,
    })),
  }));
}

/** Adds an entry's comment to the ballot. */
export async function addBallotComment(graphql: GraphQL, ballotId: string, body: string) {
  await graphql(
    `
      mutation ($id: ID!, $body: String!) {
        addComment(input: { subjectId: $id, body: $body }) {
          commentEdge {
            node {
              id
            }
          }
        }
      }
    `,
    { id: ballotId, body },
  );
}
