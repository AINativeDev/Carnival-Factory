import { describe, expect, it } from 'vitest';
import type { HistoryEntry, HistoryPull } from '../scripts/square-history';
import { storySteps } from './build-story';

/** An open pull request: no merge time yet. */
const openPull = (number: number, preview?: string): HistoryPull => ({
  number,
  url: `https://github.com/o/r/pull/${String(number)}`,
  state: 'open',
  findings: 0,
  fixed: 0,
  commits: 1,
  ...(preview ? { preview } : {}),
});
const pull = (number: number, extra: Partial<HistoryPull> = {}): HistoryPull => ({
  number,
  url: `https://github.com/o/r/pull/${String(number)}`,
  state: 'merged',
  findings: 2,
  fixed: 2,
  commits: 3,
  mergedAt: '2026-11-24T15:00:00Z',
  ...extra,
});
const request = (
  issue: number,
  author: string,
  pulls: HistoryPull[],
  extra: Partial<HistoryEntry> = {},
): HistoryEntry => ({
  issue,
  title: `Request ${String(issue)}`,
  url: `https://github.com/o/r/issues/${String(issue)}`,
  author,
  openedAt: '2026-11-24T10:00:00Z',
  decision: 'accepted',
  pulls,
  ...extra,
});

describe('storySteps: how a square was built, oldest first', () => {
  // The build's history lists requests and their pull requests newest first.
  const history = [
    request(143, 'jedi4ever', [pull(151, { findings: 0, fixed: 0 })]),
    request(70, 'sjmaple', [pull(102), pull(72)]),
  ];
  const steps = storySteps(history, { maker: 'sjmaple', improvers: ['jedi4ever'] });

  it('tells it from the first request to the map', () => {
    expect(steps.map((step) => step.kind)).toEqual([
      'asked',
      'built',
      'built',
      'changed',
      'built',
      'live',
    ]);
  });

  it('says who asked, for what and when, linking the request', () => {
    expect(steps[0]).toMatchObject({
      label: 'Asked for by',
      who: 'sjmaple',
      link: { href: 'https://github.com/o/r/issues/70', text: '#70' },
      detail: 'Request 70',
      meta: '24 Nov 2026 · Accepted',
    });
    expect(steps[3]).toMatchObject({ label: 'Change asked for by', who: 'jedi4ever' });
  });

  it('shows what the factory built, with its review findings and fixes', () => {
    expect(steps[1]).toMatchObject({
      label: 'Built by the factory',
      link: { href: 'https://github.com/o/r/pull/72', text: '#72' },
      detail: '2 review findings, 2 fixed, 3 commits',
      meta: 'Merged 24 Nov 2026',
    });
    expect(steps[2]?.label).toBe('Improved by the factory');
    expect(steps[4]?.detail).toBe('no review findings, 3 commits');
  });

  it('ends on the map only once something merged', () => {
    expect(steps.at(-1)).toEqual({ kind: 'live', label: 'On the map' });
    const waiting = storySteps([request(9, 'ana', [openPull(10)])], undefined);
    expect(waiting.map((step) => step.kind)).toEqual(['asked', 'built']);
    expect(waiting[1]).toMatchObject({ label: 'Being built by the factory', meta: 'Open' });
  });

  it("keeps an open pull request's preview", () => {
    const open = storySteps([request(9, 'ana', [openPull(10, 'https://p/x')])], undefined);
    expect(open[1]?.preview).toBe('https://p/x');
  });

  it('falls back to who made it when the build has no history, as in a preview', () => {
    expect(storySteps([], { maker: 'ana', improvers: [] })).toEqual([
      { kind: 'made', label: 'Made by', who: 'ana' },
      { kind: 'live', label: 'On the map' },
    ]);
    expect(storySteps([], undefined)).toEqual([]);
  });
});
