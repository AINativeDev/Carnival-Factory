import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { safePath } from './safe-path';

const root = join(import.meta.dirname, '..');

afterEach(() => {
  vi.unstubAllEnvs();
});

describe('a path a script was given', () => {
  it('resolves inside the repository, or a temporary folder', () => {
    expect(safePath('public/pending.json')).toBe(join(root, 'public/pending.json'));
    expect(safePath(join(tmpdir(), 'advent.json'))).toBe(join(tmpdir(), 'advent.json'));
    expect(safePath('.')).toBe(root);
  });

  it('refuses one that climbs out, or an absolute one elsewhere', () => {
    expect(() => safePath('../../etc/passwd')).toThrow(/outside the repository/);
    expect(() => safePath('/etc/passwd')).toThrow(/outside the repository/);
    expect(() => safePath('public/../../x', [root])).toThrow(/outside the repository/);
  });

  it("uses the runner's temporary folder when the workflow names one", () => {
    const runner = join(root, 'test-results');
    expect(safePath(join(runner, 'x.json'), [runner])).toBe(join(runner, 'x.json'));
  });

  it("allows the runner's temporary folder by default when the workflow sets one, and not when it doesn't", () => {
    const runner = join(root, 'test-results');
    vi.stubEnv('RUNNER_TEMP', runner);
    expect(safePath(join(runner, 'x.json'))).toBe(join(runner, 'x.json'));
    vi.stubEnv('RUNNER_TEMP', undefined);
    expect(safePath(join(tmpdir(), 'x.json'))).toBe(join(tmpdir(), 'x.json'));
  });
});
