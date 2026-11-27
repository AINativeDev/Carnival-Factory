import { describe, expect, it } from 'vitest';
import { BAR, debtsOf, mutatedFiles, mutationProblems, scoresOf } from './mutation-score';

const mutants = (...statuses: string[]) => ({ mutants: statuses.map((status) => ({ status })) });

describe('a mutation score', () => {
  it('is the share of covered mutants the tests catch, timeouts included', () => {
    const scores = scoresOf({
      files: {
        'src/a.ts': mutants('Killed', 'Killed', 'Timeout', 'Survived'),
        'src/b.ts': mutants('Killed', 'Survived', 'Survived'),
        // Uncovered, ignored or broken mutants aren't counted: coverage holds that code.
        'src/c.ts': mutants('NoCoverage', 'Ignored', 'CompileError', 'RuntimeError'),
      },
    });
    expect(scores).toEqual(
      new Map([
        ['src/a.ts', 75],
        ['src/b.ts', 33.3],
      ]),
    );
  });

  it('freezes only the files under the bar, as how far below 100 each is', () => {
    expect(BAR).toBe(90);
    const scores = new Map([
      ['src/z.ts', 70],
      ['src/a.ts', 83.8],
      ['src/ok.ts', 95],
    ]);
    expect(debtsOf(scores)).toEqual({ 'src/a.ts': 16.2, 'src/z.ts': 30 });
    expect(Object.keys(debtsOf(scores))).toEqual(['src/a.ts', 'src/z.ts']);
  });
});

describe('what falls short', () => {
  const debts = { 'src/old.ts': 20 };

  it('holds an older file to its debt, and any other to the bar', () => {
    const scores = new Map([
      ['src/old.ts', 80],
      ['src/fine.ts', 90],
    ]);
    expect(mutationProblems(scores, debts, new Set())).toEqual([]);
    expect(mutationProblems(new Map([['src/old.ts', 79.9]]), debts, new Set())).toEqual([
      'src/old.ts: the tests catch 79.9% of its mutants; it needs 80%',
    ]);
    expect(mutationProblems(new Map([['src/new.ts', 85]]), debts, new Set())).toEqual([
      'src/new.ts: the tests catch 85% of its mutants; it needs 90%',
    ]);
  });

  it('needs the bar of a changed file, whatever debt it had', () => {
    expect(mutationProblems(new Map([['src/old.ts', 85]]), debts, new Set(['src/old.ts']))).toEqual(
      ['src/old.ts: the tests catch 85% of its mutants; a new or changed file needs 90%'],
    );
  });
});

describe('the files a change touched', () => {
  it("are the code in src/, scripts/ and lint/, not tests, types or the tests' helpers", () => {
    expect(
      mutatedFiles([
        'src/route.ts',
        'scripts/ownership.ts',
        'lint/rule.ts',
        'src/route.test.ts',
        'src/env.d.ts',
        'src/test-support/map.ts',
        'src/northpole/sandbox-fakes.ts',
        'scripts/merge-gate-world.ts',
        'carnival/booths/ana/booth.ts',
        'docs/adr/0001.md',
        '',
      ]),
    ).toEqual(['src/route.ts', 'scripts/ownership.ts', 'lint/rule.ts']);
  });
});
