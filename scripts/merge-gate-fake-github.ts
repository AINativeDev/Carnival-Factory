/**
 * A scripted GitHub for the merge gate's tests. It answers the REST calls the
 * gate makes from a table of routes and records every request, so a test can
 * say what the gate read and wrote without a network or a token. Lists are
 * served a hundred a page, the way GitHub serves them.
 */

/** One request the gate made: its method, its path below the repository, and its body. */
export interface GitHubRequest {
  method: string;
  path: string;
  body: unknown;
}

/** An answer that fails with this HTTP status. */
export class HttpFailure {
  constructor(readonly status: number) {}
}

/**
 * Routes are keyed `METHOD path`, with the path as the gate writes it and
 * without `per_page` and `page`. A route's value is the answer, or a function
 * of the request that returns it. A GET with no route answers 404; a write
 * with no route succeeds with no content.
 */
export type Routes = Record<string, unknown>;

const PAGE = 100;

/** A page of a list answer: arrays, and check runs, come a hundred at a time. */
function pageOf(data: unknown, page: number): unknown {
  const slice = (items: unknown[]) => items.slice((page - 1) * PAGE, page * PAGE);
  if (Array.isArray(data)) return slice(data);
  if (data && typeof data === 'object' && 'check_runs' in data && Array.isArray(data.check_runs))
    return { ...data, check_runs: slice(data.check_runs) };
  return data;
}

/** A scripted GitHub answering from `routes`, and the requests it has had so far. */
export function scriptedGitHub(routes: Routes) {
  const requests: GitHubRequest[] = [];

  function answer(method: string, path: string, body: unknown): { status: number; data: unknown } {
    requests.push({ method, path, body });
    const [base = '', query = ''] = path.split('?');
    const params = new URLSearchParams(query);
    const page = Number(params.get('page') ?? '1');
    params.delete('page');
    params.delete('per_page');
    const rest = params.toString();
    const key = `${method} ${base}${rest ? `?${decodeURIComponent(rest)}` : ''}`;
    const route = routes[key];
    if (route === undefined) return { status: method === 'GET' ? 404 : 204, data: undefined };
    const data: unknown =
      typeof route === 'function'
        ? (route as (r: GitHubRequest) => unknown)({ method, path, body })
        : route;
    if (data instanceof HttpFailure) return { status: data.status, data: undefined };
    return { status: 200, data: pageOf(data, page) };
  }

  /** A stand-in for `fetch` that serves `<api>/repos/<repository>/<path>` from the routes. */
  function fetchFrom(api: string, repository: string) {
    const prefix = `${api}/repos/${repository}/`;
    return (url: string, init: { method: string; body?: string }) => {
      const path = url.startsWith(prefix) ? url.slice(prefix.length) : url;
      const { status, data } = answer(
        init.method,
        path,
        init.body === undefined ? undefined : JSON.parse(init.body),
      );
      return Promise.resolve(
        new Response(status === 204 || data === undefined ? null : JSON.stringify(data), {
          status,
        }),
      );
    };
  }

  /** Every request that wrote something: anything but a GET. */
  const writes = () => requests.filter((request) => request.method !== 'GET');

  return { requests, writes, fetchFrom };
}
