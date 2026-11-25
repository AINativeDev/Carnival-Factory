# 0031. Level pull requests merge through the gate, like booths

- Status: Accepted
- Date: 2026-11-25
- Pull requests: #119
- Spec: [auto-merge-gate.md](../specs/auto-merge-gate.md),
  [levels.md](../specs/levels.md)

## Context

[0011](0011-levels-are-plain-data.md) had every level's pull request wait
for a maintainer, because the gate only knew booths. A level is the
participant's own folder, like a booth: plain data the page validates, and
squares that run sandboxed exactly like a booth's. Waiting for a person kept
level requests off the map for hours where a booth takes minutes.

## Decision

A pull request that changes only `carnival/levels/<owner>/`, for that
owner's accepted `level-request`, goes through the same gate as a booth's:
the request accepted, only the owner's folder, the static code check on
every one of its squares and plain data in its `level.ts`, the hidden-text
scan, every check, the code review, the risk and taste check on screenshots
of the level and each of its squares, no hold, and one merge per person an
hour. A level request is built by `implement-level`, whoever adds `tessl`.
This replaces the part of 0011 that says level pull requests wait for a
maintainer; the rest of 0011 stands.

## Alternatives considered

- **Keep levels waiting for a maintainer.** Rejected: nothing a level can
  do needs more judgement than a booth, and a person checking every level
  is the bottleneck the gate exists to remove.
- **A separate gate for levels.** Rejected: two gates drift apart. One gate
  with the folder and its code check chosen by the request's kind keeps one
  set of rules.

## Consequences

A level lands on its own in minutes, as a booth does. A pull request that
changes a level and anything else, its owner's booth included, still waits
for a person. A level's `level.ts` is checked twice, by ESLint in CI and by
the gate's own static check, so neither alone decides that it is plain data.
