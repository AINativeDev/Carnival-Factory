import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { exists, get, getAll, github, graphql, need, repoPath } from './github-api';

/** Every request the scripts made, and GitHub's answers to them, in order. */
let asked: { url: string; init: RequestInit }[];
let answers: Response[];

beforeEach(() => {
  asked = [];
  answers = [];
  vi.stubEnv('GITHUB_TOKEN', undefined);
  vi.stubEnv('GH_TOKEN', undefined);
  vi.stubEnv('GITHUB_API_URL', undefined);
  vi.stubEnv('GITHUB_GRAPHQL_URL', undefined);
  vi.stubGlobal('fetch', (url: string, init: RequestInit) => {
    asked.push({ url, init });
    return Promise.resolve(answers.shift() ?? new Response('[]'));
  });
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

const json = (value: unknown, status = 200) => new Response(JSON.stringify(value), { status });
const authorization = (n: number) => new Headers(asked[n]?.init.headers).get('Authorization');

describe('reading the REST API', () => {
  it("reads GitHub's own API with the token from GITHUB_TOKEN", async () => {
    vi.stubEnv('GITHUB_TOKEN', 'deploy-token');
    vi.stubEnv('GH_TOKEN', 'cli-token');
    answers.push(json({ name: 'carnival' }));
    expect(await get('repos/o/r')).toEqual({ name: 'carnival' });
    expect(asked[0]?.url).toBe('https://api.github.com/repos/o/r');
    expect(authorization(0)).toBe('Bearer deploy-token');
  });

  it('falls back to GH_TOKEN, and to no token at all, on the address GITHUB_API_URL names', async () => {
    vi.stubEnv('GITHUB_API_URL', 'https://ghe.example.org/api/v3');
    vi.stubEnv('GH_TOKEN', 'cli-token');
    await get('repos/o/r');
    vi.stubEnv('GH_TOKEN', undefined);
    await get('repos/o/r');
    expect(asked[0]?.url).toBe('https://ghe.example.org/api/v3/repos/o/r');
    expect(authorization(0)).toBe('Bearer cli-token');
    expect(authorization(1)).toBeNull();
  });

  it('reads a 404 as nothing there, and throws on any other failure', async () => {
    answers.push(json({}, 404), json({}, 500));
    expect(await get('repos/o/gone')).toBeUndefined();
    await expect(get('repos/o/r')).rejects.toThrow('GET repos/o/r answered HTTP 500');
  });

  it('throws on a 404 for what must be there', async () => {
    answers.push(json({ number: 1 }), json({}, 404));
    expect(await need('repos/o/r/pulls/1')).toEqual({ number: 1 });
    await expect(need('repos/o/r/pulls/2')).rejects.toThrow('answered HTTP 404');
  });

  it('says whether an endpoint answers yes with 2xx or no with 404', async () => {
    answers.push(new Response(null, { status: 204 }), json({}, 404));
    expect(await exists('orgs/elves/public_members/ana')).toBe(true);
    expect(await github.exists('orgs/elves/public_members/bob')).toBe(false);
  });

  it('reads every page of a list, a hundred at a time, and a missing list as empty', async () => {
    answers.push(json(Array.from({ length: 100 }, (_, n) => n)), json([100]), json({}, 404));
    expect(await getAll('repos/o/r/issues?state=all')).toHaveLength(101);
    expect(asked.map((request) => request.url.replace('https://api.github.com/', ''))).toEqual([
      'repos/o/r/issues?state=all&per_page=100&page=1',
      'repos/o/r/issues?state=all&per_page=100&page=2',
    ]);
    expect(await github.getAll('repos/o/gone/issues')).toEqual([]);
    expect(asked[2]?.url).toMatch(/issues\?per_page=100&page=1$/);
  });

  it('encodes each part of a repository path', () => {
    expect(repoPath('o w/r?x')).toBe('repos/o%20w/r%3Fx');
  });
});

describe('graphql', () => {
  it('posts the query and its variables, and gives back the answer as it is', async () => {
    answers.push(json({ data: { viewer: null }, errors: [{ message: 'partial' }] }));
    const deadline = AbortSignal.timeout(60_000);
    const result = await graphql('query { viewer { login } }', { after: null }, deadline);
    expect(result).toEqual({ data: { viewer: null }, errors: [{ message: 'partial' }] });
    expect(asked[0]?.url).toBe('https://api.github.com/graphql');
    expect(asked[0]?.init).toMatchObject({ method: 'POST', signal: deadline });
    expect(asked[0]?.init.body).toBeTypeOf('string');
    expect(JSON.parse(asked[0]?.init.body as string)).toEqual({
      query: 'query { viewer { login } }',
      variables: { after: null },
    });
  });

  it('uses GITHUB_GRAPHQL_URL when set, and throws when the request fails', async () => {
    vi.stubEnv('GITHUB_GRAPHQL_URL', 'https://ghe.example.org/api/graphql');
    answers.push(json({}, 502));
    await expect(graphql('query { viewer { login } }', {})).rejects.toThrow('HTTP 502');
    expect(asked[0]?.url).toBe('https://ghe.example.org/api/graphql');
    expect(asked[0]?.init.signal).toBeUndefined();
  });
});
