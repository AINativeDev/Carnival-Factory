import { describe, expect, it } from 'vitest';
import { gatherFacts } from './gate-facts.ts';
import { fakeGitHub, levelIssue, levelPull, passingReplies, SHA } from './gate-fake.ts';
import { closedSince } from './gate-github.ts';

const now = new Date('2026-12-01T12:00:00Z');
const page = (path: string) => `${path}${path.includes('?') ? '&' : '?'}per_page=100&page=1`;
const TREE = `git/trees/${SHA}?recursive=1`;

/** The facts about `levelPull` with the passing replies, each change in `change` applied. */
async function facts(change: Record<string, unknown> = {}) {
  const replies = passingReplies();
  for (const [path, reply] of Object.entries(change)) replies.set(path, reply);
  return (await gatherFacts(fakeGitHub(replies).github, levelPull, levelIssue, now)).facts;
}
const blob = (path: string, size = 10, mode = '100644') => ({
  path,
  type: 'blob',
  sha: 'b1',
  mode,
  size,
});

describe('gatherFacts', () => {
  it("reads a level's request, folder, checks, review and verdict", async () => {
    const found = await facts();
    expect(found).toMatchObject({
      kind: 'level',
      owner: 'elf',
      accepted: true,
      changedFiles: ['carnival/levels/elf/level.ts'],
      codeProblems: [],
      textFindings: [],
      review: 'approved',
      risk: 'low-risk',
      lastAutoMerge: undefined,
    });
    expect(found.checks).toEqual({
      check: 'success',
      ownership: 'success',
      build: 'success',
      smoke: 'success',
    });
  });

  it('reads both sides of a rename, and never loads a folder that is out of scope', async () => {
    const found = await facts({
      [page('pulls/9/files')]: [
        {
          filename: 'carnival/levels/elf/README.md',
          status: 'renamed',
          previous_filename: 'carnival/booths/elf/README.md',
        },
      ],
      [TREE]: undefined,
    });
    expect(found.changedFiles).toEqual([
      'carnival/levels/elf/README.md',
      'carnival/booths/elf/README.md',
    ]);
  });

  it.each<[string, unknown, string]>([
    ['a truncated tree', { truncated: true, tree: [] }, 'too large to check'],
    [
      'a folder over the size limit',
      { truncated: false, tree: [blob('carnival/levels/elf/level.ts', 200 * 1024)] },
      'Too large to check on its own',
    ],
    [
      'a file that is not text',
      { truncated: false, tree: [blob('carnival/levels/elf/map.png')] },
      'merge on their own',
    ],
    [
      'a symlink',
      { truncated: false, tree: [blob('carnival/levels/elf/level.ts', 10, '120000')] },
      'merge on their own',
    ],
  ])('finds a problem with %s', async (_, tree, message) => {
    const found = await facts({ [TREE]: tree });
    expect(found.codeProblems.map((p) => p.message).join(' ')).toContain(message);
  });

  it('keeps the latest run of each check, and a failed or running one', async () => {
    const run = (name: string, status: string, conclusion: string | null, started_at: string) => ({
      name,
      status,
      conclusion,
      started_at,
    });
    const found = await facts({
      [`commits/${SHA}/check-runs?per_page=100&page=1`]: {
        check_runs: [
          run('check', 'completed', 'success', '2026-12-01T09:00:00Z'),
          run('check', 'completed', 'failure', '2026-12-01T10:00:00Z'),
          run('check', 'completed', 'success', '2026-12-01T08:00:00Z'),
          run('smoke', 'in_progress', null, '2026-12-01T10:00:00Z'),
        ],
      },
    });
    expect(found.checks).toEqual({ check: 'failure', smoke: 'pending' });
  });

  it("reads a review asking for changes, and ignores another commit's verdict", async () => {
    const found = await facts({
      [page('pulls/9/reviews')]: [
        {
          user: { login: 'tessl-reviewer[bot]' },
          commit_id: SHA,
          body: '<!-- tessl-code-review:result:v1 approved=false -->',
        },
        { user: { login: 'tessl-reviewer[bot]' }, commit_id: SHA, body: 'A reply on a thread.' },
      ],
      [page('issues/9/comments')]: [
        {
          id: 1,
          user: { login: 'tessl-app[bot]' },
          body: `<!-- assess-booth-risk sha=${'b'.repeat(40)} verdict=low-risk -->`,
        },
      ],
    });
    expect(found.review).toBe('changes');
    expect(found.risk).toBeUndefined();
  });

  it("finds the owner's last merge on its own within the hour, and only theirs", async () => {
    const merged = (number: number, at: string, labels = ['auto-merged']) => ({
      ...levelPull,
      number,
      body: `Closes #${number}`,
      updated_at: at,
      merged_at: at,
      labels: labels.map((name) => ({ name })),
    });
    const found = await facts({
      [page('pulls?state=closed&sort=updated&direction=desc')]: [
        merged(21, '2026-12-01T11:40:00Z'),
        merged(22, '2026-12-01T11:30:00Z'),
        merged(23, '2026-12-01T11:20:00Z', []),
        { ...merged(24, '2026-12-01T11:10:00Z'), merged_at: '2026-12-01T10:00:00Z' },
        merged(25, '2026-12-01T09:00:00Z'),
      ],
      'issues/21': { ...levelIssue, number: 21, user: { login: 'grinch', type: 'User' } },
      'issues/22': { ...levelIssue, number: 22 },
    });
    expect(found.lastAutoMerge).toEqual(new Date('2026-12-01T11:30:00Z'));
  });
});

describe('closedSince', () => {
  it('reads closed pull requests page by page until they are older than the window', async () => {
    const at = (n: number) => ({ ...levelPull, number: n, updated_at: '2026-12-01T11:00:00Z' });
    const replies = new Map<string, unknown>([
      [
        page('pulls?state=closed&sort=updated&direction=desc'),
        Array.from({ length: 100 }, (_, n) => at(n)),
      ],
      [
        'pulls?state=closed&sort=updated&direction=desc&per_page=100&page=2',
        [at(100), { ...at(101), updated_at: '2026-11-01T00:00:00Z' }],
      ],
    ]);
    const pulls = await closedSince(fakeGitHub(replies).github, now.getTime() - 3_600_000);
    expect(pulls).toHaveLength(101);
  });
});
