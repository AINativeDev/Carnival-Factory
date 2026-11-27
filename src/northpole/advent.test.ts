import { describe, expect, it } from 'vitest';
import calendar from '../../carnival/challenges/advent.json';
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
    expect(cleanCalendar({ year: 2026, challenges: 'all of them' })).toEqual({
      year: 2026,
      challenges: [],
    });
  });

  it('keeps the first and the last day, and a challenge exactly as written', () => {
    const clean = cleanCalendar({
      year: 2026,
      challenges: [
        { ...challenge, day: 24 },
        { day: 1, title: ' T ', do: 'D', check: 'C', docs: 'https://docs.tessl.io/x', more: 1 },
      ],
    });
    expect(clean.challenges).toEqual([
      { day: 1, title: ' T ', do: 'D', check: 'C', docs: 'https://docs.tessl.io/x' },
      { ...challenge, day: 24 },
    ]);
  });

  it('drops a day that is not a whole number, and a field that is missing or not text', () => {
    const clean = cleanCalendar({
      year: 2026,
      challenges: [
        { ...challenge, day: 1.5 },
        { ...challenge, day: '2' },
        { ...challenge, day: 3, title: 7 },
        { ...challenge, day: 4, do: undefined },
        { ...challenge, day: 5, title: '' },
        { ...challenge, day: 6, docs: 'see https://docs.tessl.io/' },
        { ...challenge, day: 7, docs: 'http://docs.tessl.io/' },
        Object.assign(() => 0, { ...challenge, day: 8 }),
        null,
      ],
    });
    expect(clean.challenges).toEqual([]);
  });

  it('reads a year that is not a whole number as none', () => {
    expect(cleanCalendar({ year: '2026', challenges: [] }).year).toBe(0);
    expect(cleanCalendar({ year: 2026.5, challenges: [] }).year).toBe(0);
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

  it('hangs nothing for a missing count', () => {
    expect(decorationsFor(undefined)).toEqual(decorationsFor(0));
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

  it('counts only whole challenges', () => {
    expect(decorationsFor(6.9)).toEqual({ ornaments: 6, lights: false, star: false, sign: false });
    expect(decorationsFor(0.5).ornaments).toBe(0);
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
    expect(cleanCounts('ab')).toEqual({});
    const counted = Object.assign(() => 0, { ana: 3 });
    expect(cleanCounts(counted)).toEqual({});
  });

  it('keeps a count of 1 and of 24, the first and the last day', () => {
    expect(cleanCounts({ ana: 1, bob: 24, 'a-b': 2, '-ab': 2, ['a'.repeat(40)]: 2 })).toEqual({
      ana: 1,
      bob: 24,
      'a-b': 2,
    });
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
