# 0031. Changed lines need their branches tested too

- Status: Accepted
- Date: 2026-11-25
- Spec: [checks-and-tests.md](../specs/checks-and-tests.md)

## Context

[0025](0025-test-coverage.md) holds the lines a pull request adds to 99%
coverage. A line can run and still hide an untested side: the `else` no test
reached, the fallback after a `??` that never fired. Those are where bugs wait.

## Decision

`scripts/diff-coverage.ts` also counts the branch arms that start on added lines
in `src/`, `scripts/` and `lint/`, and fails the pull request below 99%, naming
each arm no test took. Line coverage keeps its own 99%.

To make the rest of the codebase reach the same bar, files are split and pinned
before they're refactored: `src/test-support/recording-canvas.ts` records every
canvas call a drawing makes, so a test written first can pin a drawing by its
fingerprint and prove a split draws exactly the same.

## Alternatives considered

- **Lines only.** Rejected: it lets half-tested conditions through at 100%.
- **Whole files to 99% whenever touched.** Rejected for now: a one-line fix to a
  2,750-line file would have to test all of it. The file-by-file issues do that
  work deliberately instead.

## Consequences

Pull requests need a test for each side of every new condition. Code that
can't sensibly be tested still has only the `v8 ignore` marks 0025 allows, for
command-line entry points.
