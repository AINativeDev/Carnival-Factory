import { defineConfig, mergeConfig } from 'vitest/config';
import viteConfig from './vite.config.ts';

/**
 * The unit tests, with the page's own build settings so they see what the page
 * sees. Coverage is a ratchet towards 99% (docs/adr/0025-test-coverage.md):
 * the thresholds below are the floor every run is held to, so coverage never
 * quietly falls. They're raised only on main, by `npm run coverage:ratchet`
 * (RATCHET=1), never inside a pull request, so two pull requests never fight
 * over the same line (docs/adr/0034-ratchet-on-main.md).
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
          autoUpdate:
            process.env.RATCHET === '1' ? (threshold: number) => Math.floor(threshold) : false,
          lines: 87,
          statements: 87,
          functions: 91,
          branches: 86,
        },
      },
    },
  }),
);
