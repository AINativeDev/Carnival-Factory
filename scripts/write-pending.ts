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
import { boothPlotNumbers, readPlotFile, type PlotFile } from '../northpole/plots.ts';
import { getAll, get, repoPath } from './github-api.ts';
import { checksOf, latestRequests, pendingList, type Request } from './pending.ts';

const repository = process.env.GITHUB_REPOSITORY;
if (!repository) throw new Error('Set GITHUB_TOKEN and GITHUB_REPOSITORY');
const out = process.argv[2] ?? 'public/pending.json';
const repo = repoPath(repository);
const owner = repository.split('/')[0];

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

// Every booth's plot, as the build works it out.
const root = join(import.meta.dirname, '..');
const pins = JSON.parse(readFileSync(join(root, 'northpole/plots.json'), 'utf8')) as {
  booths: Record<string, number>;
};
const ids = readdirSync(join(root, 'carnival', 'booths'))
  .filter((id) => existsSync(join(root, 'carnival', 'booths', id, 'booth.ts')))
  .sort();
const files: Record<string, PlotFile> = {};
for (const id of ids) {
  const file = join(root, 'carnival', 'booths', id, 'plot.json');
  if (!existsSync(file)) continue;
  try {
    const plot = readPlotFile(JSON.parse(readFileSync(file, 'utf8')));
    if (plot) files[id] = plot;
  } catch {
    // An unreadable plot.json counts as none, as on the map.
  }
}
const booths = boothPlotNumbers(ids, pins.booths, files);

const issues = await getAll<Issue>(`${repo}/issues?state=open&labels=booth-request,tessl`);
// Only the requests pending.json can list need their pull request and checks.
const chosen = latestRequests(
  issues
    .filter((issue) => !issue.pull_request && issue.user?.type === 'User')
    .map((issue) => ({ login: issue.user!.login, issue: issue.number, labels: issue.labels })),
);

async function requestOf({ login, issue, labels }: (typeof chosen)[number]): Promise<Request> {
  const branch = encodeURIComponent(`${owner}:tessl/issue-${issue}`);
  const [pull] = (await get<Pull[]>(`${repo}/pulls?state=open&head=${branch}`)) ?? [];
  const request: Request = { login, issue, labels: labels.map((label) => label.name) };
  if (pull && pull.head.repo?.full_name === repository) {
    const { check_runs: runs } = (await get<{
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

const pending = pendingList(requests, booths);
writeFileSync(out, `${JSON.stringify(pending, null, 2)}\n`);
console.log(`Wrote ${pending.length} pending booth request(s) to ${out}.`);
