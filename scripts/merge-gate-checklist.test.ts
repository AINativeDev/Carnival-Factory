import { describe, expect, it } from 'vitest';
import { evaluateGate, type GateFacts } from './booth-gate.ts';
import { gateComment } from './merge-gate-checklist.ts';

const facts: GateFacts = {
  kind: 'booth',
  owner: 'elf',
  accepted: true,
  changedFiles: ['carnival/booths/elf/booth.ts'],
  codeProblems: [],
  textFindings: [],
  checks: { check: 'success', ownership: 'success', build: 'success', smoke: 'success' },
  review: 'pending',
  risk: 'low-risk',
  labels: [],
  lastAutoMerge: undefined,
  now: new Date('2026-12-01T12:00:00Z'),
};

describe('gateComment', () => {
  it('explains every step and links the guide, without emoji', () => {
    const text = gateComment(evaluateGate(facts), 'booth', 'https://example.com/guide');
    expect(text.startsWith('<!-- booth-gate -->\n### How this booth gets onto the map')).toBe(true);
    expect(text).toContain('Code review approves** (Waiting)');
    expect(text).toContain('Some checks are still running.');
    expect(text).toContain('https://example.com/guide');
    expect(text).toContain('[Tessl](https://tessl.io)');
    expect(/\p{Extended_Pictographic}/u.test(text)).toBe(false);
  });

  it('says level for a level, under the same marker', () => {
    const result = evaluateGate({
      ...facts,
      kind: 'level',
      changedFiles: ['carnival/levels/elf/level.ts'],
      review: 'approved',
    });
    const text = gateComment(result, 'level', 'https://example.com/guide');
    expect(text.startsWith('<!-- booth-gate -->\n### How this level gets onto the map')).toBe(true);
    expect(text).toContain('**Only the level’s own folder** (Passed)');
    expect(text).toContain('Every check passed');
  });

  it('says a person will look, with each failed step’s detail made safe', () => {
    const result = evaluateGate({ ...facts, changedFiles: ['src/@main.ts'] });
    const text = gateComment(result, 'booth', 'https://example.com/guide');
    expect(text).toContain('Not passed');
    expect(text).toContain('a maintainer will take a look');
  });
});
