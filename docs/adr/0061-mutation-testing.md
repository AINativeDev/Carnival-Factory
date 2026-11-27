# 0061. Mutation testing holds the tests to catching changes

- Status: Accepted
- Date: 2026-11-27
- Spec: [checks-and-tests.md](../specs/checks-and-tests.md)

## Context

Every code file in `src/`, `scripts/` and `lint/` has 99% of its lines and
branches covered ([ADR 0044](0044-coverage-per-file.md)), but coverage only
says the code ran under a test, not that a test would notice it change. A
trial of Stryker on two well-covered files found the tests caught 84% and 91%
of small changes to them. The maintainer asked for mutation testing, raised
like coverage to a high standard, and chose 90% for new and changed code.

## Decision

- Stryker (`stryker.config.mjs`) mutates `src/`, `scripts/` and `lint/`, the
  files coverage holds, with the Vitest tests. The squares in `carnival/` stay
  out, as for coverage.
- A file's score is on covered code: the share of the changes the tests run
  that a test catches. Coverage already holds the code they don't run.
- A new or changed file needs 90%. On a pull request, CI mutates only the code
  files it changes (`node scripts/mutation-check.ts --changed`).
- Every older file below 90% is frozen at its debt, `100 - score`, in
  `lint/mutation-baseline.json`, which only shrinks
  (`scripts/baselines-shrink.ts`), like the strict-types baseline. A
  baseline new to the base branch starts as it is: only maintainers add one,
  since the list of baselines is in that script.
- `.github/workflows/mutation.yml` runs the whole of it every week, and on
  demand, against the baseline, and keeps the report. It runs as four parts in
  parallel, so each stays well inside a job's six hours on a standard runner
  (the whole takes about an hour on twelve workers), and each part keeps its
  results between runs (Stryker's incremental mode), so a quiet week retests
  only what changed.
- A change no test could ever catch, because the code behaves the same either
  way, is marked beside it with `// Stryker disable next-line <mutator>: <why>`.
- Changes to values set as a module loads (static mutants) are left out
  (`ignoreStatic`): each needs every test run again, about a seventh of the
  mutants but three quarters of the time. Coverage still holds that code.
- Stryker leaves `import.meta.glob` patterns alone
  (`lint/stryker-ignore-glob.mjs`): Vite needs them written out.

## Consequences

Tests have to check what the code does, not only run it. A pull request that
changes code in `src/`, `scripts/` or `lint/` takes a few minutes more in CI.
Changing an older file means bringing it to 90%.
