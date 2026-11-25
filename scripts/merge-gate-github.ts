/**
 * The merge gate's way to GitHub: one client for the repository, passed to
 * everything that reads facts or acts on them, so the tests can hand in a
 * scripted GitHub instead (scripts/merge-gate-fake-github.ts). Also the shapes
 * of what the gate reads back.
 */

/** Calls the REST API below `repos/<repository>/`; throws unless GitHub answers 2xx. */
export interface GitHub {
  call<T>(method: string, path: string, body?: unknown): Promise<T>;
}

/** The real GitHub, with the workflow's token. */
export function githubClient(api: string, repository: string, token: string): GitHub {
  return {
    async call<T>(method: string, path: string, body?: unknown): Promise<T> {
      const response = await fetch(`${api}/repos/${repository}/${path}`, {
        method,
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/vnd.github+json',
          'Content-Type': 'application/json',
        },
        ...(body === undefined ? {} : { body: JSON.stringify(body) }),
      });
      if (!response.ok)
        throw new Error(`${method} ${path} answered HTTP ${String(response.status)}`);
      return (response.status === 204 ? undefined : await response.json()) as T;
    },
  };
}

export const get = <T>(github: GitHub, path: string) => github.call<T>('GET', path);

/** Every page of a list endpoint, so no history is cut off at 100; `stop` ends early. */
export async function getAll<T>(
  github: GitHub,
  path: string,
  stop?: (page: T[]) => boolean,
): Promise<T[]> {
  const all: T[] = [];
  for (let page = 1; ; page++) {
    const batch = await get<T[]>(
      github,
      `${path}${path.includes('?') ? '&' : '?'}per_page=100&page=${String(page)}`,
    );
    all.push(...batch);
    if (batch.length < 100 || stop?.(batch)) return all;
  }
}

export interface User {
  login: string;
  type: string;
}
export interface Label {
  name: string;
}
export interface Pull {
  number: number;
  title: string;
  body: string | null;
  user: User;
  labels: Label[];
  updated_at: string;
  merged_at: string | null;
  head: { ref: string; sha: string; repo: { full_name: string } | null };
}
export interface Issue {
  number: number;
  state: string;
  title: string;
  body: string | null;
  user: User;
  labels: Label[];
}
export interface Comment {
  id: number;
  body: string;
  user: User;
}

export const names = (labels: Label[]) => labels.map((label) => label.name);
