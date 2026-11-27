/**
 * The Stop hook's feedback word for word: what it runs, in what order, and
 * what it tells the agent when a project check or a square's craft fails.
 */
import { describe, expect, it } from 'vitest';
import { touchedSquares, turnFeedback } from './check-turn';
import type { Ran } from './checks-for-file';

const ok: Ran = { status: 0, stdout: '', stderr: '' };

/** A runner answering each command from `answers`, recording what it ran. */
function runner(answers: Record<string, Ran>) {
  const ran: string[] = [];
  const run = (command: string, args: string[]): Ran => {
    const line = [command, ...args].join(' ');
    ran.push(line);
    return answers[line] ?? ok;
  };
  return { ran, run };
}

describe('turnFeedback', () => {
  it('runs each project check, then asks git what changed, and nothing more', () => {
    const { ran, run } = runner({});
    expect(turnFeedback(false, run)).toBeUndefined();
    expect(ran).toEqual([
      'npx tsc --noEmit',
      'npx knip',
      'npx vitest run',
      'git status --porcelain',
    ]);
  });

  it('gives each failing check’s name and its output, trimmed', () => {
    const { run } = runner({
      'npx tsc --noEmit': { status: 2, stdout: '  a.ts: bad\n', stderr: 'b.ts: worse \n' },
      'npx vitest run': { status: 1, stdout: '', stderr: '1 failed' },
    });
    expect(turnFeedback(false, run)).toBe(
      'Not done yet: these project checks fail.\n\nTypes:\na.ts: bad\nb.ts: worse\n\nTests:\n1 failed',
    );
  });

  it('keeps the last 4000 characters of a long output', () => {
    const output = `${'x'.repeat(10)}${'y'.repeat(4000)}`;
    const { run } = runner({ 'npx knip': { status: 1, stdout: output, stderr: '' } });
    expect(turnFeedback(false, run)).toBe(
      `Not done yet: these project checks fail.\n\nUnused code (Knip):\n${'y'.repeat(4000)}`,
    );
  });

  it('checks the craft of the squares changed, and gives its report trimmed', () => {
    const { ran, run } = runner({
      'git status --porcelain': {
        status: 0,
        stdout: ' M carnival/booths/bo/booth.ts\n M carnival/booths/ana/booth.ts',
        stderr: '',
      },
      'node scripts/craft/check-square.ts carnival/booths/ana carnival/booths/bo': {
        status: 1,
        stdout: '\ncarnival/booths/ana: untested\n',
        stderr: 'ignored',
      },
    });
    expect(turnFeedback(false, run)).toBe(
      'Not done yet: these project checks fail.\n\nCraft of the squares you changed:\ncarnival/booths/ana: untested',
    );
    expect(ran.at(-1)).toBe(
      'node scripts/craft/check-square.ts carnival/booths/ana carnival/booths/bo',
    );
  });
});

describe('touchedSquares', () => {
  it('finds only squares at the top of the tree', () => {
    const porcelain = [
      ' M docs/carnival/booths/ana/booth.ts',
      ' M docs/carnival/levels/bo/squares/hut/square.ts',
    ].join('\n');
    expect(touchedSquares(porcelain)).toEqual([]);
  });
});
