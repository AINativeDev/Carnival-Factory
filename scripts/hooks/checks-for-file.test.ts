/**
 * The exact command each kind of file gets when an agent writes it, the same
 * CI runs (docs/adr/0022-lint-everything-on-edit.md).
 */
import { describe, expect, it } from 'vitest';
import { editFeedback } from './check-edited-file';
import { checksForFile, type Check } from './checks-for-file';

const commands = (file: string) =>
  checksForFile(file).map((check: Check) =>
    [check.name, check.command, ...check.args, check.optional ? '(optional)' : ''].join(' ').trim(),
  );

describe('checksForFile', () => {
  it('lints, formats and type-checks map code', () => {
    expect(commands('src/a.ts')).toEqual([
      'ESLint npx eslint --prune-suppressions src/a.ts',
      'Prettier npx prettier --check src/a.ts',
      'TypeScript node scripts/strict-types.ts',
    ]);
  });

  it('lints and formats a Markdown or JSON file', () => {
    expect(commands('docs/a.md')).toEqual([
      'markdownlint npx markdownlint-cli2 docs/a.md',
      'Prettier npx prettier --check docs/a.md',
    ]);
    expect(commands('a.json')).toEqual([
      'JSON node scripts/check-json.ts a.json',
      'Prettier npx prettier --check a.json',
    ]);
  });

  it('checks shell scripts and workflows with tools that may not be installed', () => {
    expect(commands('setup.sh')).toEqual(['ShellCheck shellcheck setup.sh (optional)']);
    expect(commands('.github/workflows/ci.yaml')).toEqual([
      'actionlint actionlint .github/workflows/ci.yaml (optional)',
      'Prettier npx prettier --check .github/workflows/ci.yaml',
    ]);
  });

  it('only formats YAML outside the workflows folder', () => {
    expect(commands('docs/.github/workflows/ci.yml')).toEqual([
      'Prettier npx prettier --check docs/.github/workflows/ci.yml',
    ]);
    expect(commands('a.yaml')).toEqual(['Prettier npx prettier --check a.yaml']);
  });

  it('checks nothing whose name only contains a known kind', () => {
    expect(commands('.github/workflows/ci.yml.orig')).toEqual([]);
    expect(commands('src/style.css.map')).toEqual([]);
  });
});

describe('editFeedback', () => {
  const failing = () => ({ status: 1, stdout: 'bad', stderr: '' });

  it('gives every failing check’s output, a blank line apart', () => {
    expect(editFeedback('/repo/docs/a.md', '/repo', failing).problem).toBe(
      "docs/a.md breaks the repository's rules. Fix it before going on:\n\nmarkdownlint:\nbad\n\nPrettier:\nbad",
    );
  });

  it('leaves installed packages alone', () => {
    expect(editFeedback('/repo/node_modules/x/a.ts', '/repo', failing)).toEqual({});
  });
});
