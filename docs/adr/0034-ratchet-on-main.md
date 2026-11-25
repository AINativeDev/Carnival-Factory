# 0034. The coverage floor is raised on main, not in pull requests

- Status: Accepted
- Date: 2026-11-25
- Spec: [checks-and-tests.md](../specs/checks-and-tests.md)

## Context

The coverage floor in `vitest.config.ts` was a ratchet that every test run
raised and wrote back ([0025](0025-test-coverage.md)). So every pull request
that added tests also changed the same few lines, and nearly every merge
conflicted there: five times in one afternoon.

## Decision

- Every run is still held to the floor: coverage can't fall in any pull request.
- Only `npm run coverage:ratchet` (`RATCHET=1`) raises it. A maintainer runs it
  on `main` from time to time and commits the higher floor in a small pull
  request of its own. Pull requests never raise it.

## Alternatives considered

- **Keep raising it in every pull request.** Rejected: constant conflicts on one
  line, resolved by hand each time.
- **A workflow that raises it on main after each merge.** Rejected for now:
  pull requests opened by the workflow's own token don't trigger CI, so its
  change couldn't pass the required checks without a token we'd rather not add.

## Consequences

The floor trails real coverage by however long it's been since the last
ratchet, so a pull request could lower coverage down to the floor unnoticed.
The 99% rule on changed lines and branches still holds every new line
([0031](0031-changed-branches-too.md)), so that slack can only come from code
deleted or tests removed.
