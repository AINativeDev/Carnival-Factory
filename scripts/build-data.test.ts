import { mkdirSync, mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { cleanChoice } from '../src/northpole/peoples-choice';
import { REPO_URL } from '../src/northpole/links';
import {
  adventCounts,
  badgeHolders,
  deployData,
  peoplesChoice,
  squareCraft,
  squareNames,
  yearInReview,
} from './build-data';

const root = join(import.meta.dirname, '..');
const written = (data: unknown) => {
  const file = join(mkdtempSync(join(tmpdir(), 'build-data-')), 'data.json');
  writeFileSync(file, JSON.stringify(data));
  return file;
};

describe('the data a build bakes into the page', () => {
  it('has none of the deploy-only data without its file, as in a preview', () => {
    expect(badgeHolders(undefined)).toEqual([]);
    expect(badgeHolders('/no/such/file.json')).toEqual([]);
    expect(adventCounts(undefined)).toEqual({});
    expect(peoplesChoice(undefined, root)).toBeUndefined();
    expect(yearInReview(undefined)).toEqual({});
    expect(deployData({}, root)).toEqual({
      __PEOPLES_CHOICE__: 'null',
      __ADVENT_COUNTS__: '{}',
      __YEAR_IN_REVIEW__: '{}',
    });
  });

  it('reads and cleans the deploy-only data when the deploy wrote it', () => {
    expect(adventCounts(written({ ana: 2, 'Bad Login!': 1 }))).toEqual({ ana: 2 });
    expect(Array.isArray(badgeHolders(written([])))).toBe(true);
    const standings = { closes: '2026-12-24', booths: [] };
    expect(peoplesChoice(written(standings), root)).toEqual(cleanChoice(standings, [], REPO_URL));
    const answer = { login: 'ana', answer: '<b>Yes</b>', at: '2026-11-20T00:00:00Z' };
    expect(yearInReview(written({ 'hot-take': [answer], nope: [answer] }))).toEqual({
      'hot-take': [answer],
    });
    expect(
      JSON.parse(deployData({ YEAR_IN_REVIEW_FILE: written({}) }, root).__YEAR_IN_REVIEW__),
    ).toEqual({});
  });

  it('keeps the badge holders the deploy wrote', () => {
    const holder = { login: 'ana', repo: 'ana/factory', tier: 'gold' };
    expect(badgeHolders(written([holder]))).toEqual([holder]);
  });

  it('leaves out of the standings a booth the kill switch closed', () => {
    const at = mkdtempSync(join(tmpdir(), 'build-data-root-'));
    mkdirSync(join(at, 'src/northpole'), { recursive: true });
    writeFileSync(join(at, 'src/northpole/disabled.json'), '{ "booths": ["grinch"] }');
    const ballot = `${REPO_URL}/issues/9`;
    const entry = (login: string) => ({ login, url: `${ballot}#issuecomment-1`, votes: 1 });
    const standings = { ballot, booths: [entry('ana'), entry('grinch')], factories: [] };
    expect(peoplesChoice(written(standings), at)).toEqual({
      ballot,
      booths: [entry('ana')],
      factories: [],
    });
  });

  it("knows every square's craft badges, from the repository itself", () => {
    const craft = squareCraft(root);
    expect(craft['attraction/ferris-wheel']).toContain('small-files');
    expect(craft['booth/jedi4ever']).toContain('tested');
    expect(Object.keys(craft)).toContain('level/jedi4ever/cocoa-hut');
  });
});

describe('squareNames', () => {
  it("reads each square's name, capped, and skips a folder with no square or no name", () => {
    const at = mkdtempSync(join(tmpdir(), 'square-names-'));
    const square = (kind: string, id: string, source?: string) => {
      mkdirSync(join(at, 'carnival', `${kind}s`, id), { recursive: true });
      if (source !== undefined)
        writeFileSync(join(at, 'carnival', `${kind}s`, id, `${kind}.ts`), source);
    };
    square(
      'booth',
      'ana',
      `const b = { id: 'ana', name: '${'Cocoa'.repeat(20)}', description: '' };`,
    );
    square('booth', 'empty');
    square('attraction', 'nameless', 'export default {};');
    expect(squareNames(at)).toEqual({ 'booth/ana': 'Cocoa'.repeat(16) });
  });
});
