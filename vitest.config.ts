import { defineConfig, mergeConfig } from 'vitest/config';
import viteConfig from './vite.config.ts';

/**
 * The unit tests, with the page's own build settings so they see what the page
 * sees. Coverage is a ratchet towards 99% (docs/adr/0025-test-coverage.md):
 * the thresholds below are the floor, and every run that beats them writes the
 * new, higher numbers back here, so coverage can rise and never quietly fall.
 * New and changed lines are held to 99% on their own by scripts/diff-coverage.ts.
 */
export default mergeConfig(
  viteConfig({ command: 'serve', mode: 'test' }),
  defineConfig({
    test: {
      environment: 'node',
      include: ['{src,carnival,scripts,lint}/**/*.test.ts'],
      coverage: {
        provider: 'v8',
        include: ['{src,scripts,lint,carnival}/**/*.{ts,js}'],
        exclude: ['**/*.test.ts', '**/*.d.ts'],
        reporter: ['text-summary', 'json'],
        thresholds: {
          // Whole points: runs differ by a fraction of a percent between machines.
          autoUpdate: (threshold: number) => Math.floor(threshold),
          lines: 38,
          statements: 39,
          functions: 54,
          branches: 47,
        },
      },
    },
  }),
);
