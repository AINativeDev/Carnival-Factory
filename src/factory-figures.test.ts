import { describe, expect, it } from 'vitest';
import type { FactoryStats } from '../scripts/factory-stats';
import {
  factoryFigures,
  factoryNote,
  number,
  readFactoryStats,
  squareCounts,
  updatedAt,
} from './factory-figures';

const stats: FactoryStats = {
  builds: 41,
  merged: 37,
  autoMerged: 33,
  requests: 58,
  accepted: 45,
  question: 6,
  declined: 4,
  findings: 1204,
  fixed: 1100,
  toMap: { fastest: 12, median: 38, count: 30 },
  readAt: '2026-11-24T18:57:03.120Z',
};

describe('squareCounts', () => {
  it('counts the booths, the attractions and the distinct owners', () => {
    expect(squareCounts(['ana', 'Bob', 'bob'], ['ferris-wheel'])).toEqual({
      booths: 3,
      attractions: 1,
      people: 2,
    });
  });
});

describe('readFactoryStats', () => {
  it('keeps the numbers the build wrote', () => {
    expect(readFactoryStats(JSON.parse(JSON.stringify(stats)))).toEqual(stats);
  });

  it('keeps only whole numbers and an ISO time, so no text reaches the page', () => {
    const read = readFactoryStats({
      ...stats,
      title: '<img src=x onerror=alert(1)>',
      author: 'someone',
      toMap: { fastest: 12, median: 38, count: 30, url: 'https://evil.example' },
    });
    expect(read).toEqual(stats);
    expect(JSON.stringify(read)).not.toMatch(/img|someone|evil/);
  });

  it('turns down numbers that are text, and dates that are anything else', () => {
    expect(readFactoryStats({ ...stats, builds: '41 <b>' })).toBeUndefined();
    expect(readFactoryStats({ ...stats, merged: -1 })).toBeUndefined();
    expect(readFactoryStats({ ...stats, fixed: 1.5 })).toBeUndefined();
    expect(readFactoryStats({ ...stats, readAt: 'Tuesday <script>' })).toBeUndefined();
    expect(readFactoryStats(undefined)).toBeUndefined();
    expect(readFactoryStats('41')).toBeUndefined();
    expect(readFactoryStats({ ...stats, toMap: { fastest: 'soon', median: 3, count: 1 } })).toEqual(
      { ...stats, toMap: undefined },
    );
  });
});

describe('factoryFigures', () => {
  const squares = { booths: 23, attractions: 1, people: 23 };

  it("shows the map's counts and the factory's numbers", () => {
    expect(factoryFigures(squares, stats)).toEqual([
      { value: '23', label: 'booths on the map' },
      { value: '1', label: 'attraction' },
      { value: '23', label: 'people with a booth' },
      {
        value: '41',
        label: 'factory builds, 37 merged',
        detail: '33 merged on their own, 4 with a maintainer',
      },
      {
        value: '58',
        label: 'booth requests',
        detail: '45 accepted, 6 asked a question, 4 declined',
      },
      { value: '1,204', label: 'review findings', detail: '1,100 fixed' },
      {
        value: '12',
        label: 'minutes from accepted request to map, at the fastest',
        detail: 'typically 38 minutes, over 30 requests',
      },
    ]);
  });

  it("shows only the map's own counts without the factory's numbers", () => {
    expect(factoryFigures({ booths: 1, attractions: 2, people: 1 })).toEqual([
      { value: '1', label: 'booth on the map' },
      { value: '2', label: 'attractions' },
      { value: '1', label: 'person with a booth' },
    ]);
    expect(factoryNote()).toMatch(/appear on the live map/);
  });

  it('leaves out the time to the map when no request has merged', () => {
    const unmerged: FactoryStats = { ...stats };
    delete unmerged.toMap;
    const labels = factoryFigures(squares, unmerged).map((f) => f.label);
    expect(labels.some((label) => label.includes('minute'))).toBe(false);
  });
});

describe('updatedAt', () => {
  it('says when the numbers were read, the same wherever the visitor is', () => {
    expect(updatedAt(stats.readAt)).toBe('24 Nov 2026, 18:57 UTC');
    expect(factoryNote(stats)).toBe('Last updated 24 Nov 2026, 18:57 UTC.');
    expect(updatedAt('not a date')).toBe('');
  });

  it('separates thousands', () => {
    expect(number(7)).toBe('7');
    expect(number(1234567)).toBe('1,234,567');
  });
});
