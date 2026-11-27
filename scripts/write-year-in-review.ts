/**
 * Writes the Year in Review's accepted answers (scripts/year-in-review.ts) to
 * the file named by its argument, for the build to bake into the page
 * (YEAR_IN_REVIEW_FILE, scripts/build-data.ts). It reads the issues labelled
 * `year-in-review-accepted` through GitHub's GraphQL API, with when each was
 * accepted and last edited. The page never reaches the network.
 *
 * Run by .github/workflows/pages.yml with GITHUB_TOKEN and GITHUB_REPOSITORY set.
 */
import { safePath } from './safe-path.ts';
import { writeFileSync } from 'node:fs';
import { graphql, type AskGraphQL } from './github-api.ts';
import { ACCEPTED_LABEL, yearInReview, type RawYearIssue } from './year-in-review.ts';

/** The most pages read: fifty answers a page, a thousand in all, newest first. */
const MAX_PAGES = 20;

const QUERY = `query($owner: String!, $name: String!, $after: String, $label: String!) {
  repository(owner: $owner, name: $name) {
    issues(first: 50, after: $after, labels: [$label], orderBy: { field: CREATED_AT, direction: DESC }) {
      nodes {
        number createdAt lastEditedAt body author { login }
        labels(first: 20) { nodes { name } }
        timelineItems(itemTypes: [LABELED_EVENT], last: 20) {
          nodes { ... on LabeledEvent { createdAt label { name } } }
        }
      }
      pageInfo { hasNextPage endCursor }
    }
  }
}`;

interface Page {
  nodes: RawYearIssue[];
  pageInfo: { hasNextPage: boolean; endCursor: string | null };
}

/** Every accepted Year in Review issue of `owner`/`name`, a page at a time. An answer without data throws. */
export async function readYearIssues(
  ask: AskGraphQL,
  owner: string,
  name: string,
): Promise<RawYearIssue[]> {
  const issues: RawYearIssue[] = [];
  let after: string | null = null;
  for (let page = 0; page < MAX_PAGES; page++) {
    const result = (await ask(QUERY, { owner, name, after, label: ACCEPTED_LABEL })) as {
      data?: { repository?: { issues?: Page } | null };
      errors?: { message: string }[];
    };
    const list = result.data?.repository?.issues;
    if (!list) throw new Error(`GraphQL failed: ${result.errors?.[0]?.message ?? 'no data'}`);
    issues.push(...list.nodes);
    if (!list.pageInfo.hasNextPage || !list.pageInfo.endCursor) break;
    after = list.pageInfo.endCursor;
  }
  return issues;
}

/* v8 ignore start -- the deploy's entry point: reading the environment, then writing the file */
if (process.argv[1]?.endsWith('write-year-in-review.ts')) {
  const repository = process.env.GITHUB_REPOSITORY;
  const out = process.argv[2];
  if (!process.env.GITHUB_TOKEN || !repository || !out) {
    throw new Error('Set GITHUB_TOKEN and GITHUB_REPOSITORY, and name the file to write');
  }
  const [owner = '', name = ''] = repository.split('/');
  const answers = yearInReview(await readYearIssues(graphql, owner, name));
  writeFileSync(safePath(out), JSON.stringify(answers, null, 2) + '\n');
  const count = Object.values(answers).reduce((sum, list) => sum + (list?.length ?? 0), 0);
  console.log(`Wrote ${out}: ${String(count)} accepted Year in Review answers.`);
}
/* v8 ignore stop */
