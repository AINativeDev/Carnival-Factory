# 0029. Squares meet the code conventions too, and show it

- Status: Accepted
- Date: 2026-11-25
- Spec: [booth-craft.md](../specs/booth-craft.md)

## Context

The map's own code is held to small files, tests, doc comments and clear names
(0019, 0023, 0024). Booths and levels are code too, written by the factory, and
the first ones predate those rules: every booth's `booth.ts` is between 318 and
943 lines. Holding a booth's pull request to them would slow the path from
request to map, which participants feel most.

## Decision

- One deterministic craft check, `scripts/craft/`, judges a square on four
  conventions: small files, a real test, a README and doc comments on what it
  exports, and clear names. Each one met is a badge.
- The factory and the agent hooks run it while a square is being built, so a
  new booth is already good when its pull request opens: the booth and level
  instructions run it before finishing, and the Stop hook runs it on every
  square the agent changed.
- It doesn't gate the merge: a booth with fewer badges still goes on the map,
  and its panel shows only the badges it earned, never a mark against it.
- The older squares are brought up to it by maintainer issues, one per square,
  without changing what they draw.

## Alternatives considered

- **Gate booth merges on it.** Rejected: it would slow every booth for
  something that doesn't affect what visitors see.
- **Judge craft with a model.** Kept for later, after merge and never blocking:
  whether a name or comment says why needs judgement, and a script only catches
  the plain cases.
- **Show failing marks.** Rejected: a participant's work is on public display,
  so the panel celebrates what was earned.

## Consequences

The checks must stay quick and deterministic, since they run inside every build.
A convention added here applies to every square, old ones included, and shows up
as a badge they haven't earned yet.
