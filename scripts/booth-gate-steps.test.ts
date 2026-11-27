/**
 * Each of the merge gate's steps, word for word: what it checks, where it
 * stands, whether a person must look, and the detail it gives, since the
 * checklist comment shows all of them to the participant
 * (docs/specs/auto-merge-gate.md).
 */
import { describe, expect, it } from 'vitest';
import { evaluateGate, type GateFacts, type GateStep } from './booth-gate.ts';

const green: GateFacts = {
  owner: 'elf',
  accepted: true,
  changedFiles: ['carnival/booths/elf/booth.ts'],
  codeProblems: [],
  textFindings: [],
  checks: { check: 'success', ownership: 'success', build: 'success', smoke: 'success' },
  review: 'approved',
  risk: 'low-risk',
  labels: [],
};
const steps = (change: Partial<GateFacts>) => evaluateGate({ ...green, ...change }).steps;
const step = (name: string, change: Partial<GateFacts>): GateStep | undefined =>
  steps(change).find((s) => s.name === name);

describe('the gate’s steps', () => {
  it('are these, in this order, all passing on a green pull request', () => {
    const about = (s: GateStep) => [s.name, s.about, s.hard];
    expect(steps({}).every((s) => s.state === 'pass' && s.detail === undefined)).toBe(true);
    expect(steps({}).map(about)).toEqual([
      [
        'Request accepted',
        'The assessment read the request and found it a sane change to its author’s own booth.',
        true,
      ],
      [
        'Only the booth’s own folder',
        'Every changed file is inside carnival/booths/<owner>/, so nothing else on the map can change.',
        true,
      ],
      [
        'Code stays in its square',
        'A static check reads the code’s syntax and types, without running it, and finds nothing that could reach outside the booth.',
        true,
      ],
      [
        'No hidden instructions',
        'The request and the code are scanned for text aimed at an AI, hidden characters or encoded blobs.',
        true,
      ],
      [
        'Checks pass',
        'Lint, types, tests, the size budget, ownership, a build, and a smoke test that plays the booth in its sandbox.',
        false,
      ],
      [
        'Code review approves',
        'Tessl Code Review reviews the change, including a house-rules lens, and approves it with nothing left to fix.',
        false,
      ],
      [
        'Risk and taste check',
        'An agent looks at the change and its screenshots for anything unkind, copied or unsafe, and for tricks the other checks could miss.',
        true,
      ],
      [
        'No one has asked to hold it',
        'A maintainer, or any check above, can hold a pull request for a person with the needs-human label.',
        true,
      ],
    ]);
  });
});

describe('the request step', () => {
  it('fails, saying why, with no request author, even when accepted', () => {
    expect(step('Request accepted', { owner: undefined })).toMatchObject({
      state: 'fail',
      detail: 'The pull request doesn’t link to a request issue by a person.',
    });
  });

  it('fails without a reason when the request was not accepted', () => {
    const accepted = step('Request accepted', { accepted: false });
    expect(accepted?.state).toBe('fail');
    expect(accepted?.detail).toBeUndefined();
  });
});

describe('the folder step', () => {
  const folder = (change: Partial<GateFacts>) => step('Only the booth’s own folder', change);

  it('names the first five files outside the booth', () => {
    const outside = ['a', 'b', 'c', 'd', 'e', 'f'].map((name) => `src/${name}.ts`);
    expect(folder({ changedFiles: ['carnival/booths/elf/booth.ts', ...outside] })).toMatchObject({
      state: 'fail',
      detail: 'Also changes src/a.ts, src/b.ts, src/c.ts, src/d.ts, src/e.ts',
    });
  });

  it('counts a booth whose name only starts with the owner’s as outside', () => {
    expect(folder({ changedFiles: ['carnival/booths/elfish/booth.ts'] })?.detail).toBe(
      'Also changes carnival/booths/elfish/booth.ts',
    );
  });

  it('counts every file as outside with no request author', () => {
    expect(folder({ owner: undefined })?.detail).toBe('Also changes carnival/booths/elf/booth.ts');
  });

  it('fails with nothing to name when nothing changed', () => {
    expect(folder({ changedFiles: [] })).toMatchObject({ state: 'fail', detail: undefined });
  });
});

describe('the code and text steps', () => {
  it('give the first five code problems, by file and line', () => {
    const codeProblems = [1, 2, 3, 4, 5, 6].map((line) => ({
      file: 'carnival/booths/elf/booth.ts',
      line,
      rule: 'global',
      message: `problem ${String(line)}`,
    }));
    const code = step('Code stays in its square', { codeProblems });
    expect(code?.state).toBe('fail');
    expect(code?.detail).toBe(
      [1, 2, 3, 4, 5]
        .map((n) => `carnival/booths/elf/booth.ts:${String(n)} problem ${String(n)}`)
        .join('; '),
    );
  });

  it('give the first three findings in the text', () => {
    const textFindings = ['one', 'two', 'three', 'four'].map((what) => ({ line: 1, what }));
    expect(step('No hidden instructions', { textFindings })).toMatchObject({
      state: 'fail',
      detail: 'one; two; three',
    });
  });
});

describe('the checks step', () => {
  const checks = (states: GateFacts['checks']) => step('Checks pass', { checks: states });

  it('waits, naming what hasn’t passed yet, including a check not started', () => {
    expect(checks({ check: 'success', ownership: 'pending', build: 'success' })).toMatchObject({
      state: 'wait',
      hard: false,
      detail: 'Waiting for: ownership, smoke',
    });
  });

  it('fails, naming every check not passed, when one failed', () => {
    expect(checks({ check: 'success', ownership: 'pending', build: 'failure' })).toMatchObject({
      state: 'fail',
      hard: false,
      detail: 'Failed: ownership, build, smoke',
    });
  });

  it('ignores checks the gate doesn’t require', () => {
    expect(checks({ ...green.checks, lint: 'failure' })?.state).toBe('pass');
  });
});

describe('the review, risk and hold steps', () => {
  it('fail softly while the factory answers a review asking for changes', () => {
    expect(step('Code review approves', { review: 'changes' })).toMatchObject({
      state: 'fail',
      hard: false,
      detail: 'The factory is answering the review.',
    });
  });

  it('wait for a review not in yet, with nothing to say', () => {
    expect(step('Code review approves', { review: 'pending' })).toMatchObject({
      state: 'wait',
      detail: undefined,
    });
  });

  it('wait for a risk verdict, and fail on needs-human', () => {
    expect(step('Risk and taste check', { risk: undefined })?.state).toBe('wait');
    expect(step('Risk and taste check', { risk: 'needs-human' })?.state).toBe('fail');
  });

  it('fail on the needs-human label only', () => {
    expect(step('No one has asked to hold it', { labels: ['tessl'] })?.state).toBe('pass');
    expect(step('No one has asked to hold it', { labels: ['needs-human'] })?.state).toBe('fail');
  });
});
