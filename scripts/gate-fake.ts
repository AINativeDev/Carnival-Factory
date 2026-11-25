/**
 * A scripted GitHub for the auto-merge gate's tests: it answers each GET from
 * a table of replies, records every write with what it sent, and can make one
 * call fail, so
 * the gate's reads and its merge are tested end to end without the network.
 * Also a level pull request that passes every step, to change one fact at a time.
 */
import type { GitHub, Issue, Pull } from './gate-github.ts';

export const SHA = 'a'.repeat(40);
export const REPOSITORY = 'north/pole';

/** A factory pull request for issue 5, from its tessl/ branch. */
export const levelPull: Pull = {
  number: 9,
  title: '#5: A cocoa stand in the level',
  body: `<!-- tessl-factory:issue: ${REPOSITORY}#5 -->\nCloses #5`,
  user: { login: 'tessl-app[bot]', type: 'Bot' },
  labels: [{ name: 'tessl' }],
  updated_at: '2026-12-01T11:00:00Z',
  merged_at: null,
  head: { ref: 'tessl/issue-5', sha: SHA, repo: { full_name: REPOSITORY } },
};

/** Elf's accepted level request. */
export const levelIssue: Issue = {
  number: 5,
  state: 'open',
  title: 'My level: a cocoa stand',
  body: 'A cocoa stand by the pond.',
  user: { login: 'Elf', type: 'User' },
  labels: [{ name: 'level-request' }, { name: 'tessl' }],
};

const LEVEL = `import type { NorthPoleLevel } from '../../../src/northpole/level';
const level: NorthPoleLevel = { id: 'elf', size: 9 };
export default level;
`;
const page = (path: string) => `${path}${path.includes('?') ? '&' : '?'}per_page=100&page=1`;

/** Every GET reply for `levelPull` passing each step of the gate, by path. */
export function passingReplies(): Map<string, unknown> {
  return new Map<string, unknown>([
    ['issues/5', levelIssue],
    [page('pulls/9/files'), [{ filename: 'carnival/levels/elf/level.ts', status: 'modified' }]],
    [
      `git/trees/${SHA}?recursive=1`,
      {
        truncated: false,
        tree: [
          {
            path: 'carnival/levels/elf/level.ts',
            type: 'blob',
            sha: 'b1',
            mode: '100644',
            size: 99,
          },
          { path: 'carnival/levels', type: 'tree', sha: 't1', mode: '040000' },
        ],
      },
    ],
    ['git/blobs/b1', { content: Buffer.from(LEVEL).toString('base64') }],
    [
      `commits/${SHA}/check-runs?per_page=100&page=1`,
      {
        check_runs: ['check', 'ownership', 'build', 'smoke'].map((name) => ({
          name,
          status: 'completed',
          conclusion: 'success',
          started_at: '2026-12-01T10:00:00Z',
        })),
      },
    ],
    [
      page('pulls/9/reviews'),
      [
        {
          user: { login: 'tessl-reviewer[bot]' },
          commit_id: SHA,
          body: '<!-- tessl-code-review:result:v1 approved=true -->',
        },
      ],
    ],
    [
      page('issues/9/comments'),
      [
        {
          id: 1,
          user: { login: 'tessl-app[bot]' },
          body: `<!-- assess-booth-risk sha=${SHA} verdict=low-risk -->`,
        },
      ],
    ],
    [page('pulls?state=closed&sort=updated&direction=desc'), []],
  ]);
}

/**
 * A GitHub that answers GETs from `replies` and records every other call:
 * `writes` by method and path, and `sent` with its body too, so a test can
 * tell a merge's sha or a needs-human label from any other; `fail` makes one throw.
 */
export function fakeGitHub(replies: Map<string, unknown>, fail?: string) {
  const writes: string[] = [];
  const sent: { write: string; body: unknown }[] = [];
  const github: GitHub = {
    repository: REPOSITORY,
    dryRun: false,
    call<T>(method: string, path: string, body?: unknown): Promise<T> {
      const key = `${method} ${path}`;
      if (key === fail) return Promise.reject(new Error(`${key} answered HTTP 500`));
      if (method !== 'GET') {
        writes.push(key);
        sent.push({ write: key, body });
        return Promise.resolve(undefined as T);
      }
      if (!replies.has(path)) return Promise.reject(new Error(`no reply for GET ${path}`));
      return Promise.resolve(replies.get(path) as T);
    },
  };
  return { github, writes, sent };
}
