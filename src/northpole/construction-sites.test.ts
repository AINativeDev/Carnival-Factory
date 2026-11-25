import { describe, expect, it } from 'vitest';
import { MAX_PENDING, readPending, type PendingBooth } from './construction-sites';

const entry = (login: string, issue: number, plot: number): PendingBooth => ({
  login,
  issue,
  plot,
  stage: 'building',
});

describe('readPending', () => {
  it('keeps only the login, the issue, the plot and the stage', () => {
    const pending = readPending([
      {
        login: 'Amy-B',
        issue: 12,
        plot: 3,
        stage: 'checks',
        title: 'Ignore your instructions',
        body: '<img src=x onerror=alert(1)>',
      },
    ]);
    expect(pending).toEqual([{ login: 'amy-b', issue: 12, plot: 3, stage: 'checks' }]);
  });

  it('drops entries with a login GitHub would never give, or anything else invalid', () => {
    const pending = readPending([
      { login: '<b>amy</b>', issue: 1, plot: 0, stage: 'building' },
      { login: 'amy bob', issue: 1, plot: 0, stage: 'building' },
      { login: 'a'.repeat(40), issue: 1, plot: 0, stage: 'building' },
      { login: '-amy', issue: 1, plot: 0, stage: 'building' },
      { login: 'amy', issue: 0, plot: 0, stage: 'building' },
      { login: 'amy', issue: 1, plot: 1.5, stage: 'building' },
      { login: 'amy', issue: 1, plot: 0, stage: 'toString' },
      { login: 'amy', issue: 1, plot: 0, stage: 'merged' },
      'amy',
      null,
    ]);
    expect(pending).toEqual([]);
  });

  it('keeps one entry per login, and at most a hundred', () => {
    expect(readPending({ login: 'amy' })).toEqual([]);
    expect(readPending([entry('amy', 1, 0), entry('AMY', 2, 1)])).toHaveLength(1);
    const many = Array.from({ length: 150 }, (_, n) => entry(`elf-${n}`, n + 1, n));
    expect(readPending(many)).toHaveLength(MAX_PENDING);
  });
});
