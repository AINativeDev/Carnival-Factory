/**
 * A small reader of the GitHub API for the deploy's and the factory's scripts,
 * with the token from GITHUB_TOKEN or GH_TOKEN. It only ever reads: GETs, and
 * GraphQL queries. The token and the address are read on every request, not
 * once at import, so a test can set them.
 */

/** The REST API's address, GitHub's own unless GITHUB_API_URL names another. */
const restApi = () => process.env.GITHUB_API_URL ?? 'https://api.github.com';

function headers(): Record<string, string> {
  const token = process.env.GITHUB_TOKEN ?? process.env.GH_TOKEN;
  return {
    Accept: 'application/vnd.github+json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

/** The answer to GET `path`, when it is 2xx or 404. Anything else throws. */
async function answer(path: string): Promise<Response> {
  const response = await fetch(`${restApi()}/${path}`, { headers: headers() });
  if (!response.ok && response.status !== 404) {
    throw new Error(`GET ${path} answered HTTP ${response.status}`);
  }
  return response;
}

/** The response to GET `path`, or undefined when GitHub answers 404. Other errors throw. */
export async function get<T>(path: string): Promise<T | undefined> {
  const response = await answer(path);
  return response.status === 404 ? undefined : ((await response.json()) as T);
}

/** The response to GET `path`, for what must be there: a 404 throws like any other error. */
export async function need<T>(path: string): Promise<T> {
  const response = await answer(path);
  if (response.status === 404) throw new Error(`GET ${path} answered HTTP 404`);
  return (await response.json()) as T;
}

/** Whether GET `path` answers 2xx: for endpoints that say yes with 204 and no with 404. */
export async function exists(path: string): Promise<boolean> {
  return (await answer(path)).status !== 404;
}

/** Every item of a list endpoint, a hundred a page. A list that isn't there is empty. */
export async function getAll<T>(path: string): Promise<T[]> {
  const items: T[] = [];
  const join = path.includes('?') ? '&' : '?';
  for (let page = 1; ; page++) {
    const batch = (await get<T[]>(`${path}${join}per_page=100&page=${page}`)) ?? [];
    items.push(...batch);
    if (batch.length < 100) return items;
  }
}

/**
 * The answer to a GraphQL query, as GitHub gives it, errors and all: each
 * caller decides what a partial answer means for it. A failed request throws.
 */
export async function graphql(
  query: string,
  variables: Record<string, unknown>,
  signal?: AbortSignal,
): Promise<unknown> {
  const response = await fetch(process.env.GITHUB_GRAPHQL_URL ?? `${restApi()}/graphql`, {
    method: 'POST',
    headers: { ...headers(), 'Content-Type': 'application/json' },
    body: JSON.stringify({ query, variables }),
    ...(signal ? { signal } : {}),
  });
  if (!response.ok) throw new Error(`The GraphQL API answered HTTP ${response.status}`);
  return response.json();
}

/** Asks GitHub's GraphQL API a query: `graphql` above, or a test's stand-in for it. */
export type AskGraphQL = (query: string, variables: Record<string, unknown>) => Promise<unknown>;

/** What the scripts read GitHub through, so their tests can hand them a fake. */
export interface GitHubReader {
  get<T>(path: string): Promise<T | undefined>;
  exists(path: string): Promise<boolean>;
  getAll<T>(path: string): Promise<T[]>;
}

/** The real GitHub, through the functions above. */
export const github: GitHubReader = { get, exists, getAll };

/** A repository path for the API, each part encoded. */
export const repoPath = (repo: string) =>
  `repos/${repo.split('/').map(encodeURIComponent).join('/')}`;
