/**
 * How the merge gate reads a booth's folder at the head commit: only the
 * booth's own text files, never one too large to check, a link or another kind
 * of file (docs/specs/auto-merge-gate.md).
 */
import { describe, expect, it, vi } from 'vitest';
import { scriptedGitHub } from './merge-gate-fake-github.ts';

const SHA = 'c'.repeat(40);
const FOLDER = 'carnival/booths/elf/';
const TREE = `GET git/trees/${SHA}?recursive=1`;
const KB = 1024;

const blob = (path: string, size = 10, sha = `sha-${path}`) => ({
  path,
  type: 'blob',
  sha,
  mode: '100644',
  size,
});
const base64 = (text: string) => Buffer.from(text, 'utf8').toString('base64');

async function read(tree: object[], truncated = false) {
  const github = scriptedGitHub({
    [TREE]: { tree, truncated },
    [`GET git/blobs/sha-${FOLDER}booth.ts`]: { content: base64('export default 1;\n') },
    [`GET git/blobs/sha-${FOLDER}README.md`]: { content: base64('# Elf\n') },
    [`GET git/blobs/sha-${FOLDER}spot.json`]: { content: base64('{"spot":3,"issue":5}') },
  });
  // Loaded afresh, so the kinds of file it allows are set up inside the test.
  vi.resetModules();
  const { boothFiles } = await import('./merge-gate-booth-files.ts');
  const result = await boothFiles(github.client, SHA, 'elf');
  return { ...result, paths: github.requests.map((r) => r.path) };
}

const tooLarge = (file: string) => ({
  file,
  line: 0,
  rule: 'files',
  message: 'Too large to check on its own: at most 40 files, 100 KB each and 300 KB in all.',
});

describe('boothFiles', () => {
  it('reads every text file in the booth’s own folder, and nothing outside it', async () => {
    const { files, problems, paths } = await read([
      blob(`${FOLDER}booth.ts`),
      blob(`${FOLDER}README.md`),
      blob(`${FOLDER}spot.json`),
      { path: `${FOLDER}art`, type: 'tree', sha: 't', mode: '040000' },
      blob('carnival/booths/elfish/booth.ts'),
      blob('src/main.ts'),
    ]);
    expect(problems).toEqual([]);
    expect(files).toEqual([
      { path: `${FOLDER}booth.ts`, text: 'export default 1;\n' },
      { path: `${FOLDER}README.md`, text: '# Elf\n' },
      { path: `${FOLDER}spot.json`, text: '{"spot":3,"issue":5}' },
    ]);
    expect(paths).toEqual([
      `git/trees/${SHA}?recursive=1`,
      `git/blobs/sha-${FOLDER}booth.ts`,
      `git/blobs/sha-${FOLDER}README.md`,
      `git/blobs/sha-${FOLDER}spot.json`,
    ]);
  });

  it('sends a tree too large to list whole to a person, reading nothing else', async () => {
    const { files, problems, paths } = await read([blob(`${FOLDER}booth.ts`)], true);
    expect(files).toEqual([]);
    expect(problems).toEqual([
      { file: FOLDER, line: 0, rule: 'files', message: 'The tree is too large to check.' },
    ]);
    expect(paths).toHaveLength(1);
  });

  it('holds, unread, any file that is neither .ts nor .md, a link, or a spot.json not its own', async () => {
    const link = { ...blob(`${FOLDER}link.ts`), mode: '120000' };
    const { files, problems, paths } = await read([
      blob(`${FOLDER}art.png`),
      blob(`${FOLDER}booth.ts.bak`),
      blob(`${FOLDER}data.json`),
      blob(`${FOLDER}sub/spot.json`),
      link,
    ]);
    expect(files).toEqual([]);
    expect(problems.map((p) => [p.file, p.line, p.rule])).toEqual(
      ['art.png', 'booth.ts.bak', 'data.json', 'sub/spot.json', 'link.ts'].map((name) => [
        `${FOLDER}${name}`,
        0,
        'files',
      ]),
    );
    expect(new Set(problems.map((p) => p.message))).toEqual(
      new Set(['Only .ts and .md files, and spot.json, merge without a person.']),
    );
    expect(paths).toHaveLength(1);
  });
});

describe('boothFiles’ limits', () => {
  const files = (count: number, size: number) =>
    Array.from({ length: count }, (_, n) => blob(`${FOLDER}part-${String(n)}.png`, size));
  const problemsOf = async (tree: object[]) => (await read(tree)).problems;

  it('allow 40 files', async () => {
    expect(await problemsOf(files(40, 1))).not.toContainEqual(tooLarge(FOLDER));
  });

  it('hold a 41st file', async () => {
    expect(await problemsOf(files(41, 1))).toEqual([tooLarge(FOLDER)]);
  });

  it('allow a file of 100 KB, and hold one a byte larger by its name', async () => {
    expect(await problemsOf([blob(`${FOLDER}booth.ts`, 100 * KB)])).toEqual([]);
    expect(await problemsOf([blob(`${FOLDER}booth.ts`, 100 * KB + 1)])).toEqual([
      tooLarge(`${FOLDER}booth.ts`),
    ]);
  });

  it('allow 300 KB in all, and hold a byte more', async () => {
    expect(await problemsOf(files(3, 100 * KB))).not.toContainEqual(tooLarge(FOLDER));
    expect(await problemsOf([...files(3, 100 * KB), blob(`${FOLDER}booth.ts`, 1)])).toEqual([
      tooLarge(FOLDER),
    ]);
  });

  it('count a file with no size as empty', async () => {
    const sizeless = {
      path: `${FOLDER}booth.ts`,
      type: 'blob',
      sha: `sha-${FOLDER}booth.ts`,
      mode: '100644',
    };
    expect(await problemsOf([...files(3, 100 * KB), sizeless])).not.toContainEqual(
      tooLarge(FOLDER),
    );
  });
});
