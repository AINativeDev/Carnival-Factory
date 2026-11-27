/**
 * The Elf Engineer form's values at their edges: what parses as a repository
 * or a pull request and what doesn't, exactly what the injection scan is left
 * to read, and a pull request with another number.
 */
import { describe, expect, it } from 'vitest';
import { decideBadge, freeText, parsePullRequest, parseRepository } from './elf-engineer.ts';

describe('parseRepository and parsePullRequest', () => {
  it('read an address over http too', () => {
    expect(parseRepository('http://github.com/octocat/workshop')).toBe('octocat/workshop');
    expect(parsePullRequest('http://github.com/octocat/workshop/pull/3')).toEqual({
      repo: 'octocat/workshop',
      number: 3,
    });
  });

  it('turn down a name that only looks like a repository', () => {
    expect(parseRepository('octocat/..')).toBeUndefined();
    expect(parsePullRequest('https://github.com/octocat/../pull/3')).toBeUndefined();
  });

  it('read a pull request only when its address is the whole answer', () => {
    expect(parsePullRequest('see https://github.com/o/r/pull/1')).toBeUndefined();
    expect(parsePullRequest('https://github.com/o/r/pull/1 please')).toBeUndefined();
  });
});

describe('freeText', () => {
  const form = (repo: string, pull: string) =>
    `### Your repository\r\n\r\n${repo}\r\n\r\n### A pull request the factory opened there\r\n\r\n${pull}\r`;

  it('is the title and body on plain new lines, without the values that parse', () => {
    expect(
      freeText('T', form('octocat/role-play', 'https://github.com/octocat/role-play/pull/3')),
    ).toBe('T\n### Your repository\n\n\n\n### A pull request the factory opened there\n\n\n');
  });
});

describe('decideBadge', () => {
  it('declines a pull request with another number in the same repository', () => {
    const facts = {
      author: 'octocat',
      repoField: 'octocat/workshop',
      pullField: 'https://github.com/octocat/workshop/pull/12',
      repo: { fullName: 'octocat/workshop', private: false, owner: 'octocat' },
      hasTesslJson: true,
      pull: { repo: 'octocat/workshop', number: 13, author: 'tessl-app[bot]', authorIsBot: true },
    };
    expect(decideBadge(facts)).toEqual({
      grant: false,
      reason: "that pull request isn't in octocat/workshop",
    });
  });
});
