/**
 * Writes how many advent challenges each participant has had accepted to the
 * file named by its argument, for the build to bake into the page
 * (ADVENT_FILE in vite.config.ts). It reads the accepted Advent challenge
 * issues, labelled `advent-done` and `accepted`, and their comments, through
 * the GitHub API.
 *
 * Run by .github/workflows/pages.yml with GITHUB_TOKEN and GITHUB_REPOSITORY set.
 */
import { writeFileSync } from 'node:fs';
import { adventCounts, type AdventRecord } from './advent.ts';
import { getAll, repoPath } from './github-api.ts';

const repository = process.env.GITHUB_REPOSITORY;
const out = process.argv[2];
if (!repository || !out) throw new Error('Set GITHUB_REPOSITORY, and name the file to write');

const issues = await getAll<AdventRecord['issue'] & { pull_request?: unknown }>(
  `${repoPath(repository)}/issues?labels=advent-done,accepted&state=all`,
);
const records: AdventRecord[] = [];
for (const issue of issues) {
  if (issue.pull_request) continue;
  const comments = await getAll<AdventRecord['comments'][number]>(
    `${repoPath(repository)}/issues/${issue.number}/comments`,
  );
  records.push({ issue, comments });
}

const counts = adventCounts(records);
writeFileSync(out, JSON.stringify(counts, null, 2) + '\n');
console.log(`${Object.keys(counts).length} participant(s) with accepted advent challenges.`);
