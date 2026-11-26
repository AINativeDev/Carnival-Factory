import { describe, expect, it } from 'vitest';
import {
  countVotes,
  entryBody,
  marker,
  missingEntries,
  readMarker,
  standings,
  type RawChoiceComment,
  type StandingsInput,
} from './peoples-choice';

const BALLOT = 'https://github.com/AINativeDev/Carnival-Factory/issues/7';
const CLOSES = '2026-12-31T23:59:59Z';

const OWNERS: Record<string, number> = { jedi4ever: 1, sjmaple: 2, hamzaoza: 3, pstember: 4 };

const vote = (userId: number, createdAt = '2026-12-01T10:00:00Z') => ({ userId, createdAt });

function comment(
  category: 'booth' | 'factory',
  login: string,
  votes: RawChoiceComment['votes'],
  more: Partial<RawChoiceComment> = {},
): RawChoiceComment {
  return {
    url: `${BALLOT}#issuecomment-${login.length}`,
    body: entryBody(category, login, OWNERS[login] ?? 99, undefined, undefined),
    createdAt: '2026-11-25T10:00:00Z',
    viewerDidAuthor: true,
    votes,
    ...more,
  };
}

const input = (
  comments: RawChoiceComment[],
  more: Partial<StandingsInput> = {},
): StandingsInput => ({
  ballot: BALLOT,
  comments,
  booths: ['jedi4ever', 'sjmaple', 'hamzaoza'],
  holders: [{ login: 'pstember', repo: 'pstember/factory' }],
  disabled: [],
  closes: CLOSES,
  ...more,
});

describe('readMarker', () => {
  it('reads whose entry a comment is', () => {
    expect(readMarker(`hello\n${marker('booth', 'Jedi4ever', 1)}`)).toEqual({
      category: 'booth',
      login: 'jedi4ever',
      ownerId: 1,
    });
    expect(readMarker(marker('factory', 'pstember', 4))?.category).toBe('factory');
    expect(readMarker('no marker here')).toBeUndefined();
    expect(readMarker('<!-- peoples-choice:booth:jedi4ever -->')).toBeUndefined();
  });
});

describe('entryBody', () => {
  it('pings no one, and ends with its marker', () => {
    const body = entryBody('booth', 'sjmaple', 2, undefined, 'https://example.github.io/carnival/');
    expect(body).not.toContain('@sjmaple');
    expect(body).toContain('https://example.github.io/carnival/#/booth/sjmaple');
    expect(readMarker(body)).toEqual({ category: 'booth', login: 'sjmaple', ownerId: 2 });
  });

  it('links a home factory to its repository', () => {
    const body = entryBody('factory', 'pstember', 4, 'pstember/factory', undefined);
    expect(body).toContain('https://github.com/pstember/factory');
  });
});

describe('countVotes', () => {
  it("counts one vote per account, and not the owner's own", () => {
    expect(countVotes([vote(10), vote(10), vote(11), vote(1)], 1, CLOSES)).toBe(2);
  });

  it('leaves out votes after closing, and from deleted accounts', () => {
    expect(
      countVotes(
        [vote(10, '2027-01-01T00:00:00Z'), { userId: null, createdAt: '2026-12-01T00:00:00Z' }],
        1,
        CLOSES,
      ),
    ).toBe(0);
  });
});

describe('missingEntries', () => {
  it('lists the booths and factories without a comment of our own', () => {
    const comments = [
      comment('booth', 'jedi4ever', []),
      comment('booth', 'sjmaple', [], { viewerDidAuthor: false }),
    ];
    expect(missingEntries(input(comments), comments)).toEqual([
      { category: 'booth', login: 'sjmaple' },
      { category: 'booth', login: 'hamzaoza' },
      { category: 'factory', login: 'pstember', repo: 'pstember/factory' },
    ]);
  });
});

describe('standings', () => {
  it('ranks the booths and the home factories by the votes that count', () => {
    const result = standings(
      input(
        [
          comment('booth', 'jedi4ever', [vote(1), vote(20)]),
          comment('booth', 'sjmaple', [vote(20), vote(21), vote(22)]),
          comment('booth', 'hamzaoza', [vote(3), vote(3)]),
          comment('booth', 'ana', [vote(20)]),
          comment('factory', 'pstember', [vote(4), vote(20)]),
        ],
        { booths: ['jedi4ever', 'sjmaple', 'hamzaoza', 'ana'] },
      ),
    );
    expect(result.ballot).toBe(BALLOT);
    // A tie goes in order of login.
    expect(result.booths.map((entry) => [entry.login, entry.votes])).toEqual([
      ['sjmaple', 3],
      ['ana', 1],
      ['jedi4ever', 1],
      ['hamzaoza', 0],
    ]);
    expect(result.factories).toEqual([
      expect.objectContaining({ login: 'pstember', votes: 1, repo: 'pstember/factory' }),
    ]);
  });

  it("leaves out the owner's vote by the id in the comment, not by whoever has the login now", () => {
    const renamed = comment('booth', 'jedi4ever', [vote(7), vote(20)], {
      body: entryBody('booth', 'jedi4ever', 7, undefined, undefined),
    });
    expect(standings(input([renamed])).booths).toEqual([
      expect.objectContaining({ login: 'jedi4ever', votes: 1 }),
    ]);
    const withoutId = comment('booth', 'jedi4ever', [vote(20)], {
      body: '<!-- peoples-choice:booth:jedi4ever -->',
    });
    expect(standings(input([withoutId])).booths).toEqual([]);
  });

  it('drops the booths the kill switch closed', () => {
    const result = standings(
      input([comment('booth', 'jedi4ever', [vote(20)]), comment('booth', 'sjmaple', [vote(21)])], {
        disabled: ['SJMaple'],
      }),
    );
    expect(result.booths.map((entry) => entry.login)).toEqual(['jedi4ever']);
  });

  it("ignores comments anyone else wrote, and entries that aren't on the map", () => {
    const result = standings(
      input([
        comment('booth', 'jedi4ever', [vote(20)], { viewerDidAuthor: false }),
        comment('booth', 'nobody', [vote(20)]),
        comment('factory', 'sjmaple', [vote(20)]),
      ]),
    );
    expect(result.booths).toEqual([]);
    expect(result.factories).toEqual([]);
  });

  it("counts an entry's first comment only", () => {
    const result = standings(
      input([
        comment('booth', 'jedi4ever', [vote(20), vote(21)], { createdAt: '2026-11-26T00:00:00Z' }),
        comment('booth', 'jedi4ever', [vote(20)], { createdAt: '2026-11-25T00:00:00Z' }),
      ]),
    );
    expect(result.booths).toEqual([expect.objectContaining({ login: 'jedi4ever', votes: 1 })]);
  });
});
