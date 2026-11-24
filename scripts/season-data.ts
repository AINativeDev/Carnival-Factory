/**
 * Counts every participant's season from the repository's booth requests and
 * prints it as JSON, for the build to hand the season card (scripts/season.ts).
 *
 * Run by .github/workflows/pages.yml before the build, with GITHUB_TOKEN and
 * GITHUB_REPOSITORY set: `node scripts/season-data.ts > season.json`. It only
 * reads from the GitHub API. Without season.json the build has an empty season,
 * and every card still shows its booth.
 */
import { countSeason, type RequestRecord } from './season.ts';

const token = process.env.GITHUB_TOKEN;
const repository = process.env.GITHUB_REPOSITORY;
if (!token || !repository) throw new Error('Set GITHUB_TOKEN and GITHUB_REPOSITORY');
const [owner, name] = repository.split('/');
const api = process.env.GITHUB_GRAPHQL_URL ?? 'https://api.github.com/graphql';

const QUERY = `query($owner: String!, $name: String!, $after: String) {
  repository(owner: $owner, name: $name) {
    issues(first: 50, after: $after, labels: ["booth-request"], states: [OPEN, CLOSED]) {
      pageInfo { hasNextPage endCursor }
      nodes {
        author { login }
        number
        closedByPullRequestsReferences(first: 10, includeClosedPrs: true) {
          pageInfo { hasNextPage }
          nodes {
            number
            merged
            reviewThreads(first: 100) {
              pageInfo { hasNextPage }
              nodes { isResolved comments(first: 1) { nodes { author { login } } } }
            }
          }
        }
      }
    }
  }
}`;

interface Page {
  data?: {
    repository: {
      issues: {
        pageInfo: { hasNextPage: boolean; endCursor: string | null };
        nodes: {
          number: number;
          author: { login: string } | null;
          closedByPullRequestsReferences: {
            pageInfo: { hasNextPage: boolean };
            nodes: {
              number: number;
              merged: boolean;
              reviewThreads: {
                pageInfo: { hasNextPage: boolean };
                nodes: {
                  isResolved: boolean;
                  comments: { nodes: { author: { login: string } | null }[] };
                }[];
              };
            }[];
          };
        }[];
      };
    };
  };
  errors?: unknown[];
}

const requests: RequestRecord[] = [];
let after: string | null = null;
do {
  const response = await fetch(api, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ query: QUERY, variables: { owner, name, after } }),
  });
  if (!response.ok) throw new Error(`The GraphQL API answered HTTP ${response.status}`);
  const page = (await response.json()) as Page;
  if (!page.data)
    throw new Error(`The GraphQL API answered with errors: ${JSON.stringify(page.errors)}`);
  const { nodes, pageInfo } = page.data.repository.issues;
  for (const issue of nodes) {
    // A partial count would publish too-low numbers, so fail and let the
    // workflow fall back to the empty season instead.
    if (issue.closedByPullRequestsReferences.pageInfo.hasNextPage)
      throw new Error(`Issue #${issue.number} has more closing pull requests than one page`);
    for (const pull of issue.closedByPullRequestsReferences.nodes)
      if (pull.reviewThreads.pageInfo.hasNextPage)
        throw new Error(`Pull request #${pull.number} has more review threads than one page`);
    requests.push({
      author: issue.author?.login ?? null,
      pulls: issue.closedByPullRequestsReferences.nodes.map((pull) => ({
        number: pull.number,
        merged: pull.merged,
        threads: pull.reviewThreads.nodes.map((thread) => ({
          resolved: thread.isResolved,
          author: thread.comments.nodes[0]?.author?.login ?? null,
        })),
      })),
    });
  }
  after = pageInfo.hasNextPage ? pageInfo.endCursor : null;
} while (after);

process.stdout.write(`${JSON.stringify(countSeason(requests, new Date().toISOString()))}\n`);
