import { realpathSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

/**
 * Mutation testing (docs/adr/0061-mutation-testing.md): Stryker changes the code
 * one small way at a time and runs the unit tests against each change. A test
 * that fails catches it. The same files coverage holds to 99% are mutated:
 * src/, scripts/ and lint/, not the squares in carnival/, which the browser
 * tests play. Scores are on covered code, since coverage already holds the
 * rest (scripts/mutation-check.ts reads them).
 *
 * @type {import('@stryker-mutator/api/core').PartialStrykerOptions}
 */
export default {
  testRunner: 'vitest',
  plugins: ['@stryker-mutator/vitest-runner', './lint/stryker-ignore-glob.mjs'],
  ignorers: ['import-meta-glob'],
  vitest: { configFile: 'vitest.config.ts' },
  mutate: [
    '{src,scripts,lint}/**/*.ts',
    '!**/*.test.ts',
    '!**/*.d.ts',
    // The tests' own helpers: what they fake is the tests' business, not the site's.
    '!src/test-support/**',
    '!src/northpole/sandbox-fakes.ts',
    '!scripts/merge-gate-world.ts',
  ],
  coverageAnalysis: 'perTest',
  // A change to a value set as a module loads needs every test run again: a
  // seventh of the mutants, but most of the time. Coverage still holds that code.
  ignoreStatic: true,
  reporters: ['clear-text', 'progress', 'json', 'html'],
  jsonReporter: { fileName: 'reports/mutation/mutation.json' },
  htmlReporter: { fileName: 'reports/mutation/mutation.html' },
  // Outside the repository, so a build watcher there never sees its copies of the
  // code; by its real path, since on macOS the temporary folder is behind a link.
  tempDirName: join(realpathSync(tmpdir()), 'carnival-factory-stryker'),
  cleanTempDir: 'always',
  // The copy keeps git's history: the build reads when each booth was added from
  // it (scripts/booth-dates.ts), and a test scans git's own list of files.
  ignorePatterns: ['!.git'],
  // The bar for a new or changed file; the per-file baseline holds the rest.
  thresholds: { high: 95, low: 90, break: null },
};
