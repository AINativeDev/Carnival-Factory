import { afterEach, describe, expect, it, vi } from 'vitest';
import { fakeGitHub, levelIssue, levelPull, passingReplies, SHA } from './gate-fake.ts';
import { gateOpenPulls, gatePull } from './gate-pull.ts';

const GUIDE = 'https://example.com/guide';
const now = new Date('2026-12-01T12:00:00Z');
const page = (path: string) => `${path}${path.includes('?') ? '&' : '?'}per_page=100&page=1`;

/** The gate's turn on `levelPull` with the passing replies, each change in `change` applied. */
async function run(change: Record<string, unknown> = {}, fail?: string) {
  const replies = passingReplies();
  for (const [path, reply] of Object.entries(change)) replies.set(path, reply);
  const { github, writes, sent } = fakeGitHub(replies, fail);
  const outcome = await gatePull(github, levelPull, GUIDE, now);
  return { outcome, writes, sent };
}

afterEach(() => vi.restoreAllMocks());
vi.spyOn(console, 'log').mockImplementation(() => undefined);

describe('gatePull', () => {
  it('merges a level whose every step passes, then closes its request with a note', async () => {
    const { outcome, writes, sent } = await run();
    expect(outcome).toEqual({ merged: true, held: false });
    expect(writes).toEqual([
      'POST issues/9/comments',
      'POST issues/9/labels',
      'PUT pulls/9/merge',
      'POST issues/5/comments',
      'PATCH issues/5',
    ]);
    const [checklist, label, merge, note, close] = sent.map((write) => write.body);
    expect((checklist as { body: string }).body).toContain('How this level gets onto the map');
    expect(label).toEqual({ labels: ['auto-merged'] });
    expect(merge).toEqual({ merge_method: 'merge', sha: SHA });
    expect((note as { body: string }).body).toMatch(/^Your level is on the map\..* #9 /);
    expect(close).toEqual({ state: 'closed', state_reason: 'completed' });
  });

  it('holds a level that also changes its owner’s booth for a person', async () => {
    const { outcome, writes, sent } = await run({
      [page('pulls/9/files')]: [
        { filename: 'carnival/levels/elf/level.ts', status: 'modified' },
        { filename: 'carnival/booths/elf/booth.ts', status: 'modified' },
      ],
    });
    expect(outcome).toEqual({ merged: false, held: true });
    expect(writes).toEqual(['POST issues/9/comments', 'POST issues/9/labels']);
    expect(sent.at(1)?.body).toEqual({ labels: ['needs-human'] });
  });

  it("holds a level whose level.ts isn't plain data", async () => {
    const code = 'console.log(1);\nexport default 1;';
    const { outcome } = await run({
      'git/blobs/b1': { content: Buffer.from(code).toString('base64') },
    });
    expect(outcome.held).toBe(true);
  });

  it('waits, writing only the checklist, while the review and checks are still out', async () => {
    const { outcome, writes } = await run({
      [page('pulls/9/reviews')]: [],
      [`commits/${SHA}/check-runs?per_page=100&page=1`]: {
        check_runs: [{ name: 'smoke', status: 'in_progress', conclusion: null, started_at: 'x' }],
      },
    });
    expect(outcome).toEqual({ merged: false, held: false });
    expect(writes).toEqual(['POST issues/9/comments']);
  });

  it('updates its own checklist in place, and counts a pull request someone held', async () => {
    const replies = passingReplies();
    const comments = replies.get(page('issues/9/comments')) as object[];
    replies.set(page('issues/9/comments'), [
      ...comments,
      { id: 2, user: { login: 'github-actions[bot]' }, body: '<!-- booth-gate -->\nold' },
    ]);
    const { github, writes } = fakeGitHub(replies);
    const held = { ...levelPull, labels: [{ name: 'needs-human' }] };
    expect(await gatePull(github, held, GUIDE, now)).toEqual({ merged: false, held: true });
    expect(writes).toEqual(['PATCH issues/comments/2']);
  });

  it('skips a pull request whose issue is not a booth or level request by a person', async () => {
    const { outcome, writes } = await run({ 'issues/5': { ...levelIssue, labels: [] } });
    expect(outcome).toEqual({ merged: false, held: false });
    expect(writes).toEqual([]);
    expect(
      (await run({ 'issues/5': { ...levelIssue, user: { login: 'x', type: 'Bot' } } })).writes,
    ).toEqual([]);
    const { github } = fakeGitHub(passingReplies());
    expect(await gatePull(github, { ...levelPull, body: null }, GUIDE, now)).toEqual({
      merged: false,
      held: false,
    });
  });

  it('counts a merge whose reply was lost, and takes auto-merged off one that failed', async () => {
    const lost = await run(
      { 'pulls/9': { ...levelPull, merged_at: '2026-12-01T12:00:01Z' } },
      'PUT pulls/9/merge',
    );
    expect(lost.outcome.merged).toBe(true);
    await expect(run({ 'pulls/9': levelPull }, 'PUT pulls/9/merge')).rejects.toThrow('HTTP 500');
  });

  it('writes nothing on a dry run', async () => {
    const { github, writes } = fakeGitHub(passingReplies());
    await gatePull({ ...github, dryRun: true }, levelPull, GUIDE, now);
    expect(writes).toEqual([]);
  });
});

describe('gateOpenPulls', () => {
  it("takes only the factory's own pull requests through, and counts one that fails", async () => {
    const replies = passingReplies();
    const mine = { ...levelPull, title: '#5: A cocoa stand' };
    replies.set(page('pulls?state=open'), [
      { ...levelPull, number: 1, user: { login: 'someone', type: 'User' } },
      { ...levelPull, number: 2, head: { ...levelPull.head, ref: 'cocoa' } },
      { ...levelPull, number: 3, head: { ...levelPull.head, repo: null } },
      { ...levelPull, number: 4, body: 'Closes #404' },
      mine,
    ]);
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const { github, writes } = fakeGitHub(replies);
    const run = await gateOpenPulls(github, GUIDE);
    expect(run).toEqual({ merged: true, held: new Set(), failed: true });
    expect(writes).toContain('PUT pulls/9/merge');
    expect(writes.filter((write) => /pulls\/[1-4]\b/.test(write))).toEqual([]);
  });

  it('counts a pull request someone held', async () => {
    const replies = passingReplies();
    replies.set(page('pulls?state=open'), [{ ...levelPull, labels: [{ name: 'needs-human' }] }]);
    const run = await gateOpenPulls(fakeGitHub(replies).github, GUIDE);
    expect(run).toEqual({ merged: false, held: new Set([9]), failed: false });
  });
});
