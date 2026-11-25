import { execSync } from 'node:child_process';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { defineConfig, type Plugin } from 'vitest/config';
import { cleanCounts } from './src/northpole/advent.ts';
import { cleanHolders } from './src/northpole/badges.ts';
import { BADGE_REQUEST_URL, REPO_URL } from './src/northpole/links.ts';
import { cleanChoice } from './src/northpole/peoples-choice.ts';
import { readBoothAddedDates } from './scripts/booth-dates.ts';
import { badgePage } from './scripts/elf-engineer.ts';
import {
  factorySharePage,
  readSquareInfo,
  sharePage,
  siteUrl,
  type ShareKind,
} from './scripts/share-pages.ts';
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
 * Writes an empty pending.json, no booths being built, unless the deploy put
 * the open booth requests in public/pending.json (scripts/write-pending.ts),
 * which Vite copies as it is. So a preview or a local build shows none.
 */
const pendingFile: Plugin = {
  name: 'pending-file',
  apply: 'build',
  generateBundle() {
    if (existsSync(join(import.meta.dirname, 'public/pending.json'))) return;
    this.emitFile({ type: 'asset', fileName: 'pending.json', source: '[]\n' });
  },
};

/**
 * Writes share/<kind>-<id>.html for every booth and attraction, the pages Share
 * links to so they unfurl with a title, a description and the map's picture
 * (scripts/share-pages.ts), and that picture beside them, and share/factory.html
 * for the factory's numbers.
 */
const sharePages: Plugin = {
  name: 'share-pages',
  apply: 'build',
  generateBundle() {
    const root = import.meta.dirname;
    const disabled = JSON.parse(
      readFileSync(join(root, 'src/northpole/disabled.json'), 'utf8'),
    ) as {
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
    this.emitFile({
      type: 'asset',
      fileName: 'share/factory.html',
      source: factorySharePage(image),
    });
    for (const kind of ['booth', 'attraction'] as ShareKind[]) {
      const dir = join(root, 'carnival', `${kind}s`);
      const off = new Set(disabled[`${kind}s`].map((id) => id.toLowerCase()));
      for (const id of readdirSync(dir)) {
        const file = join(dir, id, `${kind}.ts`);
        if (!existsSync(file)) continue;
        const info = readSquareInfo(readFileSync(file, 'utf8'), id);
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

/**
 * How many advent challenges each participant has had accepted, baked into the
 * page so it never asks the network: read from ADVENT_FILE, which the deploy
 * writes from the accepted Advent challenge issues (scripts/write-advent.ts),
 * or none without it.
 */
const ADVENT_COUNTS = (() => {
  const file = process.env.ADVENT_FILE;
  return file && existsSync(file) ? cleanCounts(JSON.parse(readFileSync(file, 'utf8'))) : {};
})();

/**
 * The People's Choice standings, baked into the page so it never asks the
 * network: read from PEOPLES_CHOICE_FILE, which the deploy writes from the
 * votes in its discussion (scripts/write-peoples-choice.ts), or none without it.
 */
const PEOPLES_CHOICE = (() => {
  const file = process.env.PEOPLES_CHOICE_FILE;
  const disabled = JSON.parse(
    readFileSync(join(import.meta.dirname, 'src/northpole/disabled.json'), 'utf8'),
  ) as { booths: string[] };
  return file && existsSync(file)
    ? cleanChoice(JSON.parse(readFileSync(file, 'utf8')), disabled.booths, REPO_URL)
    : undefined;
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

/**
 * Every square's name, read from its source as the share pages read it, so the
 * Booths panel can search and sort them before their frames have opened.
 */
function squareNames(): Record<string, string> {
  const root = import.meta.dirname;
  const names: Record<string, string> = {};
  for (const kind of ['booth', 'attraction'] as ShareKind[]) {
    const dir = join(root, 'carnival', `${kind}s`);
    for (const id of readdirSync(dir)) {
      const file = join(dir, id, `${kind}.ts`);
      if (!existsSync(file)) continue;
      const name = readSquareInfo(readFileSync(file, 'utf8'), id).name;
      if (name) names[`${kind}/${id}`] = name.slice(0, 80);
    }
  }
  return names;
}

export default defineConfig(({ command }) => ({
  plugins: [versionFile, pendingFile, sharePages, badgePages],
  define: {
    __BUILD_ID__: JSON.stringify(command === 'build' ? BUILD_ID : 'dev'),
    __BADGE_HOLDERS__: JSON.stringify(BADGE_HOLDERS),
    __SEASON__: JSON.stringify(SEASON),
    __PEOPLES_CHOICE__: JSON.stringify(PEOPLES_CHOICE ?? null),
    // How many advent challenges each booth's owner has done, for their booth's decorations.
    __ADVENT_COUNTS__: JSON.stringify(ADVENT_COUNTS),
    // When each booth's folder first appeared, for the Booths panel's Recently added.
    __BOOTH_ADDED__: JSON.stringify(readBoothAddedDates(import.meta.dirname)),
    // Every square's name, for searching and sorting the Booths panel.
    __SQUARE_NAMES__: JSON.stringify(squareNames()),
    // The owners whose avatars scripts/download-avatars.ts fetched, so the page asks only for those.
    __AVATARS__: JSON.stringify(
      existsSync(join(import.meta.dirname, 'public/avatars'))
        ? readdirSync(join(import.meta.dirname, 'public/avatars'))
            .filter((file) => /^[a-z0-9-]+\.png$/.test(file))
            .map((file) => file.slice(0, -4))
        : [],
    ),
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
}));
