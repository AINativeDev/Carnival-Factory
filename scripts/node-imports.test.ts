/**
 * The workflows run scripts with plain `node scripts/<name>.ts`, which strips
 * the types but, unlike Vite and Vitest, never guesses a file's extension. A
 * relative import without `.ts` passes every unit test and then fails in CI
 * with ERR_MODULE_NOT_FOUND, as the auto-merge gate did through
 * src/northpole/plots.ts (#235). So every file a workflow's script reaches,
 * in scripts/ or src/, names its imports in full.
 */
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const ROOT = resolve(import.meta.dirname, '..');
const RELATIVE_IMPORT = /\b(?:from|import)\s*\(?\s*'(\.{1,2}\/[^']+)'/g;

/** The scripts the workflows and package.json hand to `node`. */
function entryPoints(): string[] {
  const workflows = join(ROOT, '.github/workflows');
  const sources = [
    readFileSync(join(ROOT, 'package.json'), 'utf8'),
    ...readdirSync(workflows).map((name) => readFileSync(join(workflows, name), 'utf8')),
  ];
  const found = sources.flatMap((text) => [
    ...text.matchAll(/\bnode (?:--\S+ )*(scripts\/\S+\.ts)/g),
  ]);
  return [...new Set(found.map(([, script = '']) => script))].sort();
}

/** Each import Node would fail to find, as "<file>: <specifier>". */
function missingImports(entry: string): string[] {
  const missing: string[] = [];
  const seen = new Set<string>();
  const queue = [join(ROOT, entry)];
  for (let file = queue.pop(); file !== undefined; file = queue.pop()) {
    if (seen.has(file)) continue;
    seen.add(file);
    for (const [, specifier = ''] of readFileSync(file, 'utf8').matchAll(RELATIVE_IMPORT)) {
      const target = resolve(dirname(file), specifier);
      if (!existsSync(target)) missing.push(`${relative(ROOT, file)}: ${specifier}`);
      else if (target.endsWith('.ts')) queue.push(target);
    }
  }
  return missing;
}

describe('the scripts the workflows run with node', () => {
  it('are found in the workflows', () => {
    expect(entryPoints()).toContain('scripts/auto-merge-booths.ts');
  });

  it.each(entryPoints())('%s imports only files Node can find as named', (entry) => {
    expect(missingImports(entry)).toEqual([]);
  });
});
