/**
 * The checklist comment the merge gate keeps on a pull request, word for word:
 * each step with its state and detail, made safe, and what happens next
 * (docs/specs/auto-merge-gate.md).
 */
import { describe, expect, it } from 'vitest';
import { evaluateGate, gateComment, type GateFacts } from './booth-gate.ts';

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

describe('the checklist comment', () => {
  const guide = 'https://example.com/guide';

  it('is the whole checklist, with each step’s state and detail', () => {
    const result = evaluateGate({ ...green, review: 'changes', risk: undefined });
    const lines = gateComment(result, guide).split('\n');
    expect(lines.slice(0, 3)).toEqual([
      '<!-- booth-gate -->',
      '### How this booth gets onto the map',
      '',
    ]);
    expect(lines[3]).toBe(`- **Request accepted** (Passed): ${result.steps[0]?.about ?? ''}`);
    expect(lines).toContain(
      `- **Code review approves** (Not passed): ${result.steps[5]?.about ?? ''}  `,
    );
    expect(lines).toContain('  The factory is answering the review.');
    expect(lines).toContain(
      `- **Risk and taste check** (Waiting): ${result.steps[6]?.about ?? ''}`,
    );
    expect(lines.slice(-4)).toEqual([
      '',
      'Some checks are still running. This updates as they finish.',
      '',
      `Each step is a loop in a [Tessl](https://tessl.io) software factory. [How your request is built](${guide}) explains them, and how to run one on your own repository.`,
    ]);
  });

  it.each<[GateFacts, string]>([
    [
      green,
      'Every check passed, so this merges on its own and appears on the map within a few minutes.',
    ],
    [
      { ...green, accepted: false },
      'A check didn’t pass, so a maintainer will take a look. Nothing merges without them.',
    ],
  ])('says what happens next', (facts, next) => {
    expect(gateComment(evaluateGate(facts), guide).split('\n').at(-3)).toBe(next);
  });

  it('makes a step’s detail safe, and caps it at 300 characters', () => {
    const message = `@grinch ${'x'.repeat(400)}`;
    const codeProblems = [{ file: 'f.ts', line: 1, rule: 'global', message }];
    const detail = gateComment(evaluateGate({ ...green, codeProblems }), guide)
      .split('\n')
      .find((line) => line.startsWith('  f.ts'));
    expect(detail).toBe(`  f.ts:1 ＠grinch ${'x'.repeat(284)}…`);
  });
});
