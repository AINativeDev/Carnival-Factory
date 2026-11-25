/**
 * What the map's smoke tests share: the squares on the map as the build finds
 * them, the frame budgets, where screenshots go, and watching a page for
 * anything a square or the map shouldn't do. It lives apart from the specs so
 * each spec file can hold one part of the carnival and stay small
 * (docs/adr/0019-small-files.md).
 */
import { existsSync, mkdirSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import type { Page } from '../coverage';
import { isNorthPoleLevel } from '../../src/northpole/north-pole-levels';
import { attractionShown } from '../../src/feature-flag-names';
import { FLAGS } from './feature-flags';
import { buildWorld, type PinnedPlots, type WorldExtras } from '../../src/northpole/world-build';

const root = join(import.meta.dirname, '..', '..');
/** Where every spec saves its screenshots, for the pull request's preview comment. */
export const SHOTS = join(root, 'screenshots');
mkdirSync(SHOTS, { recursive: true });

// CI's browsers draw without a GPU, in software, several times slower than a
// laptop, so they get a looser budget. It still catches a real slowdown there,
// without failing on the runner's speed.
const ON_CI = !!process.env.CI;
/** Milliseconds a square may spend drawing one frame. */
export const FRAME_BUDGET_MS = ON_CI ? 16 : 8;
/** Milliseconds the map may spend drawing one frame, on average, while the player walks. */
export const MAP_FRAME_BUDGET_MS = ON_CI ? 25 : 12;

// Squares a maintainer switched off show "Closed for repairs" and never open a
// frame, so there's nothing of theirs to play.
const disabled = JSON.parse(readFileSync(join(root, 'src/northpole/disabled.json'), 'utf8')) as {
  booths: string[];
  attractions: string[];
  levels: string[];
};
/** Every booth and attraction that's open, as the map finds their folders, but those a feature flag holds back. */
const squares = (['booth', 'attraction'] as const).flatMap((kind) => {
  const dir = join(root, 'carnival', `${kind}s`);
  const off = new Set(disabled[`${kind}s`].map((id) => id.toLowerCase()));
  return readdirSync(dir)
    .filter((name) => statSync(join(dir, name)).isDirectory() && !off.has(name))
    .filter((id) => kind === 'booth' || attractionShown(id, FLAGS))
    .map((id) => ({ kind, id }));
});

// On a pull request that only changes one booth, CI plays just that booth
// one by one (scripts/smoke-scope.ts). The map-wide tests still see every square.
const only = process.env.SMOKE_ONLY;
/** The squares this run plays one by one. */
export const played = only ? squares.filter(({ kind, id }) => `${kind}/${id}` === only) : squares;

/** The open booths' logins. */
export const booths = squares.filter((square) => square.kind === 'booth').map((s) => s.id);
const attractions = squares.filter((s) => s.kind === 'attraction').map((s) => s.id);
const pinned = JSON.parse(
  readFileSync(join(root, 'src/northpole/plots.json'), 'utf8'),
) as PinnedPlots;
/** Every participant's level, each with its platform at the sleigh station, as the map lays them out. */
const levelLogins = readdirSync(join(root, 'carnival', 'levels'))
  .filter((name) => existsSync(join(root, 'carnival', 'levels', name, 'level.ts')))
  .filter((name) => !isNorthPoleLevel(name))
  .sort();

/** The world the map builds, so a test can find a plot where the page draws it. */
export function carnivalWorld(pending: WorldExtras['pending'] = []) {
  return buildWorld(attractions, booths, pinned, { levels: levelLogins, pending });
}

/** A square's frame: booths and attractions may share an id, so match both. */
export const frameOf = (page: Page, kind: string, id: string) =>
  page.locator(`iframe[data-kind="${kind}"][data-id="${id}"]`);

/** Collects what the page and every frame in it did wrong. */
export function watch(page: Page) {
  const problems: string[] = [];
  const site = new URL('http://localhost:4173/');
  page.on('console', (message) => {
    if (message.type() === 'error') problems.push(`console error: ${message.text()}`);
  });
  page.on('pageerror', (error) => problems.push(`uncaught: ${error.message}`));
  page.on('request', (request) => {
    const url = new URL(request.url());
    if (url.protocol === 'data:' || url.protocol === 'blob:') return;
    if (url.origin !== site.origin) problems.push(`request to ${request.url()}`);
  });
  return problems;
}

/** A value the test needs, or a failure that says which one was missing. */
export function present<T>(value: T | null | undefined, what: string): T {
  if (value === null || value === undefined) throw new Error(`no ${what}`);
  return value;
}
