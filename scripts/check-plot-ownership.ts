/**
 * Fails a pull request that changes files outside its owner's plot.
 *
 * Run by .github/workflows/plot-ownership.yml with GITHUB_TOKEN,
 * GITHUB_REPOSITORY and PR_NUMBER set. It only reads from the GitHub API and
 * never runs the pull request's code.
 */
import { filesOutsidePlot, linkedIssue, plotFolder, plotOwner, type Author } from './ownership.ts';

const token = process.env.GITHUB_TOKEN;
const repository = process.env.GITHUB_REPOSITORY;
const number = process.env.PR_NUMBER;
if (!token || !repository || !number) {
  throw new Error('Set GITHUB_TOKEN, GITHUB_REPOSITORY and PR_NUMBER');
}

const api = process.env.GITHUB_API_URL ?? 'https://api.github.com';

async function get<T>(path: string): Promise<T> {
  const response = await fetch(`${api}/repos/${repository}/${path}`, {
    headers: { Authorization: `Bearer ${token}`, Accept: 'application/vnd.github+json' },
  });
  if (!response.ok) throw new Error(`GET ${path} answered HTTP ${response.status}`);
  return (await response.json()) as T;
}

interface User {
  login: string;
  type: string;
}

const author = (user: User): Author => ({ login: user.login, isBot: user.type === 'Bot' });

const pr = await get<{ user: User; body: string | null }>(`pulls/${number}`);

const files: string[] = [];
for (let page = 1; ; page++) {
  const batch = await get<{ filename: string; previous_filename?: string }[]>(
    `pulls/${number}/files?per_page=100&page=${page}`,
  );
  for (const file of batch) {
    files.push(file.filename);
    if (file.previous_filename) files.push(file.previous_filename);
  }
  if (batch.length < 100) break;
}

const issueNumber = linkedIssue(pr.body ?? '', repository);
const issue = issueNumber ? await get<{ user: User }>(`issues/${issueNumber}`) : undefined;
const owner = plotOwner(author(pr.user), issue && author(issue.user));

if (!owner) {
  console.log(
    `::error title=No plot owner::@${pr.user.login} is a bot, and this pull request links no issue written by a person. Link the issue it is for with "Closes #<n>".`,
  );
  process.exit(1);
}

const outside = filesOutsidePlot(owner, files);
if (outside.length > 0) {
  for (const file of outside) {
    console.log(
      `::error file=${file},title=Outside your plot::This pull request is for @${owner}, who may only change files in ${plotFolder(owner)}`,
    );
  }
  process.exit(1);
}

console.log(`Every change is inside the plot of @${owner}, or @${owner} is a maintainer.`);
