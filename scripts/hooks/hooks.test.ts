import { describe, expect, it } from 'vitest';
import { editFeedback } from './check-edited-file';
import { checksForFile, runChecks, type Ran } from './checks-for-file';
import { turnFeedback } from './check-turn';

const ok: Ran = { status: 0, stdout: '', stderr: '' };
const failed: Ran = { status: 1, stdout: 'line 1: bad\n', stderr: '' };
const missing: Ran = { status: null, stdout: '', stderr: '', error: new Error('ENOENT') };
const names = (file: string) => checksForFile(file).map((check) => check.name);

describe('checksForFile', () => {
  it('gives each kind of file the checks CI gives it', () => {
    expect(names('src/route.ts')).toEqual(['ESLint', 'Prettier', 'TypeScript']);
    expect(names('lint/file-size.js')).toEqual(['ESLint', 'Prettier']);
    expect(names('docs/adr/0001-record-decisions.md')).toEqual(['markdownlint', 'Prettier']);
    expect(names('src/northpole/disabled.json')).toEqual(['JSON', 'Prettier']);
    expect(names('setup.sh')).toEqual(['ShellCheck']);
    expect(names('.github/workflows/ci.yml')).toEqual(['actionlint', 'Prettier']);
    expect(names('src/style.css')).toEqual(['Prettier']);
    expect(names('docs/north-pole.png')).toEqual([]);
  });
});

describe('lint debt', () => {
  const eslintArgs = (file: string) => checksForFile(file)[0]?.args;
  it('prunes the suppressions map code pays off, but never from a carnival file', () => {
    expect(eslintArgs('src/route.ts')).toContain('--prune-suppressions');
    expect(eslintArgs('carnival/booths/ana/booth.ts')).toContain('--pass-on-unpruned-suppressions');
  });
});

describe('runChecks', () => {
  it('reports failures with their output, and notes optional tools that are missing', () => {
    const checks = [...checksForFile('src/a.ts'), ...checksForFile('setup.sh')];
    const runs = [failed, ok, ok, missing];
    const result = runChecks(checks, 'src/a.ts', () => runs.shift()!);
    expect(result.failures).toEqual(['ESLint:\nline 1: bad']);
    expect(runs).toEqual([]);
    expect(result.notes[0]).toMatch(/ShellCheck isn't installed/);
  });

  it('fails a required tool that is missing rather than skipping it', () => {
    expect(runChecks(checksForFile('src/a.ts'), 'src/a.ts', () => missing).failures).toHaveLength(
      3,
    );
  });
});

describe('editFeedback', () => {
  it('sends a failing file back to the agent', () => {
    expect(editFeedback('/repo/src/a.ts', '/repo', () => failed).problem).toMatch(
      /src\/a\.ts breaks the repository's rules/,
    );
  });

  it('says nothing for a passing file, or one outside the project', () => {
    expect(editFeedback('/repo/src/a.ts', '/repo', () => ok).problem).toBeUndefined();
    expect(editFeedback('/elsewhere/a.ts', '/repo', () => failed)).toEqual({});
    expect(editFeedback(undefined, '/repo', () => failed)).toEqual({});
  });
});

describe('turnFeedback', () => {
  it('names each project check that fails', () => {
    expect(turnFeedback(false, () => failed)).toMatch(/Types:[\s\S]*Knip[\s\S]*Tests:/);
  });

  it('lets the agent stop when everything passes, or when it was already sent back once', () => {
    expect(turnFeedback(false, () => ok)).toBeUndefined();
    expect(turnFeedback(true, () => failed)).toBeUndefined();
  });
});
