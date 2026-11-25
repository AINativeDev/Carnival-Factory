# 0019. Code files stay under 200 lines

- Status: Accepted
- Date: 2026-11-25
- Spec: [checks-and-tests.md](../specs/checks-and-tests.md)

## Context

Several files grew past a thousand lines (`render.ts` is 2,750). Agents read
whole files to change them, so large files cost time and tokens on every
change, hide unrelated code in the same diff, and make reviews shallow.

## Decision

A code file has at most 200 lines; a file that would grow past it is split by
concern. Lint enforces it on every code file, squares included. Files already
over the limit are listed in a baseline with their current length: they may
shrink but never grow, and each one is split in its own change until the
baseline is empty.

## Alternatives considered

- **Split all 41 oversize files at once.** Rejected: one huge, risky pull request
  across the map, the checks and participants' booths.
- **A softer limit, such as 400 lines.** Rejected: 200 keeps a file readable in
  one go, which is the point.
- **Only for new files.** Rejected: the largest files are the ones agents touch
  most.

## Consequences

The factory writes booths as several small files from the start. Until the
baseline is empty, it records the debt; a file leaving the baseline can't
come back.
