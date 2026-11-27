import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { checkCommands, checkScope, scopeOutput } from './square-check';

describe('checkScope', () => {
  it('checks just the booth or the level when only that folder changes', () => {
    expect(checkScope(['carnival/booths/ana/booth.ts', 'carnival/booths/ana/README.md'])).toBe(
      'booth/ana',
    );
    expect(
      checkScope(['carnival/levels/ana/level.ts', 'carnival/levels/ana/squares/x/square.ts', '']),
    ).toBe('level/ana');
  });

  it('checks everything when anything else changes, or two folders do', () => {
    for (const files of [
      ['carnival/booths/ana/booth.ts', 'carnival/levels/ana/level.ts'],
      ['carnival/booths/ana/booth.ts', 'carnival/booths/bo/booth.ts'],
      ['carnival/booths/ana/booth.ts', 'src/main.ts'],
      ['carnival/attractions/ferris-wheel/attraction.ts'],
      ['carnival/booths/README.md'],
      ['carnival/booths/Ana/booth.ts'],
      ['carnival/levels/-ana/level.ts'],
      ['package.json'],
      [],
    ])
      expect(checkScope(files), files.join(' ')).toBeUndefined();
  });

  it('reads each name without the space around it, and needs a file inside a folder', () => {
    expect(checkScope(['  carnival/booths/ana/booth.ts  '])).toBe('booth/ana');
    expect(checkScope(['north/booths/ana/booth.ts'])).toBeUndefined();
    expect(checkScope(['carnival/booths/ana'])).toBeUndefined();
  });

  it("prints the scope for git diff's list, or nothing for the full check", () => {
    expect(scopeOutput('carnival/levels/ana/level.ts\n')).toBe('level/ana\n');
    expect(scopeOutput('eslint.config.js\n')).toBe('');
  });
});

describe('checkCommands', () => {
  it('runs the house rules on the folder from the one config, never a config inside it', () => {
    const lint = checkCommands('booth/ana').find((command) => command[1] === 'eslint');
    expect(lint).toEqual([
      'npx',
      'eslint',
      '--config',
      'eslint.config.js',
      '--pass-on-unpruned-suppressions',
      'carnival/booths/ana',
    ]);
  });

  it('types the whole project, and tests the folder with the tests every square must pass', () => {
    const booth = checkCommands('booth/ana').map((command) => command.join(' '));
    expect(booth).toContain('npx tsc --noEmit');
    expect(booth).toContain('node scripts/strict-types.ts');
    expect(booth).toContain('npx knip');
    expect(booth.find((c) => c.startsWith('npx vitest'))).toContain(
      'carnival/booths/ana src/northpole/booths.test.ts scripts/square-code.test.ts',
    );
    const level = checkCommands('level/ana').map((command) => command.join(' '));
    expect(level.find((c) => c.startsWith('npx vitest'))).toContain(
      'carnival/levels/ana src/northpole/level.test.ts src/northpole/levels.test.ts',
    );
  });

  it('refuses a scope that is not one booth or level', () => {
    for (const scope of [
      'src/main',
      'booth/../src',
      'booth',
      'booth/Ana',
      'level/ana/x',
      'constructor/ana',
    ])
      expect(() => checkCommands(scope), scope).toThrow(
        `Not one booth's or level's folder: ${scope}`,
      );
  });

  it('is these commands, in this order, for a booth', () => {
    expect(checkCommands('booth/ana').map((command) => command.join(' '))).toEqual([
      'npx eslint --config eslint.config.js --pass-on-unpruned-suppressions carnival/booths/ana',
      'npx markdownlint-cli2 carnival/booths/ana/**/*.md',
      'node scripts/check-json.ts',
      'npx knip',
      'npx prettier --check carnival/booths/ana',
      'npx tsc --noEmit',
      'node scripts/strict-types.ts',
      'npx vitest run carnival/booths/ana src/northpole/booths.test.ts scripts/square-code.test.ts scripts/square-size.test.ts scripts/square-lint-reach.test.ts',
    ]);
  });

  it('is what the full check does too: the one ESLint config, never one in a folder', () => {
    const scripts = (
      JSON.parse(readFileSync(join(import.meta.dirname, '..', 'package.json'), 'utf8')) as {
        scripts: Record<string, string>;
      }
    ).scripts;
    expect(scripts.lint).toContain('eslint --config eslint.config.js');
  });
});

describe('CI with a folder-scoped check', () => {
  const ci = readFileSync(join(import.meta.dirname, '..', '.github/workflows/ci.yml'), 'utf8');

  it('skips the changed-lines coverage, which needs the full run and has nothing to measure', () => {
    expect(ci).toContain('echo "SQUARE_SCOPE=$scope" >> "$GITHUB_ENV"');
    expect(ci).toContain("if: github.event_name == 'pull_request' && env.SQUARE_SCOPE == ''");
  });

  it('still fetches the base for the baselines check, which runs on every pull request', () => {
    const step = ci.slice(ci.indexOf('- name: Baselines only shrink'));
    const run = step.slice(0, step.indexOf('\n      - '));
    expect(run).toContain('git fetch --no-tags --depth=1 origin "$BASE"');
  });
});
