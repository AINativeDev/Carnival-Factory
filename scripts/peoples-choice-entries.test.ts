/**
 * People's Choice word for word: each entry's comment, which entries a
 * ballot still needs, a vote at the very moment voting closes, and a login
 * that has both a booth and a home factory.
 */
import { describe, expect, it } from 'vitest';
import {
  countVotes,
  entryBody,
  marker,
  missingEntries,
  standings,
  type RawChoiceComment,
} from './peoples-choice';

const SITE = 'https://example.github.io/carnival/';
const BALLOT = 'https://github.com/o/r/issues/7';

describe('entryBody', () => {
  it('is a booth’s title, its link, how to vote, and its marker', () => {
    expect(entryBody('booth', 'ana', 2, undefined, SITE).split('\n')).toEqual([
      '**Booth: ＠ana**',
      `Visit it: ${SITE}#/booth/ana`,
      '',
      'Vote for this booth with a 👍 on this comment.',
      '',
      marker('booth', 'ana', 2),
    ]);
  });

  it('is a home factory’s title, its repository, how to vote, and its marker', () => {
    expect(entryBody('factory', 'ana', 2, 'ana/my factory', undefined).split('\n')).toEqual([
      '**Home factory: ＠ana**',
      'See it: https://github.com/ana/my%20factory',
      '',
      'Vote for this home factory with a 👍 on this comment.',
      '',
      marker('factory', 'ana', 2),
    ]);
  });

  it('leaves the link out when there is nothing to link', () => {
    expect(entryBody('booth', 'ana', 2, undefined, undefined).split('\n')).toHaveLength(5);
    expect(entryBody('factory', 'ana', 2, undefined, SITE).split('\n')).toHaveLength(5);
  });
});

const comment = (body: string, more: Partial<RawChoiceComment> = {}): RawChoiceComment => ({
  url: `${BALLOT}#issuecomment-1`,
  body,
  createdAt: '2026-11-25T10:00:00Z',
  viewerDidAuthor: true,
  votes: [],
  ...more,
});

describe('missingEntries', () => {
  it('passes over comments with no marker, and counts a factory that has its comment', () => {
    const comments = [comment('Thanks for running this!'), comment(marker('factory', 'ana', 2))];
    const entrants = { booths: [], holders: [{ login: 'ana', repo: 'ana/factory' }] };
    expect(missingEntries(entrants, comments)).toEqual([]);
  });
});

describe('countVotes', () => {
  it('counts a vote given the moment voting closes', () => {
    const closes = '2026-12-31T23:59:59Z';
    expect(countVotes([{ userId: 5, createdAt: closes }], 1, closes)).toBe(1);
  });
});

describe('standings', () => {
  it('gives a booth no repository, even when its owner has a home factory too', () => {
    const result = standings({
      ballot: BALLOT,
      comments: [comment(marker('booth', 'ana', 2))],
      booths: ['ana'],
      holders: [{ login: 'ana', repo: 'ana/factory' }],
      disabled: [],
      closes: '2026-12-31T23:59:59Z',
    });
    expect(result.booths).toEqual([{ login: 'ana', url: `${BALLOT}#issuecomment-1`, votes: 0 }]);
  });
});
