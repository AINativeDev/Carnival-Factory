# 0043. Level requests merge on their own, behind the booth gate

- Status: Accepted
- Date: 2026-11-26
- Issue: #119
- Supersedes in part: [0011](0011-levels-are-plain-data.md), its line that
  level pull requests wait for a maintainer
- Spec: [auto-merge-gate.md](../specs/auto-merge-gate.md),
  [levels.md](../specs/levels.md),
  [booth-requests.md](../specs/booth-requests.md)

## Context

A booth request goes from the form to the map on its own: the auto-merge gate
merges its pull request once every check passes. A level request was built
the same way, then always waited for a maintainer (ADR 0011), so a
participant's level sat finished until someone looked. A level is plain data
the page reads, checked by ESLint and `validateLevel`, plus squares that each
run sandboxed like a booth, so the same checks can judge it. The maintainer
decided on #119 that level requests merge on their own, behind the same gate
as booths.

## Decision

The auto-merge gate takes a factory pull request built from a
`level-request` exactly as it takes a booth's. It merges when the request
was accepted and only `carnival/levels/<owner>/` changes, and when the same
checks pass: the static code check and the hidden-text check on every
square, a `level.ts` that holds only plain data, CI, the smoke test scoped to
that level's walk or ride, the flashing check, Tessl Code Review approving,
and `assess-booth-risk` saying `low-risk` after reading the level's
screenshots and each of its squares'. Anything else waits, or gets
`needs-human`, as for booths. A level that fails `validateLevel` fails
`check`, so it never merges.

The North Pole's own levels (`NORTH_POLE_LEVELS`) never merge on their own,
even for a login that matches one: only maintainers change them.

A `level-request` that a maintainer labels `tessl` goes to the level builder,
`implement-level`, as one the assessment accepts does, not to the general
`implement` action.

## Alternatives considered

- **Keep levels waiting for a maintainer.** Rejected: a level is the bigger
  reward, and it would always be the slower one, for checks that already
  judge every part of it.
- **A gate of its own for levels.** Rejected: two gates would drift apart.
  One gate with a kind keeps one set of rules and one checklist.

## Consequences

A level pull request that also touches its owner's booth, or anything else,
goes to a person. A level change, like a booth change, merges as soon as it
passes, with no waiting time ([ADR 0052](0052-no-hourly-limit.md)). The risk check has more to look at for a level, one screenshot per
square, and the smoke scope must keep walking a single level when only its
folder changes.
