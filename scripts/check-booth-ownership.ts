/**
 * Fails a pull request that changes files outside its owner's booth.
 *
 * Run by .github/workflows/booth-ownership.yml with GITHUB_TOKEN,
 * GITHUB_REPOSITORY and PR_NUMBER set. It only reads from the GitHub API and
 * never runs the pull request's code.
 */
import {
  filesOutsideBooth,
  isFactory,
  linkedIssue,
  boothFolder,
  levelFolder,
  approvedByMaintainer,
  boothOwner,
  isMaintainer,
  type IssueEvent,
  escapeCommand,
  type Author,
} from './ownership.ts';

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
  id: number;
  type: string;
}

const author = (user: User): Author => ({
  login: user.login,
  id: user.id,
  isBot: user.type === 'Bot',
});

const pr = await get<{ user: User; body: string | null; changed_files: number }>(`pulls/${number}`);

const files: string[] = [];
let listed = 0;
for (let page = 1; ; page++) {
  const batch = await get<{ filename: string; previous_filename?: string }[]>(
    `pulls/${number}/files?per_page=100&page=${page}`,
  );
  for (const file of batch) {
    listed++;
    files.push(file.filename);
    if (file.previous_filename) files.push(file.previous_filename);
  }
  if (batch.length < 100) break;
}

// GitHub lists at most 3,000 files of a pull request. Fail rather than pass one
// whose files were not all checked.
if (listed < pr.changed_files) {
  console.log(
    `::error title=Too many files::This pull request changes ${pr.changed_files} files and GitHub listed only ${listed}, so they can't all be checked. Split it up.`,
  );
  process.exit(1);
}

// Only the factory's pull requests take their owner from an issue, so a person's
// pull request never depends on looking one up.
const prAuthor = author(pr.user);
const issueNumber = isFactory(prAuthor) ? linkedIssue(pr.body ?? '', repository) : undefined;
const issue = issueNumber
  ? await get<{ user: User; pull_request?: unknown }>(`issues/${issueNumber}`)
  : undefined;
// The issues endpoint also returns pull requests, which are not issues.
const issueAuthor = issue && !issue.pull_request ? author(issue.user) : undefined;
const owner = boothOwner(prAuthor, issueAuthor);

// A participant's issue that a maintainer approved, by adding tessl
// themselves, may change anything, like a maintainer's own issue.
if (issueNumber && issueAuthor && !isMaintainer(issueAuthor)) {
  const events: IssueEvent[] = [];
  for (let page = 1; ; page++) {
    const batch = await get<IssueEvent[]>(`issues/${issueNumber}/events?per_page=100&page=${page}`);
    events.push(...batch);
    if (batch.length < 100) break;
  }
  if (approvedByMaintainer(events)) {
    console.log(
      `A maintainer approved #${issueNumber} for the factory, so it may change any file.`,
    );
    process.exit(0);
  }
}

if (!owner) {
  console.log(
    `::error title=No booth owner::@${pr.user.login} is not a person, and this is not a factory pull request for an issue written by a person. A factory pull request links the issue it is for with "Closes #<n>".`,
  );
  process.exit(1);
}

const outside = filesOutsideBooth(owner, files);
if (outside.length > 0) {
  for (const file of outside) {
    console.log(
      `::error file=${escapeCommand(file)},title=Outside your booth::This pull request is for @${owner.login}, who may only change files in ${boothFolder(owner.login)} and ${levelFolder(owner.login)}`,
    );
  }
  process.exit(1);
}

console.log(
  `Every change is inside the booth or level of @${owner.login}, or @${owner.login} is a maintainer.`,
);
