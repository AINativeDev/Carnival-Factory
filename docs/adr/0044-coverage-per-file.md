# 0044. Every file holds 99% coverage, with no exceptions

- Status: Accepted
- Date: 2026-11-25
- Spec: [checks-and-tests.md](../specs/checks-and-tests.md)
- Supersedes: [0034](0034-ratchet-on-main.md), and the "over time" half of [0025](0025-test-coverage.md)

## Context

[ADR 0025](0025-test-coverage.md) set 99% for new lines at once and for the
whole codebase over time, and [ADR 0034](0034-ratchet-on-main.md) raised a
whole-repository floor on main as coverage climbed. The floor stood at 87% of
lines, with 72 files in `src/`, `scripts/` and `lint/` below 99%, and a
well-tested file could hide one that wasn't. The maintainer asked for coverage
to be as strict as file size ([ADR 0036](0036-no-oversize-files.md)).

## Decision

Every one of those files was brought to 99% or more by writing the missing
tests, with command-line entry points kept thin and only they left out of the
count. Vitest now checks 99% of lines, branches, functions and statements for
each file in `src/`, `scripts/` and `lint/` on its own (`perFile`), and the
ratchet and its whole-repository floor are gone. Squares in `carnival/` are
participants' own and are played end to end by the browser tests, so they
count in the combined coverage of [ADR 0032](0032-browser-coverage-counts.md)
instead.

## Alternatives considered

- **Keep the ratchet.** Rejected: an average can rise while a file falls, and
  raising it needs a step on main.
- **100%.** Rejected for now: 99% leaves room for a line a test runner can't
  attribute, while still failing any file that skips its tests.
- **Hold carnival squares to it too.** Rejected: a booth's folder is its
  owner's, so maintainers can't add tests there; the browser tests cover them.

## Consequences

A change that leaves a file under 99% fails `npm test`, wherever the file is,
not only on the lines it changed. There is no floor to raise and no baseline.
