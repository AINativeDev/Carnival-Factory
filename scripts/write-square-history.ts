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
import { readdirSync, existsSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { siteUrl } from './share-pages.ts';
import { shapeHistory, type HistoryKind, type RawIssue, type RawPull } from './square-history.ts';

const token = process.env.GITHUB_TOKEN;
const repository = process.env.GITHUB_REPOSITORY;
if (!token || !repository) throw new Error('Set GITHUB_TOKEN and GITHUB_REPOSITORY');
const [owner, name] = repository.split('/');
const api = process.env.GITHUB_API_URL ?? 'https://api.github.com';
const out = process.argv[2] ?? 'square-history.json';
const headers = { Authorization: `Bearer ${token}`, Accept: 'application/vnd.github+json' };

// The history is optional, so the whole read gets a deadline: a slow API
// leaves the build time to publish without it.
const deadline = AbortSignal.timeout(2 * 60 * 1000);

async function graphql<T>(query: string, variables: Record<string, unknown>): Promise<T> {
  const response = await fetch(`${api}/graphql`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ query, variables }),
    signal: deadline,
  });
  if (!response.ok) throw new Error(`GraphQL answered HTTP ${response.status}`);
  const result = (await response.json()) as { data?: T; errors?: { message: string }[] };
  if (!result.data) throw new Error(`GraphQL failed: ${result.errors?.[0]?.message ?? 'no data'}`);
  return result.data;
}

interface Connection<T> {
  nodes: T[];
  pageInfo: { hasNextPage: boolean; endCursor: string | null };
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
    graphql<{ repository: { list: Connection<T> } }>(query, { owner, name, after }).then(
      (data) => data.repository.list,
    );
  return rest(await page(null), page);
}

/** The rest of one pull request's connection, after its first page. */
async function pullRest<T>(
  number: number,
  first: Connection<T>,
  connection: string,
  fields: string,
): Promise<T[]> {
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
    graphql<{ repository: { pullRequest: { list: Connection<T> } } }>(query, {
      owner,
      name,
      number,
      after,
    }).then((data) => data.repository.pullRequest.list),
  );
}

type PagedPull = Omit<RawPull, 'files' | 'reviewThreads'> & {
  files: Connection<{ path: string }> | null;
  reviewThreads: Connection<RawPull['reviewThreads']['nodes'][number]>;
};

const FILE_FIELDS = 'path';
const THREAD_FIELDS = 'isResolved comments(first: 1) { nodes { author { login } } }';

const issues = await all<RawIssue>(
  'issues',
  'number title url createdAt author { login } labels(first: 20) { nodes { name } }',
);
const paged = await all<PagedPull>(
  'pullRequests',
  `number url state mergedAt headRefName isCrossRepository commits { totalCount }
   files(first: 100) { nodes { ${FILE_FIELDS} } pageInfo { hasNextPage endCursor } }
   reviewThreads(first: 100) { nodes { ${THREAD_FIELDS} } pageInfo { hasNextPage endCursor } }`,
);
// A pull request's files and review threads can run past their first page:
// read the rest, so its squares and findings are complete.
const pulls: RawPull[] = [];
for (const pull of paged) {
  const files = pull.files && (await pullRest(pull.number, pull.files, 'files', FILE_FIELDS));
  const threads = await pullRest(pull.number, pull.reviewThreads, 'reviewThreads', THREAD_FIELDS);
  pulls.push({
    ...pull,
    files: files && { nodes: files },
    reviewThreads: { nodes: threads },
  });
}

const root = join(import.meta.dirname, '..');
const squares = (['booth', 'attraction'] as HistoryKind[]).flatMap((kind) =>
  readdirSync(join(root, `${kind}s`))
    .filter((id) => existsSync(join(root, `${kind}s`, id, `${kind}.ts`)))
    .map((id) => `${kind}/${id}`),
);

const history = shapeHistory({
  squares,
  issues,
  pulls,
  site: siteUrl(process.env),
  builtAt: new Date().toISOString(),
});
writeFileSync(out, JSON.stringify(history));
console.log(
  `Wrote ${out}: ${Object.keys(history.squares).length} squares, ${issues.length} issues, ${pulls.length} pull requests.`,
);
