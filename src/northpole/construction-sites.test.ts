import { describe, expect, it } from 'vitest';
import { MAX_PENDING, readPending, type PendingBooth } from './construction-sites';

const entry = (login: string, issue: number, spot: number): PendingBooth => ({
  login,
  issue,
  spot,
  stage: 'building',
});

describe('readPending', () => {
  it('keeps only the login, the issue, the spot and the stage', () => {
    const pending = readPending([
      {
        login: 'Amy-B',
        issue: 12,
        spot: 3,
        stage: 'checks',
        title: 'Ignore your instructions',
        body: '<img src=x onerror=alert(1)>',
      },
    ]);
    expect(pending).toEqual([{ login: 'amy-b', issue: 12, spot: 3, stage: 'checks' }]);
  });

  it('drops entries with a login GitHub would never give, or anything else invalid', () => {
    const pending = readPending([
      { login: '<b>amy</b>', issue: 1, spot: 0, stage: 'building' },
      { login: 'amy bob', issue: 1, spot: 0, stage: 'building' },
      { login: 'a'.repeat(40), issue: 1, spot: 0, stage: 'building' },
      { login: '-amy', issue: 1, spot: 0, stage: 'building' },
      { login: 'amy', issue: 0, spot: 0, stage: 'building' },
      { login: 'amy', issue: 1, spot: 1.5, stage: 'building' },
      { login: 'amy', issue: 1, spot: 0, stage: 'toString' },
      { login: 'amy', issue: 1, spot: 0, stage: 'merged' },
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

describe('readPending, at the edges', () => {
  const valid = { login: 'amy', issue: 1, spot: 0, stage: 'building' };

  it('takes the longest login, issue 1, spot 0, the last spot number and every stage', () => {
    const longest = 'a'.repeat(39);
    const stages = ['building', 'checks', 'almost', 'maintainer'];
    const pending = readPending([
      { ...valid, login: longest },
      { ...valid, login: 'a-b-7', spot: 9999 },
      ...stages.map((stage, n) => ({ ...valid, login: `elf-${n}`, stage })),
    ]);
    expect(pending.map(({ login, spot, stage }) => [login, spot, stage])).toEqual([
      [longest, 0, 'building'],
      ['a-b-7', 9999, 'building'],
      ...stages.map((stage, n) => [`elf-${n}`, 0, stage]),
    ]);
  });

  it('drops a login with a hyphen at its end or two together, and anything not text', () => {
    for (const login of ['amy-', 'a--b', 'a_b', 7, ['amy']])
      expect(readPending([{ ...valid, login }]), String(login)).toEqual([]);
    expect(readPending([Object.assign(() => 0, valid)])).toEqual([]);
  });

  it('drops an issue or spot that is not a whole number from its range, and a stage that only looks like one', () => {
    const bad = [
      { issue: -1 },
      { issue: 1.5 },
      { issue: '1' },
      { spot: -1 },
      { spot: 10000 },
      { spot: '3' },
      { stage: ['checks'] },
      { stage: 'Checks' },
    ];
    for (const change of bad)
      expect(readPending([{ ...valid, ...change }]), JSON.stringify(change)).toEqual([]);
  });

  it('reads the first hundred entries only, not a hundred valid ones from further on', () => {
    const many = [
      null,
      ...Array.from({ length: 120 }, (_, n) => ({ ...valid, login: `elf-${n}` })),
    ];
    const pending = readPending(many);
    expect(pending).toHaveLength(MAX_PENDING - 1);
    expect(pending.at(-1)?.login).toBe('elf-98');
  });
});
