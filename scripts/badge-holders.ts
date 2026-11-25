/**
 * Writes the Elf Engineer badge holders to the file named by its argument, for
 * the build to bake into the page (BADGE_HOLDERS_FILE in vite.config.ts). It
 * reads the accepted badge requests, issues labelled `badge-request` and
 * `badge-granted`, and their comments, through the GitHub API.
 *
 * Run by .github/workflows/pages.yml with GITHUB_TOKEN and GITHUB_REPOSITORY set.
 */
import { writeFileSync } from 'node:fs';
import { badgeHolders, type BadgeRequestRecord } from './badge-grants.ts';
import { getAll, repoPath } from './github-api.ts';

const repository = process.env.GITHUB_REPOSITORY;
const out = process.argv[2];
if (!repository || !out) throw new Error('Set GITHUB_REPOSITORY, and name the file to write');

const issues = await getAll<BadgeRequestRecord['issue'] & { pull_request?: unknown }>(
  `${repoPath(repository)}/issues?labels=badge-request,badge-granted&state=all`,
);
const records: BadgeRequestRecord[] = [];
for (const issue of issues) {
  if (issue.pull_request) continue;
  const comments = await getAll<BadgeRequestRecord['comments'][number]>(
    `${repoPath(repository)}/issues/${issue.number}/comments`,
  );
  records.push({ issue, comments });
}

const holders = badgeHolders(records);
writeFileSync(out, JSON.stringify(holders, null, 2) + '\n');
console.log(`${holders.length} Elf Engineer badge holder(s).`);
