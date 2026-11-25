import { readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { ESLint } from 'eslint';
import { describe, expect, it } from 'vitest';

// The real config, type-aware rules and all, on the real files.
const eslint = new ESLint({ cwd: `${import.meta.dirname}/..` });

async function problems(code: string, filePath: string) {
  const results = await eslint.lintText(code, { filePath });
  return results.flatMap((result) => result.messages.map((message) => message.ruleId));
}

/** Every file under a folder, as repository paths. */
function filesIn(folder: string): string[] {
  const root = join(import.meta.dirname, '..');
  return readdirSync(join(root, folder), { recursive: true, encoding: 'utf8' })
    .map((name) => `${folder}/${name}`)
    .filter((path) => statSync(join(root, path)).isFile() && /\.(ts|js)$/.test(path));
}

// The house rules find squares by their folder. If the squares move and the
// rules don't, every square would lint clean and the gate would still pass, so
// every real square's code must come out with the rules switched on.
describe('the house rules reach every square', () => {
  const squareFiles = [
    ...filesIn('carnival/booths'),
    ...filesIn('carnival/attractions'),
    ...filesIn('carnival/levels').filter((path) => path.includes('/squares/')),
  ];

  it('finds the squares', () => {
    expect(squareFiles.length).toBeGreaterThan(10);
  });

  it.each(squareFiles)('%s runs under the house rules', async (file) => {
    const config = (await eslint.calculateConfigForFile(file)) as {
      rules?: Record<string, unknown>;
    };
    for (const rule of ['no-restricted-globals', 'no-restricted-imports', 'no-eval']) {
      const setting: unknown = config.rules?.[rule];
      const severity: unknown = Array.isArray(setting) ? (setting as unknown[])[0] : setting;
      expect(String(severity), `${file}: ${rule}`).toMatch(/^(error|2)$/);
    }
    expect(await problems('export const x = fetch;', file)).toContain('no-restricted-globals');
  });

  it.each(
    filesIn('carnival/levels').filter((path) => /^carnival\/levels\/[^/]+\/level\.ts$/.test(path)),
  )('%s is held to plain data', async (file) => {
    expect(await problems('export default 1;', file)).toContain('no-restricted-syntax');
  });
});
