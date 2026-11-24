import { describe, expect, it } from 'vitest';
import {
  boothPlotNumbers,
  landedBooths,
  MAX_PENDING,
  placePending,
  plotLimit,
  readPending,
  readPlotFile,
  reservePlots,
  sitesToRemember,
  type PendingBooth,
} from './plots';

const entry = (login: string, issue: number, plot: number): PendingBooth => ({
  login,
  issue,
  plot,
  stage: 'building',
});

describe('readPlotFile', () => {
  it('takes a whole number for the plot, and a positive issue number', () => {
    expect(readPlotFile({ plot: 17 })).toEqual({ plot: 17 });
    expect(readPlotFile({ plot: 17, issue: 80 })).toEqual({ plot: 17, issue: 80 });
    expect(readPlotFile({ plot: 17, issue: -3 })).toEqual({ plot: 17 });
  });

  it('rejects anything else', () => {
    for (const value of [null, 17, '17', {}, { plot: 1.5 }, { plot: -1 }, { plot: '3' }])
      expect(readPlotFile(value)).toBeUndefined();
  });
});

describe('boothPlotNumbers', () => {
  it('puts pins first, then plot.json files, then the rest on the lowest free plots', () => {
    const numbers = boothPlotNumbers(
      ['amy', 'bob', 'cat', 'dan'],
      { bob: 0 },
      { dan: { plot: 2 } },
    );
    expect(Object.fromEntries(numbers)).toEqual({ bob: 0, dan: 2, amy: 1, cat: 3 });
  });

  it('never moves a booth with a pin or a plot.json, whatever booths arrive', () => {
    const files = { cat: { plot: 5 } };
    const before = boothPlotNumbers(['bob', 'cat'], { bob: 0 }, files);
    const after = boothPlotNumbers(['aaron', 'amy', 'bob', 'cat', 'zed'], { bob: 0 }, files);
    expect(after.get('bob')).toBe(before.get('bob'));
    expect(after.get('cat')).toBe(before.get('cat'));
    expect(new Set(after.values()).size).toBe(5);
  });

  it('gives a contested plot to the lower issue number, and the other the next free plot', () => {
    const numbers = boothPlotNumbers(
      ['amy', 'bob'],
      {},
      {
        amy: { plot: 3, issue: 90 },
        bob: { plot: 3, issue: 70 },
      },
    );
    expect(numbers.get('bob')).toBe(3);
    expect(numbers.get('amy')).toBe(0);
  });

  it('lets a pin win over a plot.json that claims the same plot', () => {
    const numbers = boothPlotNumbers(['amy', 'bob'], { bob: 4 }, { amy: { plot: 4, issue: 1 } });
    expect(numbers.get('bob')).toBe(4);
    expect(numbers.get('amy')).toBe(0);
  });

  it('ignores an invalid plot.json', () => {
    const numbers = boothPlotNumbers(['amy'], {}, { amy: { plot: -2 } });
    expect(numbers.get('amy')).toBe(0);
  });

  it('puts a plot.json claim past the plot limit on the next free plot', () => {
    const numbers = boothPlotNumbers(['amy', 'bob'], {}, { bob: { plot: 9999, issue: 1 } });
    expect(numbers.get('bob')).toBe(1);
    expect(boothPlotNumbers(['amy'], {}, { amy: { plot: plotLimit(1) - 1 } }).get('amy')).toBe(
      plotLimit(1) - 1,
    );
  });
});

describe('reservePlots', () => {
  it('holds the next free plots after every taken one, in order of issue number', () => {
    const reserved = reservePlots(
      [
        { login: 'zed', issue: 90 },
        { login: 'amy', issue: 12 },
      ],
      [0, 1, 3],
    );
    expect(Object.fromEntries(reserved)).toEqual({ amy: 2, zed: 4 });
  });

  it('is deterministic, and never gives two requests the same plot', () => {
    const requests = Array.from({ length: 20 }, (_, n) => ({ login: `elf-${n}`, issue: 100 - n }));
    const a = reservePlots(requests, [0, 2, 4]);
    const b = reservePlots([...requests].reverse(), [4, 2, 0]);
    expect([...a].sort()).toEqual([...b].sort());
    expect(new Set(a.values()).size).toBe(20);
  });
});

describe('placePending', () => {
  it('shows a request from someone with a booth as an update, on that booth', () => {
    const { sites, updates } = placePending([entry('amy', 5, 0)], new Map([['amy', 0]]));
    expect([...updates]).toEqual(['amy']);
    expect(sites.size).toBe(0);
  });

  it('puts a construction site on the plot held for it', () => {
    const { sites } = placePending([entry('bob', 5, 7)], new Map([['amy', 0]]));
    expect(sites.get('bob')).toBe(7);
  });

  it('moves a site whose plot a booth took meanwhile to the next free plot', () => {
    const { sites } = placePending(
      [entry('bob', 5, 1), entry('cat', 6, 2)],
      new Map([
        ['amy', 0],
        ['dan', 1],
      ]),
    );
    expect(sites.get('cat')).toBe(2);
    expect(sites.get('bob')).toBe(3);
  });

  it('moves a site past the plot limit to the next free plot', () => {
    const { sites } = placePending([entry('bob', 5, 9999)], new Map([['amy', 0]]));
    expect(sites.get('bob')).toBe(1);
  });
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

describe('landedBooths', () => {
  it('names the construction sites that are booths now, once each', () => {
    expect(landedBooths(['amy', 'bob', 'amy'], new Set(['amy', 'cat']))).toEqual(['amy']);
  });
});

describe('sitesToRemember', () => {
  it('keeps the sites up now, and remembered ones that are not booths here yet', () => {
    expect(sitesToRemember(['amy', 'bob', 'cat'], ['dan', 'cat'], new Set(['amy']))).toEqual([
      'dan',
      'cat',
      'bob',
    ]);
  });
});
