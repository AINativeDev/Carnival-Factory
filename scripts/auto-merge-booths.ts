/**
 * The auto-merge gate. For each open factory pull request built from a booth
 * or level request (ADR 0031), it gathers the facts, runs the deterministic
 * checks, keeps one checklist comment up to date, and merges only when
 * `evaluateGate` says so.
 *
 * Run by .github/workflows/auto-merge-booths.yml from main's own code, with
 * GITHUB_TOKEN and GITHUB_REPOSITORY set. It reads the pull request's files as
 * text through the API and never checks out or runs its code. DRY_RUN=1 only
 * prints what it would do.
 */
import { getAll, type GitHub, type Pull } from './gate-github.ts';
import { publishIfBehind } from './gate-publish.ts';
import { gatePull } from './gate-pull.ts';

const token = process.env.GITHUB_TOKEN;
const repository = process.env.GITHUB_REPOSITORY;
if (!token || !repository) throw new Error('Set GITHUB_TOKEN and GITHUB_REPOSITORY');
const dryRun = process.env.DRY_RUN === '1';
const api = process.env.GITHUB_API_URL ?? 'https://api.github.com';
const FACTORY = 'tessl-app[bot]';
const GUIDE = `https://github.com/${repository}/blob/main/docs/how-it-works.md`;

async function call<T>(method: string, path: string, body?: unknown): Promise<T> {
  const response = await fetch(`${api}/repos/${repository}/${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/vnd.github+json',
      'Content-Type': 'application/json',
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  if (!response.ok) throw new Error(`${method} ${path} answered HTTP ${response.status}`);
  return (response.status === 204 ? undefined : await response.json()) as T;
}
const github: GitHub = { repository, dryRun, call };

let merged = false;
/** Factory pull requests with needs-human, which puts their booth's site at "Waiting for a maintainer". */
const held = new Set<number>();

const pulls = await getAll<Pull>(github, 'pulls?state=open');
for (const pull of pulls) {
  const fromFactory =
    pull.user.login === FACTORY &&
    pull.head.ref.startsWith('tessl/') &&
    pull.head.repo?.full_name === repository;
  if (!fromFactory) continue;
  try {
    const outcome = await gatePull(github, pull, GUIDE);
    merged ||= outcome.merged;
    if (outcome.held) held.add(pull.number);
  } catch (error) {
    console.error(`#${pull.number}: ${String(error)}`);
    process.exitCode = 1;
  }
}
await publishIfBehind(github, merged, held);
