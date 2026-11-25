# 0013. Smoke-test only the changed booth on a booth pull request

- Status: Accepted
- Date: 2026-11-24
- Pull requests: #110
- Spec: [checks-and-tests.md](../specs/checks-and-tests.md)

## Context

The smoke test played every square one by one, about three and a half minutes,
the slowest step for every booth.

## Decision

A pull request that changes only one booth's folder plays only that booth's
per-square tests; map-wide tests still run with every square. Anything else
runs everything.

## Alternatives considered

- **Always run everything.** Rejected: minutes per booth, for squares that
  didn't change.
- **Run nothing per square for booths.** Rejected: the changed booth's own run
  is the check that matters.

## Consequences

A booth's smoke run takes about a minute. A change outside one booth always gets
the full run.
