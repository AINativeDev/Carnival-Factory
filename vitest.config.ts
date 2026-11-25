import { defineConfig, mergeConfig } from 'vitest/config';
import viteConfig from './vite.config.ts';

/**
 * The unit tests, with the page's own build settings so they see what the page
 * sees. Every file in src/, scripts/ and lint/ is held to 99% of its lines,
 * branches, functions and statements, file by file, with no exceptions and no
 * floor to raise (docs/adr/0044-coverage-per-file.md), the way every code file
 * is held to 200 lines. Squares in carnival/ are the participants' own and are
 * played end to end by the browser tests, so they count in the combined
 * coverage instead (docs/adr/0032-browser-coverage-counts.md).
 */
export default mergeConfig(
  viteConfig({ command: 'serve', mode: 'test' }),
  defineConfig({
    // The unit tests see the live build's feature flags, all off, whatever the
    // shell says; a test switches one on with src/test-support/feature-flags.ts.
    define: { __FEATURE_FLAGS__: JSON.stringify('') },
    test: {
      environment: 'node',
      include: ['{src,carnival,scripts,lint}/**/*.test.ts'],
      coverage: {
        provider: 'v8',
        include: ['{src,scripts,lint,carnival}/**/*.{ts,js}'],
        exclude: ['**/*.test.ts', '**/*.d.ts'],
        reporter: ['text-summary', 'json'],
        thresholds: {
          // Each file on its own: a well-tested file can't hide one that isn't.
          perFile: true,
          '{src,scripts,lint}/**/*.{ts,js}': {
            lines: 99,
            branches: 99,
            functions: 99,
            statements: 99,
          },
        },
      },
    },
  }),
);
