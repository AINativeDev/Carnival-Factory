import type { GitHub } from './merge-gate-github.ts';

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
 * without `per_page` and `page`. A route's value is the answer. A GET with no
 * route answers 404; a write with no route succeeds with no content.
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
    if (route instanceof HttpFailure) return { status: route.status, data: undefined };
    return { status: 200, data: pageOf(route, page) };
  }

  /** A stand-in for `fetch` that serves `<api>/repos/<repository>/<path>` from the routes. */
  function fetchFrom(api: string, repository: string) {
    const prefix = `${api}/repos/${repository}/`;
    return (url: string, init: { method: string; body?: string }) => {
      const path = url.slice(prefix.length);
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

  /** The client the gate's modules take, answering as GitHub does: data, or a thrown failure. */
  const client: GitHub = {
    call<T>(method: string, path: string, body?: unknown) {
      const { status, data } = answer(method, path, body);
      if (status >= 400)
        return Promise.reject(new Error(`${method} ${path} answered HTTP ${String(status)}`));
      return Promise.resolve(data as T);
    },
  };

  /** Every request that wrote something: anything but a GET. */
  const writes = () => requests.filter((request) => request.method !== 'GET');

  return { requests, writes, fetchFrom, client };
}
