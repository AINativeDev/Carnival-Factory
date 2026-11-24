import { describe, expect, it } from 'vitest';
import { filesOutsidePlot, linkedIssue, plotFolder, plotOwner } from './ownership';

const REPO = 'AINativeDev/carnival-christmas-public';

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

describe('plotOwner', () => {
  it('gives a person their own pull request', () => {
    expect(plotOwner({ login: 'Rudolph', isBot: false }, { login: 'comet', isBot: false })).toBe(
      'rudolph',
    );
  });

  it("gives a bot's pull request to the issue's author", () => {
    expect(
      plotOwner({ login: 'tessl-app[bot]', isBot: true }, { login: 'Comet', isBot: false }),
    ).toBe('comet');
  });

  it('gives a bot nothing without a person behind it', () => {
    expect(plotOwner({ login: 'tessl-app[bot]', isBot: true }, undefined)).toBeUndefined();
    expect(
      plotOwner({ login: 'tessl-app[bot]', isBot: true }, { login: 'dependabot', isBot: true }),
    ).toBeUndefined();
  });
});

describe('filesOutsidePlot', () => {
  it("allows changes inside the owner's plot", () => {
    expect(
      filesOutsidePlot('comet', ['src/plots/comet/plot.ts', 'src/plots/comet/README.md']),
    ).toEqual([]);
  });

  it("flags everything else, a neighbour's plot included", () => {
    expect(
      filesOutsidePlot('comet', [
        'src/plots/comet/plot.ts',
        'src/plots/cupid/plot.ts',
        'src/plots/comet-two/plot.ts',
        'src/northpole/map.ts',
      ]),
    ).toEqual(['src/plots/cupid/plot.ts', 'src/plots/comet-two/plot.ts', 'src/northpole/map.ts']);
  });

  it('lets maintainers change anything', () => {
    expect(filesOutsidePlot('jedi4ever', ['package.json', 'src/plots/cupid/plot.ts'])).toEqual([]);
  });

  it('uses the lower-case login as the folder', () => {
    expect(plotFolder('Comet')).toBe('src/plots/comet/');
  });
});
