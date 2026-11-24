import { execSync } from 'node:child_process';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { defineConfig, type Plugin } from 'vitest/config';
import { cleanHolders } from './northpole/badges.ts';
import { BADGE_REQUEST_URL } from './northpole/links.ts';
import { badgePage } from './scripts/elf-engineer.ts';
import { readSquareInfo, sharePage, siteUrl, type ShareKind } from './scripts/share-pages.ts';
import { EMPTY_SEASON, readSeason } from './scripts/season.ts';

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

/**
 * Every participant's season, which scripts/season-data.ts counts into
 * season.json before a published build. Built into the page, so the season
 * card makes no request for it. Without the file, the season is empty.
 */
const SEASON = (() => {
  const file = resolve(import.meta.dirname, 'season.json');
  return existsSync(file) ? readSeason(JSON.parse(readFileSync(file, 'utf8'))) : EMPTY_SEASON;
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

/**
 * Writes share/<kind>-<id>.html for every booth and attraction, the pages Share
 * links to so they unfurl with a title, a description and the map's picture
 * (scripts/share-pages.ts), and that picture beside them.
 */
const sharePages: Plugin = {
  name: 'share-pages',
  apply: 'build',
  generateBundle() {
    const root = import.meta.dirname;
    const disabled = JSON.parse(readFileSync(join(root, 'northpole/disabled.json'), 'utf8')) as {
      booths: string[];
      attractions: string[];
    };
    const site = siteUrl(process.env);
    const image = site ? `${site}share/map.png` : 'map.png';
    this.emitFile({
      type: 'asset',
      fileName: 'share/map.png',
      source: readFileSync(join(root, 'docs/north-pole.png')),
    });
    for (const kind of ['booth', 'attraction'] as ShareKind[]) {
      const dir = join(root, `${kind}s`);
      const off = new Set(disabled[`${kind}s`].map((id) => id.toLowerCase()));
      for (const id of readdirSync(dir)) {
        const file = join(dir, id, `${kind}.ts`);
        if (!existsSync(file)) continue;
        const info = readSquareInfo(readFileSync(file, 'utf8'));
        const name = info.name ?? (kind === 'booth' ? `@${id}'s booth` : id);
        const description = off.has(id) ? 'Closed for repairs.' : (info.description ?? '');
        this.emitFile({
          type: 'asset',
          fileName: `share/${kind}-${id}.html`,
          source: sharePage({ kind, id, name, description }, image),
        });
      }
    }
  },
};

/**
 * The Elf Engineer badge holders, baked into the page so it never asks the
 * network: read from BADGE_HOLDERS_FILE, which the deploy writes from the
 * accepted badge requests (scripts/badge-holders.ts), or none without it.
 */
const BADGE_HOLDERS = (() => {
  const file = process.env.BADGE_HOLDERS_FILE;
  return file && existsSync(file) ? cleanHolders(JSON.parse(readFileSync(file, 'utf8'))) : [];
})();

/** Writes badges/index.html: the Elf Engineer badges, and the Markdown to paste for each. */
const badgePages: Plugin = {
  name: 'badge-pages',
  apply: 'build',
  generateBundle() {
    this.emitFile({
      type: 'asset',
      fileName: 'badges/index.html',
      source: badgePage(siteUrl(process.env) ?? '', BADGE_REQUEST_URL),
    });
  },
};

export default defineConfig(({ command }) => ({
  plugins: [versionFile, sharePages, badgePages],
  define: {
    __BUILD_ID__: JSON.stringify(command === 'build' ? BUILD_ID : 'dev'),
    __BADGE_HOLDERS__: JSON.stringify(BADGE_HOLDERS),
    __SEASON__: JSON.stringify(SEASON),
  },
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
