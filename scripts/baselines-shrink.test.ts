import { describe, expect, it } from 'vitest';
import { debts, grown, problems } from './baselines-shrink';

describe('baselines only shrink', () => {
  it('reads every number, however deep', () => {
    expect(debts({ 'a.ts': 3, 'b.ts': { rule: { count: 2 } } })).toEqual(
      new Map([
        ['a.ts', 3],
        ['b.ts › rule › count', 2],
      ]),
    );
  });

  it('counts no debt in anything but numbers', () => {
    expect(debts({ 'a.ts': 'a note', 'b.ts': null, 'c.ts': true })).toEqual(new Map());
  });

  it('lets a number fall or an entry go', () => {
    expect(grown({ 'a.ts': 300, 'b.ts': 250 }, { 'a.ts': 280 })).toEqual([]);
  });

  it('catches a raised number and a new entry', () => {
    expect(grown({ 'a.ts': 300 }, { 'a.ts': 301, 'c.ts': 210 })).toEqual([
      'a.ts: raised from 300 to 301',
      'c.ts: added at 210',
    ]);
    expect(grown({ 'b.ts': { rule: { count: 2 } } }, { 'b.ts': { rule: { count: 3 } } })).toEqual([
      'b.ts › rule › count: raised from 2 to 3',
    ]);
  });

  it('checks every baseline there is, and lets a new one start as it is', () => {
    const now: Record<string, unknown> = {
      'lint/strict-types-baseline.json': { 'a.ts': 2 },
      'eslint-suppressions.json': { 'b.ts': { rule: { count: 1 } } },
    };
    const base: Record<string, unknown> = { 'lint/strict-types-baseline.json': { 'a.ts': 1 } };
    expect(problems({ now: (file) => now[file], atBase: (file) => base[file] })).toEqual([
      'lint/strict-types-baseline.json: a.ts: raised from 1 to 2',
    ]);
  });

  it('lets a baseline go altogether, once its debt is paid', () => {
    const base: Record<string, unknown> = { 'eslint-suppressions.json': { 'b.ts': 1 } };
    expect(problems({ now: () => undefined, atBase: (file) => base[file] })).toEqual([]);
  });
});
