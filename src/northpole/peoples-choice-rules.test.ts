import { describe, expect, it, vi } from 'vitest';
import type { ChoiceEntry } from './peoples-choice';

/**
 * People's Choice's rules as the page first loads them: the build's standings
 * load this module afresh in other tests, so each test here does the same.
 */
const fresh = async () => {
  vi.resetModules();
  return import('./peoples-choice');
};

const REPO = 'https://github.com/o/r';
const BALLOT = `${REPO}/issues/7`;
const entry = (login: string, extra: object = {}): ChoiceEntry & object => ({
  login,
  url: `${BALLOT}#issuecomment-12`,
  votes: 1,
  ...extra,
});

describe("People's Choice, as the page loads it", () => {
  it('names its ballot, and closes on the last second of the year', async () => {
    const { BALLOT_TITLE, VOTING_CLOSES, votingClosed } = await fresh();
    expect([BALLOT_TITLE, VOTING_CLOSES]).toEqual(["People's Choice", '2026-12-31T23:59:59Z']);
    expect(votingClosed(new Date(VOTING_CLOSES))).toBe(false);
    expect(votingClosed(new Date('2027-01-01T00:00:00Z'))).toBe(true);
  });

  it('links a booth to its own comment', async () => {
    const { voteUrl } = await fresh();
    const choice = { ballot: BALLOT, booths: [entry('ana')], factories: [] };
    expect(voteUrl('Ana', choice)).toBe(`${BALLOT}#issuecomment-12`);
  });

  it('keeps entries by a well-formed login only', async () => {
    const { cleanChoice } = await fresh();
    const logins = ['a-b', 'ana', ' ana', 'ana ', 'ana-', 'a--b'];
    const choice = cleanChoice(
      { ballot: BALLOT, booths: logins.map((login) => entry(login)) },
      [],
      REPO,
    );
    expect(choice?.booths.map((kept) => kept.login)).toEqual(['a-b', 'ana']);
  });

  it("keeps a home factory's repository only when it is one", async () => {
    const { cleanChoice } = await fresh();
    const repos = [
      'Ana-b/x.y_z-1',
      'a-b/xy',
      'ana/.github',
      ' ana/x',
      'ana/x y',
      '-ana/x',
      'ana-/x',
      'ana/.',
      'ana/..',
      'not a repo',
      7,
    ];
    const choice = cleanChoice(
      {
        ballot: BALLOT,
        factories: repos.map((repo, n) => entry(`f${String(n)}`, { repo, votes: n })),
      },
      [],
      REPO,
    );
    const kept = choice?.factories.filter((factory) => factory.repo).map((factory) => factory.repo);
    expect(kept?.sort()).toEqual(['Ana-b/x.y_z-1', 'a-b/xy', 'ana/.github'].sort());
  });
});

describe("the standings' entries", () => {
  it('keep a booth with no votes yet, and drop votes that are not whole numbers', async () => {
    const { cleanChoice } = await fresh();
    const choice = cleanChoice(
      {
        ballot: BALLOT,
        booths: [
          entry('none', { votes: 0 }),
          entry('half', { votes: 1.5 }),
          entry('text', { votes: '2' }),
        ],
        factories: 5,
      },
      [],
      REPO,
    );
    expect(choice?.booths.map((kept) => kept.login)).toEqual(['none']);
    expect(choice?.factories).toEqual([]);
    expect(cleanChoice({ ballot: BALLOT }, [], REPO)).toEqual({
      ballot: BALLOT,
      booths: [],
      factories: [],
    });
  });

  it('link only to an issue or a comment on one, of any number, up to 300 characters', async () => {
    const { isBallotUrl } = await fresh();
    expect(isBallotUrl(`${REPO}/issues/123#issuecomment-4567`, REPO)).toBe(true);
    const long = `${REPO}/issues/1#issuecomment-`;
    expect(isBallotUrl(long + '9'.repeat(300 - long.length), REPO)).toBe(true);
    expect(isBallotUrl(long + '9'.repeat(301 - long.length), REPO)).toBe(false);
    expect(isBallotUrl(7, REPO)).toBe(false);
  });
});
