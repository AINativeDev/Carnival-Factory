/**
 * Writes the People's Choice standings (scripts/peoples-choice.ts) to the file
 * named by its argument, for the build to bake into the page
 * (PEOPLES_CHOICE_FILE in vite.config.ts).
 *
 * It finds the discussion a maintainer started with the title in
 * DISCUSSION_TITLE, adds a comment for every booth and Elf Engineer's factory
 * that has none yet, while voting is open, and reads every comment's 👍. The
 * page never reaches the network. Without the discussion it writes nothing,
 * and the map shows no standings.
 *
 * Run by "Deploy to GitHub Pages", which only runs main's own code, with
 * GITHUB_TOKEN and GITHUB_REPOSITORY set. The badge holders come from
 * BADGE_HOLDERS_FILE, which scripts/badge-holders.ts writes first.
 */
import { existsSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { cleanHolders } from '../northpole/badges.ts';
import { DISCUSSION_TITLE, VOTING_CLOSES, votingClosed } from '../northpole/peoples-choice.ts';
import { get } from './github-api.ts';
import { MAINTAINERS } from './ownership.ts';
import { entryBody, missingEntries, standings, type RawChoiceComment } from './peoples-choice.ts';
import { siteUrl } from './share-pages.ts';

const token = process.env.GITHUB_TOKEN;
const repository = process.env.GITHUB_REPOSITORY;
const out = process.argv[2];
if (!token || !repository || !out) {
  throw new Error('Set GITHUB_TOKEN and GITHUB_REPOSITORY, and name the file to write');
}
const [owner, name] = repository.split('/');
const api = process.env.GITHUB_API_URL ?? 'https://api.github.com';

async function graphql<T>(query: string, variables: Record<string, unknown>): Promise<T> {
  const response = await fetch(`${api}/graphql`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, Accept: 'application/vnd.github+json' },
    body: JSON.stringify({ query, variables }),
  });
  if (!response.ok) throw new Error(`GraphQL answered HTTP ${response.status}`);
  const result = (await response.json()) as { data?: T; errors?: { message: string }[] };
  // Any error, even beside some data, means the read or the write is incomplete.
  if (!result.data || result.errors?.length) {
    throw new Error(`GraphQL failed: ${result.errors?.[0]?.message ?? 'no data'}`);
  }
  return result.data;
}

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

const REACTION_FIELDS =
  'nodes { createdAt user { databaseId } } pageInfo { hasNextPage endCursor }';

// The discussion: the oldest one with the title that a maintainer started, by user id.
const maintainers = new Set(MAINTAINERS.map((maintainer) => maintainer.id));
type DiscussionNode = {
  id: string;
  number: number;
  title: string;
  url: string;
  author: { databaseId?: number } | null;
};
let discussion: DiscussionNode | undefined;
let afterDiscussion: string | null = null;
do {
  const found: {
    repository: { hasDiscussionsEnabled: boolean; discussions: Page<DiscussionNode> };
  } = await graphql(
    `
      query ($owner: String!, $name: String!, $after: String) {
        repository(owner: $owner, name: $name) {
          hasDiscussionsEnabled
          discussions(first: 100, after: $after, orderBy: { field: CREATED_AT, direction: ASC }) {
            nodes {
              id
              number
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
    { owner, name, after: afterDiscussion },
  );
  if (!found.repository.hasDiscussionsEnabled) break;
  discussion = found.repository.discussions.nodes.find(
    (node) =>
      node.title.trim() === DISCUSSION_TITLE && maintainers.has(node.author?.databaseId ?? -1),
  );
  const info = found.repository.discussions.pageInfo;
  afterDiscussion = !discussion && info.hasNextPage ? info.endCursor : null;
} while (afterDiscussion);
if (!discussion) {
  console.log(`No "${DISCUSSION_TITLE}" discussion started by a maintainer: no standings.`);
  process.exit(0);
}

/** Every comment in the discussion, with all of its 👍. */
async function readComments(): Promise<RawChoiceComment[]> {
  const comments: Comment[] = [];
  let after: string | null = null;
  do {
    const data: { node: { comments: Page<Comment> } } = await graphql(
      `query($id: ID!, $after: String) {
        node(id: $id) {
          ... on Discussion {
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
      { id: discussion!.id, after },
    );
    comments.push(...data.node.comments.nodes);
    const info = data.node.comments.pageInfo;
    after = info.hasNextPage ? info.endCursor : null;
  } while (after);

  for (const comment of comments) {
    let page = comment.reactions;
    while (page.pageInfo.hasNextPage && page.pageInfo.endCursor) {
      const data: { node: { reactions: Page<Reaction> } } = await graphql(
        `query($id: ID!, $after: String) {
          node(id: $id) {
            ... on DiscussionComment {
              reactions(content: THUMBS_UP, first: 100, after: $after) { ${REACTION_FIELDS} }
            }
          }
        }`,
        { id: comment.id, after: page.pageInfo.endCursor },
      );
      page = data.node.reactions;
      comment.reactions.nodes.push(...page.nodes);
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

const root = join(import.meta.dirname, '..');
const booths = readdirSync(join(root, 'carnival', 'booths')).filter((id) =>
  existsSync(join(root, 'carnival', 'booths', id, 'booth.ts')),
);
const holdersFile = process.env.BADGE_HOLDERS_FILE;
const holders =
  holdersFile && existsSync(holdersFile)
    ? cleanHolders(JSON.parse(readFileSync(holdersFile, 'utf8')))
    : [];
const disabled = (
  JSON.parse(readFileSync(join(root, 'northpole/disabled.json'), 'utf8')) as { booths: string[] }
).booths;

let comments = await readComments();

// A comment for every new entry, while voting is open, with its owner's user id
// in the marker, so their own vote stays out even if the login changes hands.
const missing = votingClosed(new Date()) ? [] : missingEntries({ booths, holders }, comments);
let added = 0;
for (const entry of missing) {
  const user = await get<{ id: number }>(`users/${encodeURIComponent(entry.login)}`);
  if (!user) {
    console.log(`No GitHub account is ${entry.login} now: no entry for it yet.`);
    continue;
  }
  await graphql(
    `
      mutation ($id: ID!, $body: String!) {
        addDiscussionComment(input: { discussionId: $id, body: $body }) {
          comment {
            id
          }
        }
      }
    `,
    {
      id: discussion.id,
      body: entryBody(entry.category, entry.login, user.id, entry.repo, siteUrl(process.env)),
    },
  );
  added += 1;
}
if (added) comments = await readComments();

const result = standings({
  discussion: discussion.url,
  comments,
  booths,
  holders,
  disabled,
  closes: VOTING_CLOSES,
});
writeFileSync(out, JSON.stringify(result, null, 2) + '\n');
console.log(
  `Wrote ${out}: ${result.booths.length} booths and ${result.factories.length} home factories, ${added} new entries.`,
);
