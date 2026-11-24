import { describe, expect, it } from 'vitest';
import { evaluateGate, gateComment, RATE_LIMIT_MS, type GateFacts } from './booth-gate.ts';

const now = new Date('2026-12-01T12:00:00Z');
const green: GateFacts = {
  owner: 'elf',
  accepted: true,
  changedFiles: ['booths/elf/booth.ts', 'booths/elf/README.md'],
  codeProblems: [],
  textFindings: [],
  checks: {
    check: 'success',
    ownership: 'success',
    build: 'success',
    test: 'success',
    smoke: 'success',
  },
  review: 'approved',
  risk: 'low-risk',
  labels: ['tessl'],
  lastAutoMerge: undefined,
  now,
};
const gate = (change: Partial<GateFacts>) => evaluateGate({ ...green, ...change });

describe('evaluateGate', () => {
  it('merges when every check passes on the head commit', () => {
    expect(gate({}).decision).toBe('merge');
  });

  it.each<[string, Partial<GateFacts>]>([
    ['a file outside the booth', { changedFiles: ['booths/elf/booth.ts', 'northpole/map.ts'] }],
    ["another person's booth", { changedFiles: ['booths/grinch/booth.ts'] }],
    ['no changed files', { changedFiles: [] }],
    ['no request author', { owner: undefined }],
    ['a request the assessment never accepted', { accepted: false }],
    [
      'a code problem',
      {
        codeProblems: [{ file: 'booths/elf/booth.ts', line: 1, rule: 'global', message: 'fetch' }],
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
    [
      'a merge for the same person within the hour',
      { lastAutoMerge: new Date(now.getTime() - RATE_LIMIT_MS / 2) },
    ],
    ['a failed check the shepherd can fix', { checks: { ...green.checks, smoke: 'failure' } }],
    ['review asking for changes', { review: 'changes' }],
  ])('waits for %s', (_, change) => {
    expect(gate(change).decision).toBe('wait');
  });

  it('lets the next one through once the hour is up', () => {
    expect(gate({ lastAutoMerge: new Date(now.getTime() - RATE_LIMIT_MS - 1) }).decision).toBe(
      'merge',
    );
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
