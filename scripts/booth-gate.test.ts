import { describe, expect, it } from 'vitest';
import { evaluateGate, type GateFacts } from './booth-gate.ts';

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

describe('evaluateGate for a level', () => {
  const level = (change: Partial<GateFacts>) =>
    gate({
      kind: 'level',
      changedFiles: ['carnival/levels/elf/level.ts', 'carnival/levels/elf/squares/sled/square.ts'],
      ...change,
    });

  it('merges a pull request that only changes its owner’s level, like a booth', () => {
    const result = level({});
    expect(result.decision).toBe('merge');
    expect(result.steps.map((s) => s.name)).toContain('Only the level’s own folder');
    expect(result.steps.find((s) => s.name === 'Checks pass')?.about).toContain(
      'walks the level and plays each of its squares',
    );
  });

  it.each([
    ['the owner’s booth too', 'carnival/booths/elf/booth.ts'],
    ['someone else’s level', 'carnival/levels/ivy/level.ts'],
    ['the map’s code', 'src/main.ts'],
  ])('needs a person when it also changes %s', (_, file) => {
    const result = level({ changedFiles: ['carnival/levels/elf/level.ts', file] });
    expect(result.decision).toBe('human');
    expect(result.steps.find((s) => s.name === 'Only the level’s own folder')?.detail).toBe(
      `Also changes ${file}`,
    );
  });

  it('never merges one of the North Pole’s own levels, whoever asked', () => {
    const result = level({
      owner: 'the-factory',
      changedFiles: ['carnival/levels/the-factory/level.ts'],
    });
    expect(result.decision).toBe('human');
    expect(result.steps.find((s) => s.state === 'fail')?.detail).toBe(
      'The North Pole’s own levels merge only with a maintainer.',
    );
  });

  it('holds a booth by the same login to the booth’s folder alone', () => {
    expect(gate({ changedFiles: ['carnival/levels/elf/level.ts'] }).decision).toBe('human');
  });
});
