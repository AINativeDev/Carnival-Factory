/**
 * The data a build bakes into the page, so the page never has to ask the
 * network for it (docs/adr/0009-no-network-from-the-page.md). The deploy-only
 * data comes from files the deploy writes before the build; a preview has none
 * of them. The craft badges come from the repository itself, so every build
 * has them.
 */
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { cleanCounts } from '../src/northpole/advent.ts';
import { cleanHolders } from '../src/northpole/badges.ts';
import { REPO_URL } from '../src/northpole/links.ts';
import { cleanChoice } from '../src/northpole/peoples-choice.ts';
import { craftOf } from './craft/craft.ts';
import { readSquare, squareFolders } from './craft/check-square.ts';

const readIfThere = (file: string | undefined): unknown =>
  file && existsSync(file) ? JSON.parse(readFileSync(file, 'utf8')) : undefined;

/** The Elf Engineer badge holders, from the accepted badge requests (scripts/badge-holders.ts). */
export function badgeHolders(file: string | undefined) {
  const data = readIfThere(file);
  return data === undefined ? [] : cleanHolders(data);
}

/** How many advent challenges each participant has had accepted (scripts/write-advent.ts). */
export function adventCounts(file: string | undefined) {
  const data = readIfThere(file);
  return data === undefined ? {} : cleanCounts(data);
}

/** The People's Choice standings, without switched-off booths (scripts/write-peoples-choice.ts). */
export function peoplesChoice(file: string | undefined, root: string) {
  const data = readIfThere(file);
  if (data === undefined) return undefined;
  const disabled = JSON.parse(readFileSync(join(root, 'src/northpole/disabled.json'), 'utf8')) as {
    booths: string[];
  };
  return cleanChoice(data, disabled.booths, REPO_URL);
}

/**
 * Each square's craft badges (docs/adr/0029-booth-craft.md), by `booth/<login>`,
 * `attraction/<id>` or `level/<login>/<id>`, the way the visit panel looks
 * squares up.
 */
export function squareCraft(root: string): Record<string, string[]> {
  const craft: Record<string, string[]> = {};
  for (const folder of squareFolders(root)) {
    // squareFolders gives only these three shapes of folder, so the key is a rename of it.
    const key = folder
      .replace(/^carnival\/levels\/([^/]+)\/squares\//, 'level/$1/')
      .replace(/^carnival\/booths\//, 'booth/')
      .replace(/^carnival\/attractions\//, 'attraction/');
    craft[key] = craftOf(readSquare(join(root, folder))).badges;
  }
  return craft;
}
