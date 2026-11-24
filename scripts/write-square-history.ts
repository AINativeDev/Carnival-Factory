/**
 * Writes square-history.json, every square's history (scripts/square-history.ts),
 * for the build to put in the page.
 *
 * Run by "Deploy to GitHub Pages" and "Preview build" with GITHUB_TOKEN and
 * GITHUB_REPOSITORY set, before `npm run build`. It only reads public issues
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

async function graphql<T>(query: string, variables: Record<string, unknown>): Promise<T> {
  const response = await fetch(`${api}/graphql`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ query, variables }),
  });
  if (!response.ok) throw new Error(`GraphQL answered HTTP ${response.status}`);
  const result = (await response.json()) as { data?: T; errors?: { message: string }[] };
  if (!result.data) throw new Error(`GraphQL failed: ${result.errors?.[0]?.message ?? 'no data'}`);
  return result.data;
}

interface Page<T> {
  repository: {
    list: { nodes: T[]; pageInfo: { hasNextPage: boolean; endCursor: string | null } };
  };
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
  const nodes: T[] = [];
  let after: string | null = null;
  do {
    const page: Page<T> = await graphql<Page<T>>(query, { owner, name, after });
    nodes.push(...page.repository.list.nodes);
    after = page.repository.list.pageInfo.hasNextPage
      ? page.repository.list.pageInfo.endCursor
      : null;
  } while (after);
  return nodes;
}

const issues = await all<RawIssue>(
  'issues',
  'number title url createdAt author { login } labels(first: 20) { nodes { name } }',
);
const pulls = await all<RawPull>(
  'pullRequests',
  `number url state mergedAt headRefName isCrossRepository commits { totalCount }
   files(first: 100) { nodes { path } }
   reviewThreads(first: 50) { nodes { isResolved comments(first: 1) { nodes { author { login } } } } }`,
);

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
