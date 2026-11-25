# 0020. Oxlint replaces ESLint

- Status: Accepted
- Date: 2026-11-25
- Spec: [checks-and-tests.md](../specs/checks-and-tests.md)

## Context

ESLint with typescript-eslint is the slowest part of `npm run check`, and the
house rules run on every edit an agent makes. Oxlint runs the same kinds of
rules many times faster and supports the ones the house rules rely on.

## Decision

Oxlint is the only linter. The house rules move to `.oxlintrc.json`: restricted
globals, properties and imports, no eval, the size limit. Anything Oxlint can't
express natively, such as the plain-data rule for `level.ts`, moves to an Oxlint
JS plugin or to a deterministic script check, never dropped. The guard tests that
prove every rule still reaches every real square run Oxlint.

## Alternatives considered

- **Keep ESLint.** Rejected: slower on every edit, for the same rules.
- **Oxlint for speed, ESLint for the house rules.** Rejected: two linters to keep
  in step, and the rules that matter most on the slow path.

## Consequences

The house rules are security checks for code that merges unattended
([0008](0008-auto-merge-gate.md)), so the move is only done when every
red-team case in the lint tests still fails and every real square still passes.
