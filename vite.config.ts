import { resolve } from 'node:path';
import { defineConfig } from 'vitest/config';

export default defineConfig({
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
});
