import { describe, expect, it } from 'vitest';
import { ownershipVerdict } from './check-booth-ownership';

const ana = { login: 'Ana', id: 1, type: 'User' };
const maintainer = { login: 'jedi4ever', id: 70908, type: 'User' };
const factory = { login: 'tessl-app[bot]', id: 2, type: 'Bot' };
const otherBot = { login: 'dependabot[bot]', id: 3, type: 'Bot' };

/** The repository's API as a table of answers; anything else is an error, as `need` makes it. */
function api(answers: Record<string, unknown>) {
  return <T>(path: string): Promise<T> =>
    path in answers
      ? Promise.resolve(answers[path] as T)
      : Promise.reject(new Error(`GET ${path} answered HTTP 404`));
}

/** Pull request 7 by `user`, with this body, changing these files on one page. */
const pullRequest = (user: object, files: object[], body: string | null = null) => ({
  'pulls/7': { user, body, changed_files: files.length },
  'pulls/7/files?per_page=100&page=1': files,
});

describe('ownershipVerdict', () => {
  it("passes a person's pull request inside their own booth and level, renames included", async () => {
    const read = api(
      pullRequest(ana, [
        { filename: 'carnival/booths/ana/booth.ts' },
        { filename: 'carnival/levels/ana/level.ts', previous_filename: 'carnival/booths/ana/x.ts' },
      ]),
    );
    expect(await ownershipVerdict(read, 'o/r', '7')).toEqual({
      lines: ['Every change is inside the booth or level of @ana, or @ana is a maintainer.'],
      failed: false,
    });
  });

  it('fails each file outside the booth, including the old path of a rename', async () => {
    const read = api(
      pullRequest(ana, [
        { filename: 'carnival/booths/ana/booth.ts', previous_filename: 'src/main.ts' },
        { filename: 'carnival/booths/bob/booth.ts' },
      ]),
    );
    const verdict = await ownershipVerdict(read, 'o/r', '7');
    expect(verdict.failed).toBe(true);
    expect(verdict.lines).toEqual([
      expect.stringMatching(/^::error file=src\/main.ts,title=Outside your booth::.*@ana/),
      expect.stringMatching(/^::error file=carnival\/booths\/bob\/booth.ts,/),
    ]);
  });

  it('reads every page of files, and fails when GitHub listed fewer than changed', async () => {
    const page = Array.from({ length: 100 }, (_, n) => ({
      filename: `carnival/booths/ana/f${n}.ts`,
    }));
    const read = api({
      'pulls/7': { user: ana, body: null, changed_files: 3001 },
      'pulls/7/files?per_page=100&page=1': page,
      'pulls/7/files?per_page=100&page=2': [{ filename: 'carnival/booths/ana/last.ts' }],
    });
    const verdict = await ownershipVerdict(read, 'o/r', '7');
    expect(verdict).toEqual({
      lines: [expect.stringContaining('changes 3001 files and GitHub listed only 101')],
      failed: true,
    });
  });

  it("holds the factory's pull request to the booth of the issue's author", async () => {
    const read = api({
      ...pullRequest(factory, [{ filename: 'src/main.ts' }], 'Closes #4'),
      'issues/4': { user: ana },
      'issues/4/events?per_page=100&page=1': [
        { event: 'labeled', label: { name: 'tessl' }, actor: { id: 1 } },
      ],
    });
    const verdict = await ownershipVerdict(read, 'o/r', '7');
    expect(verdict.failed).toBe(true);
    expect(verdict.lines[0]).toContain('This pull request is for @ana');
  });

  it("lets the factory change anything for a participant's issue a maintainer approved", async () => {
    const read = api({
      ...pullRequest(factory, [{ filename: 'src/main.ts' }], 'Closes #4'),
      'issues/4': { user: ana },
      'issues/4/events?per_page=100&page=1': [
        { event: 'labeled', label: { name: 'tessl' }, actor: { id: 70908 } },
      ],
    });
    expect(await ownershipVerdict(read, 'o/r', '7')).toEqual({
      lines: ['A maintainer approved #4 for the factory, so it may change any file.'],
      failed: false,
    });
  });

  it("lets the factory change anything for a maintainer's own issue, without reading its events", async () => {
    const read = api({
      ...pullRequest(factory, [{ filename: 'src/main.ts' }], 'Closes #4'),
      'issues/4': { user: maintainer },
    });
    expect((await ownershipVerdict(read, 'o/r', '7')).failed).toBe(false);
  });

  it('finds no owner for another bot, for a factory pull request without an issue, or one linking a pull request', async () => {
    const noOwner = /^::error title=No booth owner::/;
    const bot = api(pullRequest(otherBot, [{ filename: 'package.json' }]));
    expect((await ownershipVerdict(bot, 'o/r', '7')).lines[0]).toMatch(noOwner);
    const unlinked = api(pullRequest(factory, [{ filename: 'carnival/booths/ana/booth.ts' }]));
    expect((await ownershipVerdict(unlinked, 'o/r', '7')).lines[0]).toMatch(noOwner);
    const toPull = api({
      ...pullRequest(factory, [{ filename: 'carnival/booths/ana/booth.ts' }], 'Closes #5'),
      'issues/5': { user: ana, pull_request: {} },
    });
    const verdict = await ownershipVerdict(toPull, 'o/r', '7');
    expect(verdict).toEqual({ lines: [expect.stringMatching(noOwner)], failed: true });
  });
});
