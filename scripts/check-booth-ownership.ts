/**
 * Fails a pull request that changes files outside its owner's booth.
 *
 * Run by .github/workflows/booth-ownership.yml with GITHUB_TOKEN,
 * GITHUB_REPOSITORY and PR_NUMBER set. It only reads from the GitHub API and
 * never runs the pull request's code.
 */
import { need, repoPath } from './github-api.ts';
import {
  filesOutsideBooth,
  isDependencyUpdate,
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

/** Reads a path under the repository from the API; anything but a 2xx throws. */
type Read = <T>(path: string) => Promise<T>;

interface User {
  login: string;
  id: number;
  type: string;
}

/** What the check prints, and whether it fails the pull request. */
export interface Verdict {
  lines: string[];
  failed: boolean;
}

const author = (user: User): Author => ({
  login: user.login,
  id: user.id,
  isBot: user.type === 'Bot',
});

/** Every item of a list under the repository, a hundred a page. */
async function allPages<T>(read: Read, path: string): Promise<T[]> {
  const items: T[] = [];
  for (let page = 1; ; page++) {
    const batch = await read<T[]>(`${path}?per_page=100&page=${page}`);
    items.push(...batch);
    if (batch.length < 100) return items;
  }
}

/** Whether pull request `number` in `repository` changes only what its owner may change. */
export async function ownershipVerdict(
  read: Read,
  repository: string,
  number: string,
): Promise<Verdict> {
  const pr = await read<{ user: User; body: string | null; changed_files: number }>(
    `pulls/${number}`,
  );
  const listed = await allPages<{ filename: string; previous_filename?: string }>(
    read,
    `pulls/${number}/files`,
  );
  // A renamed file counts at its old path as well as its new one.
  const files = listed.flatMap((file) =>
    file.previous_filename ? [file.filename, file.previous_filename] : [file.filename],
  );

  // GitHub lists at most 3,000 files of a pull request. Fail rather than pass one
  // whose files were not all checked.
  if (listed.length < pr.changed_files) {
    return {
      lines: [
        `::error title=Too many files::This pull request changes ${pr.changed_files} files and GitHub listed only ${listed.length}, so they can't all be checked. Split it up.`,
      ],
      failed: true,
    };
  }

  // Only the factory's pull requests take their owner from an issue, so a person's
  // pull request never depends on looking one up.
  const prAuthor = author(pr.user);
  const issueNumber = isFactory(prAuthor) ? linkedIssue(pr.body ?? '', repository) : undefined;
  const issue = issueNumber
    ? await read<{ user: User; pull_request?: unknown }>(`issues/${issueNumber}`)
    : undefined;
  // The issues endpoint also returns pull requests, which are not issues.
  const issueAuthor = issue && !issue.pull_request ? author(issue.user) : undefined;
  const owner = boothOwner(prAuthor, issueAuthor);

  // A participant's issue that a maintainer approved, by adding tessl
  // themselves, may change anything, like a maintainer's own issue.
  if (
    issueNumber &&
    issueAuthor &&
    !isMaintainer(issueAuthor) &&
    approvedByMaintainer(await allPages<IssueEvent>(read, `issues/${issueNumber}/events`))
  ) {
    return {
      lines: [`A maintainer approved #${issueNumber} for the factory, so it may change any file.`],
      failed: false,
    };
  }

  if (isDependencyUpdate(prAuthor, files)) {
    return {
      lines: [
        'Dependabot changes only the packages and the workflows, for a maintainer to review.',
      ],
      failed: false,
    };
  }

  if (!owner) {
    return {
      lines: [
        `::error title=No booth owner::@${pr.user.login} is not a person, and this is not a factory pull request for an issue written by a person. A factory pull request links the issue it is for with "Closes #<n>".`,
      ],
      failed: true,
    };
  }

  const outside = filesOutsideBooth(owner, files);
  if (outside.length > 0) {
    return {
      lines: outside.map(
        (file) =>
          `::error file=${escapeCommand(file)},title=Outside your booth::This pull request is for @${owner.login}, who may only change files in ${boothFolder(owner.login)} and ${levelFolder(owner.login)}`,
      ),
      failed: true,
    };
  }
  return {
    lines: [
      `Every change is inside the booth or level of @${owner.login}, or @${owner.login} is a maintainer.`,
    ],
    failed: false,
  };
}

/* v8 ignore start -- the workflow's entry point: reading the environment, printing, then exiting */
if (process.argv[1]?.endsWith('check-booth-ownership.ts')) {
  const repository = process.env.GITHUB_REPOSITORY;
  const number = process.env.PR_NUMBER;
  if (!process.env.GITHUB_TOKEN || !repository || !number) {
    throw new Error('Set GITHUB_TOKEN, GITHUB_REPOSITORY and PR_NUMBER');
  }
  const read: Read = (path) => need(`${repoPath(repository)}/${path}`);
  const verdict = await ownershipVerdict(read, repository, number);
  for (const line of verdict.lines) console.log(line);
  process.exit(verdict.failed ? 1 : 0);
}
/* v8 ignore stop */
