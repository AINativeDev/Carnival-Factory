/**
 * A small reader of the GitHub REST API for the badge scripts, with the token
 * from GITHUB_TOKEN or GH_TOKEN. It only ever reads.
 */
const token = process.env.GITHUB_TOKEN ?? process.env.GH_TOKEN;
const api = process.env.GITHUB_API_URL ?? 'https://api.github.com';

/** The response to GET `path`, or undefined when GitHub answers 404. Other errors throw. */
export async function get<T>(path: string): Promise<T | undefined> {
  const response = await fetch(`${api}/${path}`, {
    headers: {
      Accept: 'application/vnd.github+json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });
  if (response.status === 404) return undefined;
  if (!response.ok) throw new Error(`GET ${path} answered HTTP ${response.status}`);
  return (await response.json()) as T;
}

/** Whether GET `path` answers 2xx: for endpoints that say yes with 204 and no with 404. */
export async function exists(path: string): Promise<boolean> {
  const response = await fetch(`${api}/${path}`, {
    headers: {
      Accept: 'application/vnd.github+json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });
  if (response.status === 404) return false;
  if (!response.ok) throw new Error(`GET ${path} answered HTTP ${response.status}`);
  return true;
}

/** Every item of a list endpoint, a hundred a page. */
export async function getAll<T>(path: string): Promise<T[]> {
  const items: T[] = [];
  const join = path.includes('?') ? '&' : '?';
  for (let page = 1; ; page++) {
    const batch = (await get<T[]>(`${path}${join}per_page=100&page=${page}`)) ?? [];
    items.push(...batch);
    if (batch.length < 100) return items;
  }
}

/** A repository path for the API, each part encoded. */
export const repoPath = (repo: string) =>
  `repos/${repo.split('/').map(encodeURIComponent).join('/')}`;
