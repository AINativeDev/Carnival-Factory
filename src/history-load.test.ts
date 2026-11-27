import { describe, expect, it } from 'vitest';
import { readHistory, loadHistoryFile } from './history';

const history = { squares: { 'booth/ana': [] }, credits: {} };
const answer =
  (body: unknown, ok = true) =>
  () =>
    Promise.resolve({ ok, json: () => Promise.resolve(body) } as Response);

describe('loading the history a preview has beside it', () => {
  it('reads the file the deploy put next to the page', async () => {
    const asked: string[] = [];
    const fetchFile = (url: string) => {
      asked.push(url);
      return answer(history)();
    };
    expect(await loadHistoryFile(fetchFile)).toEqual(history);
    expect(asked).toEqual(['square-history.json']);
  });

  it('treats a missing, unreadable or malformed file as no history', async () => {
    expect(await loadHistoryFile(answer(history, false))).toBeUndefined();
    expect(await loadHistoryFile(() => Promise.reject(new Error('offline')))).toBeUndefined();
    expect(await loadHistoryFile(answer({ squares: 'nope' }))).toBeUndefined();
  });
});

describe('readHistory', () => {
  it('keeps only something shaped like a history', () => {
    expect(readHistory(history)).toEqual(history);
    expect(readHistory(null)).toBeUndefined();
    expect(readHistory([])).toBeUndefined();
    expect(readHistory('history')).toBeUndefined();
    expect(readHistory({})).toBeUndefined();
    expect(readHistory({ squares: null })).toBeUndefined();
    expect(readHistory({ squares: 'booth/ana' })).toBeUndefined();
    expect(readHistory({ squares: {} })).toEqual({ squares: {} });
    expect(readHistory({ squares: { 'booth/ana': 'nope' } })).toBeUndefined();
  });
});
