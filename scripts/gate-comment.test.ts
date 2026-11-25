import { describe, expect, it } from 'vitest';
import { evaluateGate, type GateFacts } from './booth-gate.ts';
import { gateComment } from './gate-comment.ts';

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
  labels: ['tessl'],
  lastAutoMerge: undefined,
  now: new Date('2026-12-01T12:00:00Z'),
};

describe('gateComment', () => {
  it('explains every step and links the guide, without emoji', () => {
    const text = gateComment(evaluateGate(facts), 'https://example.com/guide', 'booth');
    expect(text.startsWith('<!-- booth-gate -->')).toBe(true);
    expect(text).toContain('### How this booth gets onto the map');
    expect(text).toContain('Code review approves** (Waiting)');
    expect(text).toContain('https://example.com/guide');
    expect(text).toContain('[Tessl](https://tessl.io)');
    expect(/\p{Extended_Pictographic}/u.test(text)).toBe(false);
  });

  it('says "level" for a level, in its heading and its steps', () => {
    const level = evaluateGate({
      ...facts,
      kind: 'level',
      changedFiles: ['carnival/levels/elf/level.ts'],
    });
    const text = gateComment(level, 'https://example.com/guide', 'level');
    expect(text).toContain('### How this level gets onto the map');
    expect(text).toContain('Only the level’s own folder** (Passed)');
    expect(text).toContain('carnival/levels/<owner>/');
    expect(text).toContain('own level.');
    expect(text).not.toContain('booth’s');
  });
});
