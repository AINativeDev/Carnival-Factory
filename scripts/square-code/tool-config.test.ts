import { describe, expect, it, vi } from 'vitest';
import type { SourceFile } from './problems.ts';

/**
 * The check, loaded afresh inside each test, so mutation testing sees the test
 * use the pattern the module builds as it loads (docs/adr/0061-mutation-testing.md).
 */
async function toolConfigProblems(files: readonly SourceFile[]) {
  vi.resetModules();
  return (await import('./tool-config.ts')).toolConfigProblems(files);
}

const at = (name: string) => ({ path: `carnival/booths/elf/${name}`, text: 'export default [];' });

describe("a tool's config file in a square", () => {
  it.each([
    'eslint.config.ts',
    'eslint.config.js',
    'eslint.config.cjs',
    'eslint.config.mjs',
    'vitest.config.mts',
    'vite.config.cts',
    'vite.config.tsx',
    'vite.config.jsx',
    'prettier.config.ts',
    'knip.config.ts',
    'parts/eslint.config.ts',
    '.prettierrc',
    '.markdownlint-cli2.jsonc',
    'parts/.eslintrc',
    'tsconfig.json',
    'tsconfig.build.json',
  ])('is a problem: %s', async (name) => {
    expect((await toolConfigProblems([at(name)])).map((p) => p.rule)).toEqual(['tool-config']);
  });

  it('finds one given by its name alone, as at the root', async () => {
    const bare = ['eslint.config.ts', '.prettierrc', 'tsconfig.json', 'booth.ts'];
    const found = await toolConfigProblems(bare.map((path) => ({ path, text: '' })));
    expect(found.map((problem) => problem.file)).toEqual(bare.slice(0, 3));
  });

  it('says which file, and why a square has none', async () => {
    expect(await toolConfigProblems([at('booth.ts'), at('.prettierrc')])).toEqual([
      {
        file: 'carnival/booths/elf/.prettierrc',
        line: 0,
        rule: 'tool-config',
        message:
          "A tool's config file can change how the checks run, so a square has none of its own.",
      },
    ]);
  });

  it.each([
    'booth.ts',
    'config.ts',
    'scene-config.ts',
    'README.md',
    'sky.config.json',
    'sky.config.ts.md',
    'sky.config.tss',
    'sky.config.ks',
    'sky.config.xts',
    '.config/booth.ts',
    'parts.config.ts/booth.ts',
    'tsconfig.ts',
    'tsconfig.json.md',
    'tsconfig/booth.json',
    'mytsconfig.json',
  ])('leaves the square its own code and words alone: %s', async (name) => {
    expect(await toolConfigProblems([at(name)])).toEqual([]);
  });
});
