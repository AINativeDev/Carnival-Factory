import { beforeEach, describe, expect, it, vi } from 'vitest';
import * as loadedOnce from './ownership';

/**
 * Loaded afresh before each test: who the maintainers and the factory's bots
 * are is set as the module loads, so a test that loaded it once would never
 * see a change to them.
 */
let {
  approvedByMaintainer,
  boothOwner,
  escapeCommand,
  filesOutsideBooth,
  isDependencyUpdate,
  isFactory,
  isMaintainer,
  levelFolder,
  MAINTAINERS,
} = loadedOnce;
beforeEach(async () => {
  vi.resetModules();
  ({
    approvedByMaintainer,
    boothOwner,
    escapeCommand,
    filesOutsideBooth,
    isDependencyUpdate,
    isFactory,
    isMaintainer,
    levelFolder,
    MAINTAINERS,
  } = await import('./ownership'));
});

/**
 * The ownership rule at its edges: each character a pattern accepts, each
 * side of each condition, and the exact text a log command gets. A slip in
 * any of these lets a pull request change what it shouldn't.
 */

describe('the maintainers', () => {
  it('are exactly the one account, known by its id', () => {
    expect(MAINTAINERS).toEqual([{ login: 'jedi4ever', id: 70908 }]);
    expect(isMaintainer({ id: 70908 })).toBe(true);
    expect(isMaintainer({ id: 70909 })).toBe(false);
  });
});

describe('who owns a pull request, at its edges', () => {
  it("knows the factory's bot in any case, and only as a bot", () => {
    expect(isFactory({ login: 'Tessl-App[bot]', id: 3, isBot: true })).toBe(true);
    expect(isFactory({ login: 'tessl-app[bot]', id: 3, isBot: false })).toBe(false);
    expect(isFactory({ login: 'tessl-app', id: 3, isBot: true })).toBe(false);
  });

  it('gives the whole person, id and all, with the login in lower case', () => {
    expect(boothOwner({ login: 'Rudolph', id: 1, isBot: false }, undefined)).toEqual({
      login: 'rudolph',
      id: 1,
      isBot: false,
    });
    const factory = { login: 'tessl-app[bot]', id: 3, isBot: true };
    expect(boothOwner(factory, { login: 'Comet', id: 2, isBot: false })).toEqual({
      login: 'comet',
      id: 2,
      isBot: false,
    });
  });

  it("puts a participant's level in the lower-case folder of their login", () => {
    expect(levelFolder('Comet')).toBe('carnival/levels/comet/');
    const comet = { login: 'Comet', id: 2, isBot: false };
    expect(
      filesOutsideBooth(comet, [
        'carnival/booths/comet/booth.ts',
        'carnival/levels/comet/level.ts',
        'carnival/levels/Comet/level.ts',
        'x/carnival/booths/comet/booth.ts',
      ]),
    ).toEqual(['carnival/levels/Comet/level.ts', 'x/carnival/booths/comet/booth.ts']);
  });
});

describe('a dependency update, at its edges', () => {
  const dependabot = { login: 'dependabot[bot]', id: 49699333, isBot: true };
  const only = (file: string) => isDependencyUpdate(dependabot, [file]);

  it('changes the lock file alone, or a workflow named with dots, dashes and either ending', () => {
    expect(only('package-lock.json')).toBe(true);
    expect(only('package.json')).toBe(true);
    expect(only('.github/workflows/auto-merge_booths.v2.yaml')).toBe(true);
    expect(only('.github/workflows/a.yml')).toBe(true);
  });

  it('changes nothing that only looks like one of them', () => {
    for (const file of [
      'x/package.json',
      'package.json5',
      'src/package-lock.json',
      'x.github/workflows/ci.yml',
      'agithub/workflows/ci.yml',
      '.github/workflowsXci.yml',
      '.github/workflows/ci.yml.bak',
      '.github/workflows/ci.yaaml',
      '.github/workflows/ci.ml',
      '.github/workflows/ciXyml',
      '.github/workflows/.yml',
      '.github/workflows/c i.yml',
      '.github/workflows/c$i.yml',
    ])
      expect(only(file), file).toBe(false);
  });
});

describe('escapeCommand, character by character', () => {
  it('escapes each of %, carriage return, newline, colon and comma, and nothing else', () => {
    expect(escapeCommand('a%b\rc\nd:e,f')).toBe('a%25b%0Dc%0Ad%3Ae%2Cf');
    expect(escapeCommand('%%\n\n::,,')).toBe('%25%25%0A%0A%3A%3A%2C%2C');
    expect(escapeCommand('carnival/booths/elf-1/a_b.ts')).toBe('carnival/booths/elf-1/a_b.ts');
  });
});

describe('approvedByMaintainer, at its edges', () => {
  it('counts only the tessl label being added, by a known actor', () => {
    const by = (id: number) => ({ id });
    expect(
      approvedByMaintainer([{ event: 'unlabeled', label: { name: 'tessl' }, actor: by(70908) }]),
    ).toBe(false);
    expect(approvedByMaintainer([{ event: 'labeled', actor: by(70908) }])).toBe(false);
    expect(
      approvedByMaintainer([{ event: 'labeled', label: { name: 'tessl' }, actor: null }]),
    ).toBe(false);
    expect(approvedByMaintainer([{ event: 'labeled', label: { name: 'tessl' } }])).toBe(false);
    expect(
      approvedByMaintainer([
        { event: 'labeled', label: { name: 'tessl' }, actor: by(70908) },
        { event: 'unlabeled', label: { name: 'tessl' }, actor: by(42) },
        { event: 'labeled', label: { name: 'other' }, actor: by(42) },
      ]),
    ).toBe(true);
  });
});
