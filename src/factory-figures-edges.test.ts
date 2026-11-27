import { describe, expect, it } from 'vitest';
import type { FactoryStats } from '../scripts/factory-stats';
import { readFactoryStats, updatedAt } from './factory-figures';

const counts = {
  builds: 0,
  merged: 0,
  autoMerged: 0,
  requests: 0,
  accepted: 0,
  question: 0,
  declined: 0,
  findings: 0,
  fixed: 0,
};
const at = (readAt: unknown, extra: object = {}) =>
  readFactoryStats({ ...counts, readAt, ...extra });

describe("the factory's numbers, checked", () => {
  it('keeps counts of none, a time to the minute or the second, and no time to the map', () => {
    const read: FactoryStats | undefined = at('2026-11-24T08:05Z');
    expect(read).toEqual({ ...counts, readAt: '2026-11-24T08:05Z' });
    expect(at('2026-11-24T08:05:09Z')?.readAt).toBe('2026-11-24T08:05:09Z');
  });

  it('drops a count that is not a whole number', () => {
    expect(at('2026-11-24T08:05Z', { builds: '3' })).toBeUndefined();
    expect(at('2026-11-24T08:05Z', { builds: 1.5 })).toBeUndefined();
  });

  it('drops a time that is not one, or has anything round it', () => {
    for (const readAt of [
      5,
      'x2026-11-24T08:05Z',
      '2026-11-24T08:05Zx',
      '2026-13-45T08:05Z',
      '2026-11-24T08:05',
    ])
      expect(at(readAt), String(readAt)).toBeUndefined();
    expect(readFactoryStats(null)).toBeUndefined();
  });

  it('keeps the time to the map only with a fastest, a median and at least one request', () => {
    const toMap = { fastest: 0, median: 0, count: 1 };
    expect(at('2026-11-24T08:05Z', { toMap })?.toMap).toEqual(toMap);
    expect(at('2026-11-24T08:05Z', { toMap: { ...toMap, count: 0 } })?.toMap).toBeUndefined();
    expect(at('2026-11-24T08:05Z', { toMap: { ...toMap, median: -1 } })?.toMap).toBeUndefined();
    expect(at('2026-11-24T08:05Z', { toMap: { ...toMap, fastest: 'x' } })?.toMap).toBeUndefined();
  });
});

describe('when the numbers were read', () => {
  it('pads the hours and minutes to two digits', () => {
    expect(updatedAt('2026-01-02T08:05:00Z')).toBe('2 Jan 2026, 08:05 UTC');
  });
});
