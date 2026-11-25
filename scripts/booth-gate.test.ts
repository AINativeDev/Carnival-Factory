import { describe, expect, it } from 'vitest';
import { evaluateGate, RATE_LIMIT_MS, type GateFacts } from './booth-gate.ts';

const now = new Date('2026-12-01T12:00:00Z');
const green: GateFacts = {
  kind: 'booth',
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
  lastAutoMerge: undefined,
  now,
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

  it('merges a level whose every change is inside its own folder, like a booth', () => {
    const result = gate({
      kind: 'level',
      changedFiles: [
        'carnival/levels/elf/level.ts',
        'carnival/levels/elf/squares/cocoa/square.ts',
        'carnival/levels/elf/README.md',
      ],
    });
    expect(result.decision).toBe('merge');
    expect(result.steps.map((step) => step.name)).toContain('Only the level’s own folder');
  });

  it.each<[string, string[]]>([
    ['a level and a booth', ['carnival/levels/elf/level.ts', 'carnival/booths/elf/booth.ts']],
    ['a level and the map’s code', ['carnival/levels/elf/level.ts', 'src/northpole/level.ts']],
    ["another person's level", ['carnival/levels/grinch/level.ts']],
  ])('sends a level request changing %s to a person', (_, changedFiles) => {
    const result = gate({ kind: 'level', changedFiles });
    expect(result.decision).toBe('human');
    expect(result.steps.find((step) => step.name === 'Only the level’s own folder')?.state).toBe(
      'fail',
    );
  });

  it("sends a booth request that changes its author's level to a person", () => {
    expect(gate({ changedFiles: ['carnival/levels/elf/level.ts'] }).decision).toBe('human');
  });
});
