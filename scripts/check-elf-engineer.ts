/**
 * Checks one Elf Engineer badge request and prints the decision as JSON, for
 * the assess-badge-request skill. It reads the issue and the participant's
 * repository through the GitHub API, and never clones or runs anything.
 *
 * Run with GITHUB_TOKEN (or GH_TOKEN), GITHUB_REPOSITORY and ISSUE_NUMBER set.
 */
import {
  decideBadge,
  FORM_FIELDS,
  freeText,
  parsePullRequest,
  parseRepository,
  type BadgeFacts,
} from './elf-engineer.ts';
import { formField } from './issue-form.ts';
import { github, repoPath, type GitHubReader } from './github-api.ts';
import { scanParticipantText } from './injection-scan.ts';

interface Repository {
  full_name: string;
  private: boolean;
  owner: { login: string; type: string };
}

/** The factory pull request the request links, when it is in a public repository GitHub has. */
async function readPull(reader: GitHubReader, facts: BadgeFacts): Promise<BadgeFacts['pull']> {
  const pullAt = parsePullRequest(facts.pullField);
  if (!pullAt) return undefined;
  // The link's repository as GitHub resolves it, which follows a rename.
  const pullRepo = await reader.get<{ full_name: string; private: boolean }>(repoPath(pullAt.repo));
  if (!pullRepo || pullRepo.private) return undefined;
  const pull = await reader.get<{ number: number; user: { login: string; type: string } }>(
    `${repoPath(pullRepo.full_name)}/pulls/${pullAt.number}`,
  );
  return (
    pull && {
      repo: pullRepo.full_name,
      number: pull.number,
      author: pull.user.login,
      authorIsBot: pull.user.type === 'Bot',
    }
  );
}

/** Fills in the facts about the participant's public repository: its owner, its factory and its count. */
async function readRepository(reader: GitHubReader, facts: BadgeFacts, repo: Repository) {
  const owner = repo.owner.login;
  facts.repo = { fullName: repo.full_name, private: repo.private, owner };
  facts.authorIsMember =
    repo.owner.type === 'Organization' &&
    (await reader.exists(
      `orgs/${encodeURIComponent(owner)}/public_members/${encodeURIComponent(facts.author)}`,
    ));
  // A directory answers with a list of its entries, so only a file counts.
  const config = await reader.get<{ type?: string } | unknown[]>(
    `${repoPath(repo.full_name)}/contents/tessl.json`,
  );
  facts.hasTesslJson = !Array.isArray(config) && config?.type === 'file';
  const pull = await readPull(reader, facts);
  if (pull) facts.pull = pull;
  const merged = await reader.get<{ total_count: number; incomplete_results: boolean }>(
    `search/issues?q=${encodeURIComponent(`repo:${repo.full_name} is:pr is:merged author:app/tessl-app`)}`,
  );
  // A partial count could give a lower tier than earned, so it decides nothing.
  if (merged?.incomplete_results) {
    throw new Error(`GitHub's search of ${repo.full_name}'s merged pull requests was incomplete`);
  }
  facts.merged = merged?.total_count ?? 0;
}

/** What the script decides about badge request `number`, with the facts it decided on. */
export async function checkBadgeRequest(reader: GitHubReader, repository: string, number: string) {
  const issue = await reader.get<{ user: { login: string }; title: string; body: string | null }>(
    `${repoPath(repository)}/issues/${number}`,
  );
  if (!issue) throw new Error(`Issue ${number} not found`);

  const body = issue.body ?? '';
  const facts: BadgeFacts = {
    author: issue.user.login,
    repoField: formField(body, FORM_FIELDS.repo),
    pullField: formField(body, FORM_FIELDS.pull),
    flaggedText: scanParticipantText(freeText(issue.title, body)).length > 0,
  };

  const named = parseRepository(facts.repoField);
  const repo = named && (await reader.get<Repository>(repoPath(named)));
  // A private repository is left out, as if GitHub couldn't find it, so nothing
  // a token that reads private repositories sees reaches the decision or its facts.
  if (repo && !repo.private) await readRepository(reader, facts, repo);
  return { decision: decideBadge(facts), facts };
}

/* v8 ignore start -- the skill's entry point: reading the environment, then printing */
if (process.argv[1]?.endsWith('check-elf-engineer.ts')) {
  const repository = process.env.GITHUB_REPOSITORY;
  const number = process.env.ISSUE_NUMBER;
  if (!repository || !number || !/^\d+$/.test(number)) {
    throw new Error('Set GITHUB_REPOSITORY and ISSUE_NUMBER');
  }
  console.log(JSON.stringify(await checkBadgeRequest(github, repository, number), null, 2));
}
/* v8 ignore stop */
