import { describe, expect, it } from 'vitest';
import type { HistoryPull, SquareHistory } from '../scripts/square-history';
import {
  creditsFor,
  day,
  emptyHistoryText,
  historyOf,
  pullState,
  pullSummary,
  decisionText,
  safeHref,
} from './history';

const merged: HistoryPull = {
  number: 79,
  url: 'https://github.com/o/r/pull/79',
  state: 'merged',
  findings: 2,
  fixed: 1,
  commits: 3,
  mergedAt: '2026-11-24T15:18:46Z',
};

describe('creditsFor', () => {
  const data: SquareHistory = {
    builtAt: '',
    squares: {},
    credits: {
      'booth/ana': { maker: 'ana', improvers: ['bob'] },
      'attraction/ferris-wheel': { improvers: ['jedi4ever'] },
    },
  };

  it("reads a square's credits from the build's history", () => {
    expect(creditsFor(data, 'booth', 'Ana')).toEqual({ maker: 'ana', improvers: ['bob'] });
    expect(creditsFor(data, 'attraction', 'ferris-wheel')).toEqual({ improvers: ['jedi4ever'] });
  });

  it('credits a booth to its owner, and an attraction to nobody, without any', () => {
    expect(creditsFor(data, 'booth', 'carol')).toEqual({ maker: 'carol', improvers: [] });
    expect(creditsFor(undefined, 'booth', 'carol')).toEqual({ maker: 'carol', improvers: [] });
    expect(creditsFor(undefined, 'attraction', 'ferris-wheel')).toBeUndefined();
  });
});

describe('historyOf', () => {
  it("finds a square's requests, and none without data", () => {
    const data: SquareHistory = { builtAt: '', squares: { 'booth/ana': [] }, credits: {} };
    expect(historyOf(data, 'booth', 'Ana')).toBe(data.squares['booth/ana']);
    expect(historyOf(data, 'attraction', 'ferris-wheel')).toEqual([]);
    expect(historyOf(undefined, 'booth', 'ana')).toEqual([]);
  });
});

describe('emptyHistoryText', () => {
  it('says why a square has no timeline', () => {
    expect(emptyHistoryText({ builtAt: '', squares: {}, credits: {} })).toBe(
      'No requests for this square are on record in this build.',
    );
    expect(emptyHistoryText(undefined)).toBe('Timelines appear once this is on the live map.');
  });
});

describe('day', () => {
  it('reads the same everywhere', () => {
    expect(day('2026-11-24T23:59:00Z')).toBe('24 Nov 2026');
    expect(day('not a date')).toBe('');
  });
});

describe('pullSummary and pullState', () => {
  it('says how a pull request went', () => {
    expect(pullSummary(merged)).toBe('2 review findings, 1 fixed, 3 commits');
    expect(pullSummary({ ...merged, findings: 0, fixed: 0, commits: 1 })).toBe(
      'no review findings, 1 commit',
    );
    expect(pullState(merged)).toBe('Merged 24 Nov 2026');
    expect(pullState({ ...merged, state: 'open', mergedAt: undefined })).toBe('Open');
    expect(pullState({ ...merged, state: 'closed', mergedAt: undefined })).toBe(
      'Closed without merging',
    );
  });
});

describe('decisionText', () => {
  it('says what the assessment decided, in words', () => {
    expect(decisionText('accepted')).toBe('Accepted');
    expect(decisionText('question')).toBe('Asked a question');
    expect(decisionText('waiting')).toBe('Waiting for the assessment');
  });
});

describe('safeHref', () => {
  it('keeps https links and drops anything else', () => {
    expect(safeHref('https://github.com/o/r/issues/1')).toBe('https://github.com/o/r/issues/1');
    expect(safeHref('javascript:alert(1)')).toBe('#');
  });
});
