# 0024. Write the test first

- Status: Accepted
- Date: 2026-11-25
- Spec: [checks-and-tests.md](../specs/checks-and-tests.md)

## Context

Agents write most of the code here, fast, and tend to add tests afterwards that
mirror what they just wrote, which pass whatever the code does. A test written
first states the behaviour before the code exists, and fails until it's true.

## Decision

Map and tooling code is written test-first: a failing test for the behaviour,
then the code that makes it pass, then the tidy-up. A bug fix starts with a test
that reproduces the bug. Squares follow it for their pure logic.

The order can't be checked from a pull request, so what's checked is what it
leaves behind: changed lines have to be covered ([0025](0025-test-coverage.md)),
and the `review-craft` lens asks whether each change of behaviour has a test
that would have failed without it.

## Alternatives considered

- **Tests after, as long as they exist.** Rejected: after-the-fact tests mirror
  the code, so they rarely catch the bug.
- **Enforce the order from commit history.** Rejected: agents squash and amend,
  and the order of commits proves little.

## Consequences

Changes take a little longer to start and much less to review. A change of
behaviour without a failing-first test is a review finding.
