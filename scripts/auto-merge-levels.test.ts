/**
 * Pins the merge gate's runner on a level pull request (ADR 0043): one that
 * only changes its owner's level merges on its own like a booth, and one that
 * also changes a booth, the map's code or one of the North Pole's own levels,
 * or whose level.ts isn't plain data, waits for a person.
 */
import { describe, expect, it } from 'vitest';
import type { Routes } from './merge-gate-fake-github.ts';
import { boothRequest, mergeableBooth, runGate, SHA } from './merge-gate-world.ts';

const GUIDE = 'https://github.com/elves/carnival/blob/main/docs/how-it-works.md';
const LEVEL = 'carnival/levels/holly/';
const base64 = (text: string) => Buffer.from(text, 'utf8').toString('base64');

const DATA = `import type { NorthPoleLevel } from '../../../src/northpole/level';
const level: NorthPoleLevel = { id: 'holly', name: 'Holly Hill', size: 9 };
export default level;
`;
const SQUARE = `import type { NorthPoleSquare } from '../../../../../src/northpole/square';
import { theme } from '../../../../../src/northpole/theme';
const sled: NorthPoleSquare = {
  id: 'sled', name: 'Sled', description: 'A sled.',
  draw(ctx, size) {
    ctx.fillStyle = theme.colors.snow;
    ctx.fillRect(0, 0, size, size);
  },
};
export default sled;
`;

/** The routes of a GitHub where pull request #7 builds holly's level request #5 and passes every step. */
function mergeableLevel(owner = 'Holly', data = DATA): Routes {
  const folder = `carnival/levels/${owner.toLowerCase()}/`;
  const entry = (path: string, sha: string) => ({ path, type: 'blob', sha, mode: '100644' });
  return {
    ...mergeableBooth(),
    'GET issues/5': boothRequest({
      user: { login: owner, type: 'User' },
      labels: [{ name: 'level-request' }, { name: 'tessl' }],
    }),
    'GET pulls/7/files': [
      { filename: `${folder}level.ts`, status: 'modified' },
      { filename: `${folder}squares/sled/square.ts`, status: 'added' },
    ],
    [`GET git/trees/${SHA}?recursive=1`]: {
      truncated: false,
      tree: [
        entry(`${folder}level.ts`, 'l1'),
        entry(`${folder}README.md`, 'l2'),
        entry(`${folder}squares/sled/square.ts`, 'l3'),
        entry('carnival/booths/holly/booth.ts', 'b1'),
      ],
    },
    'GET git/blobs/l1': { content: base64(data) },
    'GET git/blobs/l2': { content: base64('# Holly Hill\n\nA sledging hill.\n') },
    'GET git/blobs/l3': { content: base64(SQUARE) },
  };
}

const checklist = (run: Awaited<ReturnType<typeof runGate>>) =>
  (run.writes()[0]?.body as { body: string } | undefined)?.body ?? '';

describe('a level pull request', () => {
  it('merges on its own when every step passes, and tells its owner the level is on the map', async () => {
    const run = await runGate(mergeableLevel());
    expect(run.logs[0]).toBe(`#7 (level holly, ${SHA.slice(0, 7)}): merge`);
    expect(
      checklist(run).startsWith('<!-- booth-gate -->\n### How this level gets onto the map'),
    ).toBe(true);
    expect(checklist(run)).toContain('**Only the level’s own folder** (Passed)');
    expect(run.writes()).toContainEqual({
      method: 'POST',
      path: 'issues/5/comments',
      body: {
        body: `Your level is on the map. It merged on its own in #7 after passing every check in the auto-merge gate. [How your request is built](${GUIDE}) explains each one.`,
      },
    });
    expect(run.writes()).toContainEqual({
      method: 'PUT',
      path: 'pulls/7/merge',
      body: { merge_method: 'merge', sha: SHA },
    });
  });

  it.each([
    ['the owner’s booth', 'carnival/booths/holly/booth.ts'],
    ['the map’s code', 'src/main.ts'],
  ])('waits for a person when it also changes %s', async (_, other) => {
    const routes = mergeableLevel();
    routes['GET pulls/7/files'] = [
      { filename: `${LEVEL}level.ts`, status: 'modified' },
      { filename: other, status: 'modified' },
    ];
    const run = await runGate(routes);
    expect(run.logs[0]).toBe(`#7 (level holly, ${SHA.slice(0, 7)}): human`);
    expect(checklist(run)).toContain(`Also changes ${other}`);
    expect(run.writes().map((w) => w.path)).not.toContain('pulls/7/merge');
  });

  it('waits for a person when its level.ts runs code instead of holding data', async () => {
    const run = await runGate(mergeableLevel('Holly', `${DATA}console.log(level);\n`));
    expect(run.logs[0]).toContain('human');
    expect(checklist(run)).toContain('A level.ts holds only');
  });

  it('never merges one of the North Pole’s own levels, even for a login that matches it', async () => {
    const run = await runGate(mergeableLevel('the-factory'));
    expect(run.logs[0]).toBe(`#7 (level the-factory, ${SHA.slice(0, 7)}): human`);
    expect(checklist(run)).toContain('The North Pole’s own levels merge only with a maintainer.');
  });

  it('holds a level to .ts and .md files: no plot.json, which only a booth has', async () => {
    const routes = mergeableLevel();
    const tree = routes[`GET git/trees/${SHA}?recursive=1`] as { tree: object[] };
    tree.tree.push({ path: `${LEVEL}plot.json`, type: 'blob', sha: 'l4', mode: '100644' });
    const run = await runGate(routes);
    expect(checklist(run)).toContain('Only .ts and .md files merge without a person.');
  });
});
