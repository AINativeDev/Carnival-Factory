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
 * An answer GitHub never gives, because the connection failed with this
 * error code (such as `ECONNREFUSED` or `UND_ERR_CONNECT_TIMEOUT`). `fetch`
 * rejects, as Node's does, with the code on the error's cause.
 */
export class Unreachable {
  constructor(readonly code: string) {}
}

/** Answers given one per request, in turn; the last one answers every request after. */
export class InTurn {
  constructor(readonly answers: readonly unknown[]) {}
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

  const turns = new Map<string, number>();

  /** The answer `route` gives now, taking the next of an `InTurn`'s answers. */
  function next(key: string, route: unknown): unknown {
    if (!(route instanceof InTurn)) return route;
    const turn = turns.get(key) ?? 0;
    turns.set(key, turn + 1);
    return route.answers[Math.min(turn, route.answers.length - 1)];
  }

  function answer(method: string, path: string, body: unknown): { status: number; data: unknown } {
    requests.push({ method, path, body });
    const [base = '', query = ''] = path.split('?');
    const params = new URLSearchParams(query);
    const page = Number(params.get('page') ?? '1');
    params.delete('page');
    params.delete('per_page');
    const rest = params.toString();
    const key = `${method} ${base}${rest ? `?${decodeURIComponent(rest)}` : ''}`;
    const route = next(key, routes[key]);
    if (route instanceof Unreachable) throw new TypeError('fetch failed', { cause: route });
    if (route === undefined) return { status: method === 'GET' ? 404 : 204, data: undefined };
    if (route instanceof HttpFailure) return { status: route.status, data: undefined };
    return { status: 200, data: pageOf(route, page) };
  }

  /** A stand-in for `fetch` that serves `<api>/repos/<repository>/<path>` from the routes. */
  function fetchFrom(api: string, repository: string) {
    const prefix = `${api}/repos/${repository}/`;
    // eslint-disable-next-line @typescript-eslint/require-await -- async, so an unreachable GitHub rejects as fetch does
    return async (url: string, init: { method: string; body?: string }) => {
      const path = url.slice(prefix.length);
      const { status, data } = answer(
        init.method,
        path,
        init.body === undefined ? undefined : JSON.parse(init.body),
      );
      // No data, as with a 204 or a 404, stringifies to undefined: an empty body.
      return new Response(JSON.stringify(data), { status });
    };
  }

  /** The client the gate's modules take, answering as GitHub does: data, or a thrown failure. */
  const client: GitHub = {
    // eslint-disable-next-line @typescript-eslint/require-await -- async, so every failure rejects
    async call<T>(method: string, path: string, body?: unknown) {
      const { status, data } = answer(method, path, body);
      if (status >= 400) throw new Error(`${method} ${path} answered HTTP ${String(status)}`);
      return data as T;
    },
  };

  /** Every request that wrote something: anything but a GET. */
  const writes = () => requests.filter((request) => request.method !== 'GET');

  return { requests, writes, fetchFrom, client };
}
