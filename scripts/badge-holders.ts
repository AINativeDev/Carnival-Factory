/**
 * Writes the Elf Engineer badge holders to the file named by its argument, for
 * the build to bake into the page (BADGE_HOLDERS_FILE in vite.config.ts). It
 * reads the accepted badge requests, issues labelled `badge-request` and
 * `badge-granted`, and their comments, through the GitHub API.
 *
 * Run by .github/workflows/pages.yml with GITHUB_TOKEN and GITHUB_REPOSITORY set.
 */
import { safePath } from './safe-path.ts';
import { writeFileSync } from 'node:fs';
import { badgeHolders, type BadgeRequestRecord } from './badge-grants.ts';
import { github, repoPath, type GitHubReader } from './github-api.ts';
import type { BadgeHolder } from '../src/northpole/badges.ts';

/** The badge holders, from every accepted request in `repository` and its comments. */
export async function readBadgeHolders(
  reader: GitHubReader,
  repository: string,
): Promise<BadgeHolder[]> {
  const issues = await reader.getAll<BadgeRequestRecord['issue'] & { pull_request?: unknown }>(
    `${repoPath(repository)}/issues?labels=badge-request,badge-granted&state=all`,
  );
  const records: BadgeRequestRecord[] = [];
  // The issues endpoint lists pull requests too, which are never requests.
  for (const issue of issues.filter((listed) => !listed.pull_request)) {
    const comments = await reader.getAll<BadgeRequestRecord['comments'][number]>(
      `${repoPath(repository)}/issues/${issue.number}/comments`,
    );
    records.push({ issue, comments });
  }
  return badgeHolders(records);
}

/* v8 ignore start -- the deploy's entry point: reading the environment, then writing the file */
if (process.argv[1]?.endsWith('badge-holders.ts')) {
  const repository = process.env.GITHUB_REPOSITORY;
  const out = process.argv[2];
  if (!repository || !out) throw new Error('Set GITHUB_REPOSITORY, and name the file to write');
  const holders = await readBadgeHolders(github, repository);
  writeFileSync(safePath(out), JSON.stringify(holders, null, 2) + '\n');
  console.log(`${holders.length} Elf Engineer badge holder(s).`);
}
/* v8 ignore stop */
