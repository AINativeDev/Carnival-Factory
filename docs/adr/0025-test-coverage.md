# 0025. 99% test coverage: new lines now, the whole codebase over time

- Status: Accepted, superseded in part by [0044](0044-coverage-per-file.md)
- Date: 2026-11-25
- Spec: [checks-and-tests.md](../specs/checks-and-tests.md)

## Context

The target is 99% coverage. Unit tests covered 38% of lines when this was decided:
most of the rest is drawing and page code (the renderer, the map, the HUDs, the
squares' `draw`), which only the end-to-end tests exercise.

## Decision

- **New and changed lines: 99% now.** `scripts/diff-coverage.ts` compares a pull
  request with its base and fails it when fewer than 99% of the added lines
  that hold statements ran under the unit tests.
- **The whole codebase: a ratchet to 99%.** The coverage thresholds in
  `vitest.config.ts` are the floor, and every run that beats them writes the
  new numbers back, so coverage only goes up.
- **Squares** in `carnival/` are left out of the changed-lines rule: the smoke
  test draws every one end to end, and their pure logic has unit tests.
- **Command-line glue** (a script's `if (process.argv...)` block, a hook's entry
  point) may be marked `v8 ignore`, since CI runs it for real. Nothing else is.

## Alternatives considered

- **A flat 99% gate today.** Rejected: it fails every change until hundreds of
  drawing functions have unit tests, which would stop all work.
- **Reach 99% by excluding hard files.** Rejected: that's a number, not coverage.
- **Count end-to-end coverage too.** Deferred: squares run in sandboxed workers,
  where collecting coverage is hard. Worth revisiting for the map's own code.

## Consequences

Every change to the map's code pays for its own tests, and the old code gains
them as it's touched or split ([0019](0019-small-files.md)).
