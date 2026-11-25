import { describe, expect, it } from 'vitest';
import calendar from '../carnival/challenges/advent.json';
import {
  ADVENT_DAYS,
  adventCountFor,
  cleanCalendar,
  cleanCounts,
  decorationsFor,
  isDoorOpen,
  isDoorOpenAnywhere,
} from './advent';

describe('carnival/challenges/advent.json', () => {
  it('has a well-formed challenge for every day from 1 to 24', () => {
    const clean = cleanCalendar(calendar);
    expect(clean.challenges.map((challenge) => challenge.day)).toEqual(
      Array.from({ length: ADVENT_DAYS }, (_, i) => i + 1),
    );
    expect(clean.challenges).toEqual(calendar.challenges);
    expect(clean.year).toBe(calendar.year);
  });

  it('links every challenge to the Tessl docs', () => {
    for (const challenge of calendar.challenges)
      expect(challenge.docs).toMatch(/^https:\/\/docs\.tessl\.io\//);
  });
});

describe('cleanCalendar', () => {
  const challenge = { day: 2, title: 'T', do: 'D', check: 'C', docs: 'https://docs.tessl.io/' };

  it('keeps one challenge a day, in day order', () => {
    const clean = cleanCalendar({
      year: 2026,
      challenges: [challenge, { ...challenge, day: 1 }, { ...challenge, title: 'Again' }],
    });
    expect(clean.challenges.map((c) => [c.day, c.title])).toEqual([
      [1, 'T'],
      [2, 'T'],
    ]);
  });

  it('drops days out of range, missing text and links that are not https', () => {
    const clean = cleanCalendar({
      year: 2026,
      challenges: [
        { ...challenge, day: 0 },
        { ...challenge, day: 25 },
        { ...challenge, day: 3, check: ' ' },
        { ...challenge, day: 4, docs: 'javascript:alert(1)' },
        'nonsense',
      ],
    });
    expect(clean.challenges).toEqual([]);
  });

  it('reads nonsense as an empty calendar', () => {
    expect(cleanCalendar(null)).toEqual({ year: 0, challenges: [] });
  });
});

describe('isDoorOpen', () => {
  it('opens each door at midnight on its day, in the visitor’s own time', () => {
    expect(isDoorOpen(1, new Date(2026, 10, 30, 23, 59), 2026)).toBe(false);
    expect(isDoorOpen(1, new Date(2026, 11, 1, 0, 0), 2026)).toBe(true);
    expect(isDoorOpen(24, new Date(2026, 11, 23, 12), 2026)).toBe(false);
    expect(isDoorOpen(24, new Date(2026, 11, 24), 2026)).toBe(true);
  });

  it('keeps every door open after the season', () => {
    expect(isDoorOpen(24, new Date(2027, 2, 1), 2026)).toBe(true);
  });
});

describe('isDoorOpenAnywhere', () => {
  it('opens a door once its day has begun in the earliest time zone', () => {
    expect(isDoorOpenAnywhere(5, new Date(Date.UTC(2026, 11, 4, 9, 59)), 2026)).toBe(false);
    expect(isDoorOpenAnywhere(5, new Date(Date.UTC(2026, 11, 4, 10, 0)), 2026)).toBe(true);
  });
});

describe('decorationsFor', () => {
  it('starts bare', () => {
    expect(decorationsFor(0)).toEqual({ ornaments: 0, lights: false, star: false, sign: false });
  });

  it('hangs an ornament for each of the first six challenges', () => {
    expect(decorationsFor(1).ornaments).toBe(1);
    expect(decorationsFor(6)).toEqual({ ornaments: 6, lights: false, star: false, sign: false });
  });

  it('strings lights next, then a star after 12, then a glowing sign after 24', () => {
    expect(decorationsFor(7)).toEqual({ ornaments: 6, lights: true, star: false, sign: false });
    expect(decorationsFor(11).star).toBe(false);
    expect(decorationsFor(12)).toEqual({ ornaments: 6, lights: true, star: true, sign: false });
    expect(decorationsFor(23).sign).toBe(false);
    expect(decorationsFor(24)).toEqual({ ornaments: 6, lights: true, star: true, sign: true });
  });

  it('reads anything out of range as the nearest count', () => {
    expect(decorationsFor(-3)).toEqual(decorationsFor(0));
    expect(decorationsFor(99)).toEqual(decorationsFor(24));
    expect(decorationsFor(Number.NaN)).toEqual(decorationsFor(0));
  });
});

describe('cleanCounts', () => {
  it('keeps well-formed logins, in lower case, with 1 to 24 challenges', () => {
    expect(
      cleanCounts({ Octocat: 3, 'bad login': 2, zero: 0, many: 25, half: 1.5, word: '4' }),
    ).toEqual({ octocat: 3 });
  });

  it('reads nonsense as no counts', () => {
    expect(cleanCounts([1, 2])).toEqual({});
    expect(cleanCounts(null)).toEqual({});
  });
});

describe('adventCountFor', () => {
  it('finds an owner’s count whatever the case of their login, and 0 for anyone else', () => {
    const counts = { octocat: 5 };
    expect(adventCountFor('OctoCat', counts)).toBe(5);
    expect(adventCountFor('someone', counts)).toBe(0);
    expect(adventCountFor('constructor', counts)).toBe(0);
  });
});
