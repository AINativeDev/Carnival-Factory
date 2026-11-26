import { describe, expect, it } from 'vitest';
import { evaluateGate, gateComment, type GateFacts } from './booth-gate.ts';

const green: GateFacts = {
  owner: 'elf',
  accepted: true,
  changedFiles: ['carnival/booths/elf/booth.ts', 'carnival/booths/elf/README.md'],
  codeProblems: [],
  textFindings: [],
  checks: {
    check: 'success',
    ownership: 'success',
    build: 'success',
    smoke: 'success',
  },
  review: 'approved',
  risk: 'low-risk',
  labels: ['tessl'],
};
const gate = (change: Partial<GateFacts>) => evaluateGate({ ...green, ...change });

describe('evaluateGate', () => {
  it('merges when every check passes on the head commit', () => {
    expect(gate({}).decision).toBe('merge');
  });

  it.each<[string, Partial<GateFacts>]>([
    [
      'a file outside the booth',
      { changedFiles: ['carnival/booths/elf/booth.ts', 'src/northpole/map.ts'] },
    ],
    ["another person's booth", { changedFiles: ['carnival/booths/grinch/booth.ts'] }],
    ['no changed files', { changedFiles: [] }],
    ['no request author', { owner: undefined }],
    ['a request the assessment never accepted', { accepted: false }],
    [
      'a code problem',
      {
        codeProblems: [
          { file: 'carnival/booths/elf/booth.ts', line: 1, rule: 'global', message: 'fetch' },
        ],
      },
    ],
    ['hidden instructions', { textFindings: [{ line: 1, what: 'addresses an AI directly' }] }],
    ['a risky verdict', { risk: 'needs-human' }],
    ['a needs-human label', { labels: ['tessl', 'needs-human'] }],
  ])('sends %s to a person', (_, change) => {
    expect(gate(change).decision).toBe('human');
  });

  it.each<[string, Partial<GateFacts>]>([
    ['a check still running', { checks: { ...green.checks, smoke: 'pending' } }],
    ['a check not started', { checks: { check: 'success' } }],
    ['review not in yet', { review: 'pending' }],
    ['no risk verdict yet', { risk: undefined }],
    ['a failed check the shepherd can fix', { checks: { ...green.checks, smoke: 'failure' } }],
    ['review asking for changes', { review: 'changes' }],
  ])('waits for %s', (_, change) => {
    expect(gate(change).decision).toBe('wait');
  });

  it('prefers a person over waiting when both apply', () => {
    expect(gate({ review: 'pending', risk: 'needs-human' }).decision).toBe('human');
  });
});

describe('gateComment', () => {
  it('explains every step and links the guide, without emoji', () => {
    const text = gateComment(gate({ review: 'pending' }), 'https://example.com/guide');
    expect(text.startsWith('<!-- booth-gate -->')).toBe(true);
    expect(text).toContain('Code review approves** (Waiting)');
    expect(text).toContain('https://example.com/guide');
    expect(text).toContain('[Tessl](https://tessl.io)');
    expect(/\p{Extended_Pictographic}/u.test(text)).toBe(false);
  });
});
