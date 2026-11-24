import { describe, expect, it } from 'vitest';
import { filesOutsideBooth, linkedIssue, boothFolder, boothOwner } from './ownership';

const REPO = 'AINativeDev/Northpole-Carnival-Factory';

describe('linkedIssue', () => {
  it("reads the factory's issue marker", () => {
    const body = `Adds a sled.\n\n<!-- tessl-factory:issue: ${REPO}#12 -->\nCloses #12`;
    expect(linkedIssue(body, REPO)).toBe(12);
  });

  it('ignores a marker for another repository, without falling back to Closes', () => {
    expect(linkedIssue('<!-- tessl-factory:issue: someone/else#3 -->\nCloses #3', REPO)).toBe(
      undefined,
    );
  });

  it('falls back to a single closing reference', () => {
    expect(linkedIssue('Fixes #7', REPO)).toBe(7);
    expect(linkedIssue('closes #7, and closes #7 again', REPO)).toBe(7);
  });

  it('gives up when the pull request closes more than one issue', () => {
    expect(linkedIssue('Closes #7\nCloses #8', REPO)).toBeUndefined();
    expect(linkedIssue('No issue here', REPO)).toBeUndefined();
  });
});

describe('boothOwner', () => {
  it('gives a person their own pull request', () => {
    expect(boothOwner({ login: 'Rudolph', isBot: false }, { login: 'comet', isBot: false })).toBe(
      'rudolph',
    );
  });

  it("gives a bot's pull request to the issue's author", () => {
    expect(
      boothOwner({ login: 'tessl-app[bot]', isBot: true }, { login: 'Comet', isBot: false }),
    ).toBe('comet');
  });

  it("gives another bot's pull request to nobody, whoever wrote the issue", () => {
    expect(
      boothOwner({ login: 'evil-app[bot]', isBot: true }, { login: 'jedi4ever', isBot: false }),
    ).toBeUndefined();
  });

  it('gives a bot nothing without a person behind it', () => {
    expect(boothOwner({ login: 'tessl-app[bot]', isBot: true }, undefined)).toBeUndefined();
    expect(
      boothOwner({ login: 'tessl-app[bot]', isBot: true }, { login: 'dependabot', isBot: true }),
    ).toBeUndefined();
  });
});

describe('filesOutsideBooth', () => {
  it("allows changes inside the owner's booth", () => {
    expect(filesOutsideBooth('comet', ['booths/comet/booth.ts', 'booths/comet/README.md'])).toEqual(
      [],
    );
  });

  it("flags everything else, a neighbour's booth included", () => {
    expect(
      filesOutsideBooth('comet', [
        'booths/comet/booth.ts',
        'booths/cupid/booth.ts',
        'booths/comet-two/booth.ts',
        'northpole/map.ts',
      ]),
    ).toEqual(['booths/cupid/booth.ts', 'booths/comet-two/booth.ts', 'northpole/map.ts']);
  });

  it('lets maintainers change anything', () => {
    expect(filesOutsideBooth('jedi4ever', ['package.json', 'booths/cupid/booth.ts'])).toEqual([]);
  });

  it('uses the lower-case login as the folder', () => {
    expect(boothFolder('Comet')).toBe('booths/comet/');
  });
});
