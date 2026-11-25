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

/** How long to wait before the second and the third try of a request GitHub failed for now. */
export const RETRY_WAITS = [1000, 3000];

/** GitHub's answers that mean "not now", which a later try may get past. */
const TEMPORARY = new Set([502, 503, 504]);

/**
 * Node's codes for a connection that never carried the request, so GitHub
 * cannot have acted on it. Any other broken connection may have.
 */
const NEVER_SENT = new Set<unknown>([
  'ECONNREFUSED',
  'ENOTFOUND',
  'EAI_AGAIN',
  'ENETUNREACH',
  'EHOSTUNREACH',
  'UND_ERR_CONNECT_TIMEOUT',
]);

/** Waits `ms` milliseconds: the real wait between tries. */
export const pause = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

/** The code on a failed `fetch`'s cause, where Node says why the connection broke. */
function connectionCode(error: unknown): unknown {
  const cause = error instanceof Error ? error.cause : undefined;
  return cause && typeof cause === 'object' && 'code' in cause ? cause.code : undefined;
}

/**
 * The real GitHub, with the workflow's token. A request GitHub answers 502,
 * 503 or 504, or whose connection fails, is tried up to three times in all,
 * after `wait`s that grow, so one passing failure doesn't stop the round. A
 * merge is tried again only when it never reached GitHub: after an answer, or
 * a connection that broke once sent, it may have merged.
 */
export function githubClient(
  api: string,
  repository: string,
  token: string,
  wait: (ms: number) => Promise<void> = pause,
): GitHub {
  async function attempt(method: string, path: string, body: unknown) {
    const merge = method === 'PUT' && /^pulls\/\d+\/merge$/.test(path);
    let response: Response;
    try {
      response = await fetch(`${api}/repos/${repository}/${path}`, {
        method,
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/vnd.github+json',
          'Content-Type': 'application/json',
        },
        ...(body === undefined ? {} : { body: JSON.stringify(body) }),
      });
    } catch (error) {
      const retry = !merge || NEVER_SENT.has(connectionCode(error));
      return { retry, error: new Error(`${method} ${path} failed: ${String(error)}`) };
    }
    if (response.ok) return { response };
    const error = new Error(`${method} ${path} answered HTTP ${String(response.status)}`);
    return { retry: !merge && TEMPORARY.has(response.status), error };
  }

  return {
    async call<T>(method: string, path: string, body?: unknown): Promise<T> {
      for (let tries = 0; ; tries++) {
        const { response, retry, error } = await attempt(method, path, body);
        if (response) return (response.status === 204 ? undefined : await response.json()) as T;
        const before = RETRY_WAITS.at(tries);
        if (!retry || before === undefined) throw error;
        await wait(before);
      }
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
