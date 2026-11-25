/**
 * Writes pending.json, the booth requests being built (scripts/pending.ts),
 * for the page to show their construction sites.
 *
 * Run by "Deploy to GitHub Pages", which only runs main's own code, with
 * GITHUB_TOKEN and GITHUB_REPOSITORY set, before `npm run build`, which copies
 * public/pending.json beside the page. It only reads the open issues labelled
 * `booth-request` and `tessl`, and their pull requests' checks, from the
 * GitHub API. Nothing it works out is ever committed: every deploy works the
 * plots out again. Without it, the build writes an empty list.
 */
import { existsSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { boothPlotNumbers, readPlotFile, type PlotFile } from '../src/northpole/plots.ts';
import { github, repoPath, type GitHubReader } from './github-api.ts';
import { checksOf, latestRequests, pendingList, type Request } from './pending.ts';

interface Issue {
  number: number;
  user: { login: string; type: string } | null;
  labels: { name: string }[];
  pull_request?: unknown;
}
interface Pull {
  head: { sha: string; repo: { full_name: string } | null };
  labels: { name: string }[];
}

/** A booth's own plot.json, or none when it has none or it can't be read, as on the map. */
function plotFileOf(file: string): PlotFile | undefined {
  try {
    return readPlotFile(JSON.parse(readFileSync(file, 'utf8')));
  } catch {
    return undefined;
  }
}

/** Every booth's plot in the checkout at `root`, as the build works it out. */
export function boothPlots(root: string): Map<string, number> {
  const pins = JSON.parse(readFileSync(join(root, 'src/northpole/plots.json'), 'utf8')) as {
    booths: Record<string, number>;
  };
  const ids = readdirSync(join(root, 'carnival', 'booths'))
    .filter((id) => existsSync(join(root, 'carnival', 'booths', id, 'booth.ts')))
    .sort();
  const files: Record<string, PlotFile> = {};
  for (const id of ids) {
    const plot = plotFileOf(join(root, 'carnival', 'booths', id, 'plot.json'));
    if (plot) files[id] = plot;
  }
  return boothPlotNumbers(ids, pins.booths, files);
}

/** Each login's latest open, accepted booth request in `repository`, with its pull request's stage. */
export async function pendingRequests(
  reader: GitHubReader,
  repository: string,
): Promise<Request[]> {
  const repo = repoPath(repository);
  const owner = repository.slice(0, repository.indexOf('/'));
  const issues = await reader.getAll<Issue>(`${repo}/issues?state=open&labels=booth-request,tessl`);
  // Only the requests pending.json can list need their pull request and checks.
  const chosen = latestRequests(
    issues.flatMap((issue) =>
      !issue.pull_request && issue.user?.type === 'User'
        ? [{ login: issue.user.login, issue: issue.number, labels: issue.labels }]
        : [],
    ),
  );

  async function requestOf({ login, issue, labels }: (typeof chosen)[number]): Promise<Request> {
    const branch = encodeURIComponent(`${owner}:tessl/issue-${issue}`);
    const pulls = (await reader.get<Pull[]>(`${repo}/pulls?state=open&head=${branch}`)) ?? [];
    const pull = pulls.at(0);
    const request: Request = { login, issue, labels: labels.map((label) => label.name) };
    // Only a pull request from the repository's own branch is the factory's.
    if (pull?.head.repo?.full_name === repository) {
      const { check_runs: runs } = (await reader.get<{
        check_runs: { status: string; conclusion: string | null }[];
      }>(`${repo}/commits/${pull.head.sha}/check-runs?per_page=100`)) ?? { check_runs: [] };
      request.pull = { labels: pull.labels.map((label) => label.name), checks: checksOf(runs) };
    }
    return request;
  }

  // A few at a time, so a hundred requests still fit well inside the step's deadline.
  const requests: Request[] = [];
  for (let n = 0; n < chosen.length; n += 10) {
    requests.push(...(await Promise.all(chosen.slice(n, n + 10).map(requestOf))));
  }
  return requests;
}

/* v8 ignore start -- the deploy's entry point: reading the environment, then writing the file */
if (process.argv[1]?.endsWith('write-pending.ts')) {
  const repository = process.env.GITHUB_REPOSITORY;
  if (!repository) throw new Error('Set GITHUB_TOKEN and GITHUB_REPOSITORY');
  const out = process.argv[2] ?? 'public/pending.json';
  const booths = boothPlots(join(import.meta.dirname, '..'));
  const pending = pendingList(await pendingRequests(github, repository), booths);
  writeFileSync(out, `${JSON.stringify(pending, null, 2)}\n`);
  console.log(`Wrote ${pending.length} pending booth request(s) to ${out}.`);
}
/* v8 ignore stop */
