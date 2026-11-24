/**
 * Checks one Elf Engineer badge request and prints the decision as JSON, for
 * the assess-badge-request skill. It reads the issue and the participant's
 * repository through the GitHub API, and never clones or runs anything.
 *
 * Run with GITHUB_TOKEN (or GH_TOKEN), GITHUB_REPOSITORY and ISSUE_NUMBER set.
 */
import {
  decideBadge,
  formField,
  FORM_FIELDS,
  parsePullRequest,
  parseRepository,
  type BadgeFacts,
} from './elf-engineer.ts';
import { exists, get, repoPath } from './github-api.ts';

const repository = process.env.GITHUB_REPOSITORY;
const number = process.env.ISSUE_NUMBER;
if (!repository || !number || !/^\d+$/.test(number)) {
  throw new Error('Set GITHUB_REPOSITORY and ISSUE_NUMBER');
}

const issue = await get<{ user: { login: string }; body: string | null }>(
  `${repoPath(repository)}/issues/${number}`,
);
if (!issue) throw new Error(`Issue ${number} not found`);

const body = issue.body ?? '';
const facts: BadgeFacts = {
  author: issue.user.login,
  repoField: formField(body, FORM_FIELDS.repo),
  pullField: formField(body, FORM_FIELDS.pull),
};

const named = parseRepository(facts.repoField);
const repo = named
  ? await get<{ full_name: string; private: boolean; owner: { login: string; type: string } }>(
      repoPath(named),
    )
  : undefined;
if (repo) {
  const owner = repo.owner.login;
  facts.repo = { fullName: repo.full_name, private: repo.private, owner };
  facts.authorIsMember =
    repo.owner.type === 'Organization' &&
    (await exists(
      `orgs/${encodeURIComponent(owner)}/public_members/${encodeURIComponent(facts.author)}`,
    ));
  facts.hasTesslJson = await exists(`${repoPath(repo.full_name)}/contents/tessl.json`);
  const pullAt = parsePullRequest(facts.pullField);
  const pull = pullAt
    ? await get<{ number: number; user: { login: string; type: string } }>(
        `${repoPath(repo.full_name)}/pulls/${pullAt.number}`,
      )
    : undefined;
  if (pull && pullAt) {
    facts.pull = {
      repo: pullAt.repo,
      number: pull.number,
      author: pull.user.login,
      authorIsBot: pull.user.type === 'Bot',
    };
  }
  const merged = await get<{ total_count: number }>(
    `search/issues?q=${encodeURIComponent(`repo:${repo.full_name} is:pr is:merged author:app/tessl-app`)}`,
  );
  facts.merged = merged?.total_count ?? 0;
}

console.log(JSON.stringify({ decision: decideBadge(facts), facts }, null, 2));
