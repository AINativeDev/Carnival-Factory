import { execSync } from 'node:child_process';
import { resolve } from 'node:path';
import { defineConfig, type Plugin } from 'vitest/config';

/** This build's id: the commit and the time, so every build differs. */
const BUILD_ID = (() => {
  let commit = 'local';
  try {
    commit = execSync('git rev-parse --short HEAD', { stdio: ['ignore', 'pipe', 'ignore'] })
      .toString()
      .trim();
  } catch {
    // Not a git checkout: the time alone is enough.
  }
  return `${commit}-${Date.now().toString(36)}`;
})();

/** Writes version.json beside the page, so an open page can tell a newer build is out. */
const versionFile: Plugin = {
  name: 'version-file',
  apply: 'build',
  generateBundle() {
    this.emitFile({
      type: 'asset',
      fileName: 'version.json',
      source: JSON.stringify({ build: BUILD_ID }),
    });
  },
};

export default defineConfig(({ command }) => ({
  plugins: [versionFile],
  define: { __BUILD_ID__: JSON.stringify(command === 'build' ? BUILD_ID : 'dev') },
  // Relative asset paths, so the build works on any fork's GitHub Pages URL.
  base: './',
  build: {
    rollupOptions: {
      // The map, and the page each square's sandboxed frame loads.
      input: {
        main: resolve(import.meta.dirname, 'index.html'),
        square: resolve(import.meta.dirname, 'square.html'),
      },
    },
  },
  // A sandboxed frame has an opaque origin ("null"), so its scripts are
  // cross-origin requests: the dev and preview servers allow that one origin,
  // and no other website, to read what they serve.
  server: { cors: { origin: 'null' } },
  preview: { cors: { origin: 'null' } },
  test: {
    environment: 'node',
    include: ['{src,northpole,booths,attractions,scripts}/**/*.test.ts'],
  },
}));
