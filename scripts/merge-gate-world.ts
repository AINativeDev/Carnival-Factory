/**
 * The world the merge gate's tests start from: one factory pull request, #7,
 * for holly's booth, that passes every step of the gate, served by a scripted
 * GitHub. A test changes one route to make one thing go differently, then runs
 * the real gate script, scripts/auto-merge-booths.ts, against it.
 */
import { vi } from 'vitest';
import { scriptedGitHub, type Routes } from './merge-gate-fake-github.ts';

export const REPOSITORY = 'elves/carnival';
export const API = 'https://api.github.test';
/** The pull request's head commit, which every check below ran on. */
export const SHA = 'a'.repeat(40);
/** When the gate runs. */
export const NOW = new Date('2026-12-01T12:00:00Z');
export const FOLDER = 'carnival/booths/holly/';

export const minutesAgo = (minutes: number) =>
  new Date(NOW.getTime() - minutes * 60_000).toISOString();

const BOOTH = `import type { NorthPoleSquare } from '../../../src/northpole/square';
import { theme } from '../../../src/northpole/theme';
const booth: NorthPoleSquare = {
  id: 'holly', name: 'Holly', description: 'A wreath.',
  draw(ctx, size) {
    ctx.fillStyle = theme.colors.snow;
    ctx.fillRect(0, 0, size, size);
  },
};
export default booth;
`;
const base64 = (text: string) => Buffer.from(text, 'utf8').toString('base64');

/** Factory pull request #7, built from booth request #5. */
export const boothPull = (change: object = {}) => ({
  number: 7,
  title: 'Build the booth for #5',
  body: `Closes #5\n\n<!-- tessl-factory:issue: ${REPOSITORY}#5 -->`,
  user: { login: 'tessl-app[bot]', type: 'Bot' },
  labels: [] as { name: string }[],
  updated_at: minutesAgo(5),
  merged_at: null as string | null,
  head: { ref: 'tessl/issue-5', sha: SHA, repo: { full_name: REPOSITORY } },
  ...change,
});

/** Booth request #5 by holly, accepted. */
export const boothRequest = (change: object = {}) => ({
  number: 5,
  state: 'open',
  title: 'A wreath',
  body: 'A booth with a holly wreath.',
  user: { login: 'Holly', type: 'User' },
  labels: [{ name: 'booth-request' }, { name: 'tessl' }],
  ...change,
});

const check = (name: string) => ({
  name,
  status: 'completed',
  conclusion: 'success',
  started_at: minutesAgo(10),
});

/** A risk verdict comment by the factory, for `sha`. */
export const riskComment = (verdict: string, sha = SHA, login = 'tessl-app[bot]') => ({
  id: 70,
  body: `Looked at it.\n<!-- assess-booth-risk sha=${sha} verdict=${verdict} -->`,
  user: { login },
});

/** A review by the Tessl Reviewer on `sha`. */
export const review = (approved: boolean, sha = SHA, login = 'tessl-reviewer[bot]') => ({
  user: { login },
  commit_id: sha,
  body: `<!-- tessl-code-review:result:v1 approved=${String(approved)} -->`,
});

/** The routes of a GitHub where pull request #7 passes every step of the gate. */
export function mergeableBooth(): Routes {
  return {
    'GET pulls?state=open': [boothPull()],
    'GET issues/5': boothRequest(),
    'GET pulls/7/files': [{ filename: `${FOLDER}booth.ts`, status: 'modified' }],
    [`GET git/trees/${SHA}?recursive=1`]: {
      truncated: false,
      tree: [
        { path: `${FOLDER}booth.ts`, type: 'blob', sha: 'b1', mode: '100644', size: 400 },
        { path: `${FOLDER}README.md`, type: 'blob', sha: 'b2', mode: '100644' },
        { path: 'src', type: 'tree', sha: 't1', mode: '040000' },
        { path: 'src/main.ts', type: 'blob', sha: 'b3', mode: '100644', size: 9 },
      ],
    },
    'GET git/blobs/b1': { content: base64(BOOTH) },
    'GET git/blobs/b2': { content: base64('# Holly\n\nA wreath.\n') },
    [`GET commits/${SHA}/check-runs`]: {
      check_runs: ['check', 'ownership', 'build', 'smoke'].map(check),
    },
    'GET pulls/7/reviews': [review(true)],
    'GET issues/7/events': [],
    'GET issues/7/comments': [riskComment('low-risk')],
    'GET pulls?state=closed&sort=updated&direction=desc': [],
    'GET actions/workflows/pages.yml/runs?status=success': {
      workflow_runs: [{ created_at: minutesAgo(30) }],
    },
    'GET actions/workflows/pages.yml/runs?status=in_progress': { workflow_runs: [] },
  };
}

/**
 * Runs the gate script once against `routes`, as the workflow does, and
 * returns what it asked GitHub, what it printed and the exit code it set.
 */
export async function runGate(routes: Routes, { dryRun = false, token = 'token' } = {}) {
  const github = scriptedGitHub(routes);
  const logs: string[] = [];
  const errors: string[] = [];
  vi.useFakeTimers({ toFake: ['Date'], now: NOW });
  vi.stubEnv('GITHUB_TOKEN', token);
  vi.stubEnv('GITHUB_REPOSITORY', REPOSITORY);
  vi.stubEnv('GITHUB_API_URL', API);
  vi.stubEnv('DRY_RUN', dryRun ? '1' : '');
  vi.stubGlobal('fetch', github.fetchFrom(API, REPOSITORY));
  vi.spyOn(console, 'log').mockImplementation((line: string) => logs.push(line));
  vi.spyOn(console, 'error').mockImplementation((line: string) => errors.push(line));
  vi.resetModules();
  try {
    await import('./auto-merge-booths.ts');
    return { ...github, logs, errors, exitCode: process.exitCode };
  } finally {
    process.exitCode = undefined;
    vi.useRealTimers();
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  }
}
