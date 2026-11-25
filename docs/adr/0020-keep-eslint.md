# 0020. Keep ESLint for code, rather than move to Oxlint

- Status: Accepted
- Date: 2026-11-25
- Spec: [checks-and-tests.md](../specs/checks-and-tests.md)

## Context

The house rules in `eslint.config.js` are the security checks for squares that
merge without a person ([0008](0008-auto-merge-gate.md)): restricted globals,
properties and imports, no `import()` or string timers, and plain data in a
level's `level.ts`. Oxlint was considered as a faster replacement, since lint
also runs on every agent edit ([0022](0022-lint-everything-on-edit.md)).

Measured on this repository: ESLint lints everything in 2.4 s and one file in
0.6 s; Oxlint 1.95 lints everything in 0.25 s.

## Decision

Keep ESLint as the only code linter. It also enforces the file size limit
([0019](0019-small-files.md)) with `max-lines`.

## Alternatives considered

- **Move to Oxlint.** Rejected: its regex engine has no look-ahead, which the
  import allow-list needs, and it has no `no-restricted-syntax`, which the
  plain-data and `import()` rules need. Both would move into a custom JS plugin,
  an API that is still alpha and not covered by semver, for the checks that
  matter most. The speed gain is under a second per edit at this size.
- **Oxlint for general rules, ESLint for the house rules.** Rejected: two
  linters to keep in step for a gain no one would notice.

## Consequences

Revisit if lint time grows past a few seconds per file, or once Oxlint's JS
plugins are stable and it supports the house rules' patterns natively; the
guard tests in `scripts/square-lint.test.ts` would show whether a move kept
every rule.
