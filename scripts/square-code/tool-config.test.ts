import { describe, expect, it } from 'vitest';
import { toolConfigProblems } from './tool-config.ts';

const at = (name: string) => ({ path: `carnival/booths/elf/${name}`, text: 'export default [];' });

describe("a tool's config file in a square", () => {
  it.each([
    'eslint.config.ts',
    'vitest.config.mts',
    'prettier.config.ts',
    'knip.config.ts',
    'parts/eslint.config.ts',
    '.prettierrc',
    '.markdownlint-cli2.jsonc',
    'tsconfig.json',
  ])('is a problem: %s', (name) => {
    expect(toolConfigProblems([at(name)]).map((p) => p.rule)).toEqual(['tool-config']);
  });

  it('leaves the square its own code and words alone', () => {
    expect(
      toolConfigProblems(['booth.ts', 'config.ts', 'scene-config.ts', 'README.md'].map(at)),
    ).toEqual([]);
  });
});
