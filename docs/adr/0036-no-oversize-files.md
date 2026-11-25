# 0036. No code file over 200 lines, with no exceptions

- Status: Accepted
- Date: 2026-11-25
- Spec: [checks-and-tests.md](../specs/checks-and-tests.md)

## Context

[ADR 0019](0019-small-files.md) set the 200-line limit and held the files
already over it in a baseline at their length, to be split one change at a
time. The baseline still had twenty files, the largest `render.ts` at 2,573
lines, and the maintainer asked for no exceptions.

## Decision

Every oversize file was split by concern, each drawing pinned first with
`drawingOf` and `fingerprint` so the split was shown to draw the same. The
baseline file is deleted, and lint holds every code file, squares included,
to 200 lines with no list of exceptions to add to.

## Alternatives considered

- **Keep the empty baseline file.** Rejected: an empty list invites the first
  exception; without it, a file over the limit fails lint and there is no
  number to raise.
- **Carry on splitting one file per change.** Rejected: the debt stayed, and
  the largest files were the ones every change touched.

## Consequences

A change that would take a file past 200 lines splits it in the same change.
The map's drawing and walking are now many small modules, each with a header
saying which part of the carnival it draws or runs.
