# 0032. Browser tests count towards coverage, line by line

- Status: Accepted
- Date: 2026-11-25
- Spec: [checks-and-tests.md](../specs/checks-and-tests.md)

## Context

The goal is 99% coverage ([0025](0025-test-coverage.md)). Unit tests alone
covered 46% of lines, but most of what they missed is drawing and page code
(`render.ts`, `map.ts`, the panels) that the Playwright smoke tests run on every
pull request without it counting anywhere. The real gaps were hidden among
code that is in fact exercised.

## Decision

- The smoke tests record Chromium's JavaScript coverage of the page's own
  scripts (`smoke/coverage.ts`) when `COVERAGE=1`, against a build with source
  maps and no minifying.
- `scripts/e2e-coverage/report.ts` maps it back onto the source files and adds
  it to the unit tests' report **line by line**: a line counts as covered if
  either kind of test ran it. It lists the files with the most untested lines.
- The combined line coverage has its own floor,
  `lint/combined-coverage-floor.json`, in whole points, which only rises. CI
  checks it after every full smoke run; a booth-only run is reported, not held.
- Branch coverage stays as the unit tests measure it, with 99% required of new
  branches ([0031](0031-changed-branches-too.md)).

## Alternatives considered

- **Merge statements and branches too.** Rejected: the unit run and the browser
  bundle split the same code into differently shaped statements and branches,
  so merging them counts one piece of code twice. Lines are the measure both
  agree on. Measured on the first run: lines 77%, but merged statements 60%.
- **Unit-test every drawing function instead.** Still the plan where it adds
  meaning (pinning a drawing before a split), not as a way to raise a number.
- **Record the squares' own frames and workers.** Deferred: they run sandboxed
  in other processes. Their logic has unit tests; their drawing is checked by
  the smoke test and the flashing check.

## Consequences

The first combined run measured 77% of lines. The gaps it lists, the gate's
runner first, become the next issues. Smoke runs in CI take a little longer to
record coverage. The floor is only as good as the smoke tests: a test that's
removed can lower it, and the floor will say so.
