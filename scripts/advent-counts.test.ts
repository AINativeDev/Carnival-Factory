import { describe, expect, it } from 'vitest';
import {
  acceptMarker,
  ADVENT_MARKER,
  adventCounts,
  readAccepted,
  type AdventRecord,
} from './advent';

describe('readAccepted', () => {
  it('reads back the day an acceptance marks', () => {
    expect(readAccepted(`${ADVENT_MARKER}\n${acceptMarker(9)}\nWell done!`)).toBe(9);
    expect(readAccepted('<!-- advent-done: 30 -->')).toBeUndefined();
    expect(readAccepted('no marker')).toBeUndefined();
  });
});

describe('adventCounts', () => {
  const app = { login: 'tessl-app[bot]', type: 'Bot' };
  const accept = (day: number, at = '2026-12-05T00:00:00Z') => ({
    user: app,
    body: `${ADVENT_MARKER}\n${acceptMarker(day)}\nWell done!`,
    created_at: at,
  });
  const record = (
    number: number,
    login: string,
    comments: AdventRecord['comments'],
    labels: string[] = ['advent-done', 'accepted'],
  ): AdventRecord => ({
    issue: { number, user: { login }, labels: labels.map((name) => ({ name })) },
    comments,
  });

  it('counts each participant’s accepted days, once a day', () => {
    expect(
      adventCounts([
        record(1, 'Octocat', [accept(1)]),
        record(2, 'octocat', [accept(2)]),
        record(3, 'octocat', [accept(2)]),
        record(4, 'elf', [accept(5)]),
      ]),
    ).toEqual({ elf: 1, octocat: 2 });
  });

  it('only counts acceptances the Tessl App wrote', () => {
    const forged = { ...accept(1), user: { login: 'octocat', type: 'User' } };
    expect(adventCounts([record(1, 'octocat', [forged])])).toEqual({});
  });

  it('goes by the latest decision, and skips anything labelled declined', () => {
    const declined = {
      user: app,
      body: `${ADVENT_MARKER}\nNot this time.`,
      created_at: '2026-12-06T00:00:00Z',
    };
    expect(
      adventCounts([
        record(1, 'octocat', [accept(1), declined]),
        record(2, 'octocat', [accept(2)], ['advent-done', 'declined']),
      ]),
    ).toEqual({});
  });
});
