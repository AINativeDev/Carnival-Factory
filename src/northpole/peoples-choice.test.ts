import { describe, expect, it } from 'vitest';
import {
  cleanChoice,
  isBallotUrl,
  leaders,
  places,
  trophyFor,
  voteUrl,
  votingClosed,
  type ChoiceEntry,
} from './peoples-choice';

const REPO = 'https://github.com/AINativeDev/Northpole-Carnival-Factory';
const BALLOT = `${REPO}/issues/7`;
const at = (n: number) => `${BALLOT}#issuecomment-${n}`;
const entry = (login: string, votes: number): ChoiceEntry => ({ login, url: at(votes), votes });

describe('isBallotUrl', () => {
  it("takes only this repository's issues and their comments", () => {
    expect(isBallotUrl(BALLOT, REPO)).toBe(true);
    expect(isBallotUrl(at(3), REPO)).toBe(true);
    expect(isBallotUrl('https://evil.example/issues/7', REPO)).toBe(false);
    expect(isBallotUrl(`${BALLOT}/../../pulls`, REPO)).toBe(false);
    expect(isBallotUrl(`javascript:alert(1)//${BALLOT}`, REPO)).toBe(false);
    expect(isBallotUrl(`${REPO}/discussions/7`, REPO)).toBe(false);
    expect(isBallotUrl(`${BALLOT}#discussioncomment-3`, REPO)).toBe(false);
  });
});

describe('cleanChoice', () => {
  it('keeps well-formed entries, most votes first, without closed booths', () => {
    const choice = cleanChoice(
      {
        ballot: BALLOT,
        booths: [
          entry('sjmaple', 1),
          entry('jedi4ever', 4),
          entry('closed', 9),
          { login: 'Bad Login', url: at(1), votes: 2 },
          { login: 'badurl', url: 'https://evil.example/', votes: 2 },
          { login: 'badvotes', url: at(1), votes: -1 },
        ],
        factories: [{ ...entry('pstember', 2), repo: 'pstember/factory' }],
      },
      ['Closed'],
      REPO,
    );
    expect(choice?.booths.map((e) => e.login)).toEqual(['jedi4ever', 'sjmaple']);
    expect(choice?.factories[0]).toEqual({ ...entry('pstember', 2), repo: 'pstember/factory' });
  });

  it('gives nothing without a ballot', () => {
    expect(cleanChoice(null, [], REPO)).toBeUndefined();
    expect(cleanChoice({ booths: [] }, [], REPO)).toBeUndefined();
    expect(cleanChoice({ ballot: at(1), booths: [] }, [], REPO)).toBeUndefined();
  });
});

describe('places', () => {
  it('shares a place between ties, and gives none without votes', () => {
    const entries = [entry('a', 5), entry('b', 5), entry('c', 3), entry('d', 0)];
    expect([...places(entries)]).toEqual([
      ['a', 1],
      ['b', 1],
      ['c', 3],
    ]);
  });
});

describe('trophies and leaders', () => {
  const choice = {
    ballot: BALLOT,
    booths: [entry('a', 9), entry('b', 7), entry('c', 5), entry('d', 2), entry('e', 0)],
    factories: [entry('f', 3), entry('g', 1)],
  };

  it('gives the top three booths a trophy', () => {
    expect(['a', 'b', 'c', 'd', 'e'].map((login) => trophyFor(login, choice))).toEqual([
      1,
      2,
      3,
      undefined,
      undefined,
    ]);
    expect(trophyFor('a', undefined)).toBeUndefined();
  });

  it('names the top three booths and the home factory leader', () => {
    const top = leaders(choice);
    expect(top.booths.map((e) => e.login)).toEqual(['a', 'b', 'c']);
    expect(top.factories.map((e) => e.login)).toEqual(['f']);
  });

  it('links a booth to its comment', () => {
    expect(voteUrl('B', choice)).toBe(at(7));
    expect(voteUrl('zz', choice)).toBeUndefined();
  });
});

describe('votingClosed', () => {
  it('closes after the closing time', () => {
    expect(votingClosed(new Date('2026-12-31T23:00:00Z'), '2026-12-31T23:59:59Z')).toBe(false);
    expect(votingClosed(new Date('2027-01-01T00:00:00Z'), '2026-12-31T23:59:59Z')).toBe(true);
  });
});
