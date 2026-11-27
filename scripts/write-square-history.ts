/**
 * Writes square-history.json, every square's history (scripts/square-history.ts),
 * for the build to put in the page.
 *
 * Run by "Deploy to GitHub Pages", which only runs main's own code, with
 * GITHUB_TOKEN and GITHUB_REPOSITORY set, before `npm run build`. "Preview
 * build" runs a pull request's code, so it never runs this with a token, and
 * previews have no history. It only reads public issues
 * and pull requests from the GitHub API. The page itself never reaches the
 * network: the build bundles the file.
 */
import { safePath } from './safe-path.ts';
import { writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { siteUrl } from './share-pages.ts';
import { factoryStats } from './factory-stats.ts';
import { graphql, type AskGraphQL } from './github-api.ts';
import type { RawIssue, RawPull } from './github-requests.ts';
import { shapeHistory, type SquareHistory } from './square-history.ts';
import { squaresOnDisk } from './history-squares.ts';

interface Connection<T> {
  nodes: T[];
  pageInfo: { hasNextPage: boolean; endCursor: string | null };
}

type PagedPull = Omit<RawPull, 'files' | 'reviewThreads'> & {
  files: Connection<{ path: string }> | null;
  reviewThreads: Connection<RawPull['reviewThreads']['nodes'][number]>;
};

const FILE_FIELDS = 'path';
const THREAD_FIELDS = 'isResolved comments(first: 1) { nodes { author { login } } }';
const ISSUE_FIELDS = `number title url createdAt author { login } labels(first: 20) { nodes { name } }
   timelineItems(itemTypes: [LABELED_EVENT], first: 50) {
     nodes { ... on LabeledEvent { createdAt label { name } } }
   }`;
const PULL_FIELDS = `number url state mergedAt headRefName isCrossRepository commits { totalCount }
   labels(first: 20) { nodes { name } }
   files(first: 100) { nodes { ${FILE_FIELDS} } pageInfo { hasNextPage endCursor } }
   reviewThreads(first: 100) { nodes { ${THREAD_FIELDS} } pageInfo { hasNextPage endCursor } }`;

/** A query's data; an answer without any throws, with GitHub's first error when it gave one. */
async function dataOf<T>(ask: AskGraphQL, query: string, variables: Record<string, unknown>) {
  const result = (await ask(query, variables)) as { data?: T; errors?: { message: string }[] };
  if (!result.data) throw new Error(`GraphQL failed: ${result.errors?.[0]?.message ?? 'no data'}`);
  return result.data;
}

/** Every node of a connection, from its first page on, reading the rest a page at a time. */
async function rest<T>(
  first: Connection<T>,
  next: (after: string) => Promise<Connection<T>>,
): Promise<T[]> {
  const nodes = [...first.nodes];
  let page = first;
  while (page.pageInfo.hasNextPage && page.pageInfo.endCursor) {
    page = await next(page.pageInfo.endCursor);
    nodes.push(...page.nodes);
  }
  return nodes;
}

/** The issues and pull requests of `owner`/`name`, every page of them, as the history needs them. */
export async function readRequests(
  ask: AskGraphQL,
  owner: string,
  name: string,
): Promise<{ issues: RawIssue[]; pulls: RawPull[] }> {
  /** Every node of a paginated connection on the repository. */
  async function all<T>(connection: string, fields: string): Promise<T[]> {
    const query = `query($owner: String!, $name: String!, $after: String) {
    repository(owner: $owner, name: $name) {
      list: ${connection}(first: 50, after: $after) {
        nodes { ${fields} }
        pageInfo { hasNextPage endCursor }
      }
    }
  }`;
    const page = (after: string | null) =>
      dataOf<{ repository: { list: Connection<T> } }>(ask, query, { owner, name, after }).then(
        (data) => data.repository.list,
      );
    return rest(await page(null), page);
  }

  /** The rest of one pull request's connection, after its first page. */
  function pullRest<T>(number: number, first: Connection<T>, connection: string, fields: string) {
    const query = `query($owner: String!, $name: String!, $number: Int!, $after: String) {
    repository(owner: $owner, name: $name) {
      pullRequest(number: $number) {
        list: ${connection}(first: 100, after: $after) {
          nodes { ${fields} }
          pageInfo { hasNextPage endCursor }
        }
      }
    }
  }`;
    return rest(first, (after) =>
      dataOf<{ repository: { pullRequest: { list: Connection<T> } } }>(ask, query, {
        owner,
        name,
        number,
        after,
      }).then((data) => data.repository.pullRequest.list),
    );
  }

  const issues = await all<RawIssue>('issues', ISSUE_FIELDS);
  const paged = await all<PagedPull>('pullRequests', PULL_FIELDS);
  // A pull request's files and review threads can run past their first page:
  // read the rest, so its squares and findings are complete.
  const pulls: RawPull[] = [];
  for (const pull of paged) {
    const files = pull.files && (await pullRest(pull.number, pull.files, 'files', FILE_FIELDS));
    const threads = await pullRest(pull.number, pull.reviewThreads, 'reviewThreads', THREAD_FIELDS);
    pulls.push({ ...pull, files: files && { nodes: files }, reviewThreads: { nodes: threads } });
  }
  return { issues, pulls };
}

/** Every square's history, with the factory's numbers for the #/factory page: only numbers and dates. */
export function historyOf(
  requests: { issues: RawIssue[]; pulls: RawPull[] },
  squares: string[],
  site: string | undefined,
  builtAt: string,
): SquareHistory {
  const history = shapeHistory({ squares, ...requests, site, builtAt });
  history.factory = factoryStats(requests.issues, requests.pulls, builtAt);
  return history;
}

/* v8 ignore start -- the deploy's entry point: reading the environment, then writing the file */
if (process.argv[1]?.endsWith('write-square-history.ts')) {
  const repository = process.env.GITHUB_REPOSITORY;
  if (!process.env.GITHUB_TOKEN || !repository) {
    throw new Error('Set GITHUB_TOKEN and GITHUB_REPOSITORY');
  }
  const [owner = '', name = ''] = repository.split('/');
  const out = process.argv[2] ?? 'square-history.json';
  // The history is optional, so the whole read gets a deadline: a slow API
  // leaves the build time to publish without it.
  const deadline = AbortSignal.timeout(2 * 60 * 1000);
  const requests = await readRequests((q, v) => graphql(q, v, deadline), owner, name);
  const squares = squaresOnDisk(join(import.meta.dirname, '..'));
  const history = historyOf(requests, squares, siteUrl(process.env), new Date().toISOString());
  writeFileSync(safePath(out), JSON.stringify(history));
  console.log(
    `Wrote ${out}: ${Object.keys(history.squares).length} squares, ${requests.issues.length} issues, ${requests.pulls.length} pull requests.`,
  );
}
/* v8 ignore stop */
