# 0016. Every rule we set is enforced, deterministically where we can

- Status: Accepted
- Date: 2026-11-25
- Spec: [checks-and-tests.md](../specs/checks-and-tests.md)

## Context

`AGENTS.md`, the skills and the docs set many rules: stay in your own folder,
no network in a square, plain data in a level, untrusted text through safe
paths. Agents and people follow written rules most of the time, not every
time, and the factory runs with no one watching. A rule that nothing checks
is a wish, and the first time it matters is usually the time it was skipped.

## Decision

When we set a rule, we also set what enforces it, in the same change.

1. **Deterministic first.** If a script, a lint rule, a test, a type, a
   setting or a policy can decide it, that is what enforces it: the same input
   always gives the same answer, it runs in CI, and it fails closed.
2. **Non-deterministic where judgement is needed.** Some rules can't be
   decided by a script: "family-friendly", "the README is true to the code",
   "no trick to get around the house rules". These are enforced by Tessl
   review lenses, verifiers and assessment skills, which read the change
   against the written rule and can block it.
3. **Both, for rules that matter most.** A deterministic check catches the
   plain cases every time; a reviewer catches the clever ones. Neither alone is
   enough for code that merges without a person.
4. **The enforcer is tested too.** A check that silently stops matching is
   worse than none, so checks get tests that prove they still fire on real
   files (for example, the guard in `scripts/square-lint.test.ts`).
5. **Gaps are written down.** A rule with no enforcer yet is listed below as a
   gap, not left implied.

## How the current rules are enforced

| Rule                                            | Deterministic                                                   | Non-deterministic                               |
| ----------------------------------------------- | --------------------------------------------------------------- | ----------------------------------------------- |
| A participant changes only their own folder     | `scripts/check-booth-ownership.ts`, the gate's scope check      |                                                 |
| Squares reach no network, storage or page       | ESLint house rules, `scripts/square-code.ts`, the sandbox's CSP | `review-house-rules` lens                       |
| Squares import only the map's public parts      | ESLint `no-restricted-imports`, `scripts/square-code.ts`        | `review-house-rules` lens                       |
| A level's `level.ts` is plain data              | ESLint `LEVEL_DATA` rules, `validateLevel`                      | `review-house-rules` lens                       |
| Squares fit the size budget                     | `scripts/square-size.ts` in tests and the gate                  |                                                 |
| Squares draw, stay quiet and don't flash        | Playwright smoke and flashing checks, WebKit included           |                                                 |
| No hidden text or instructions in a change      | `scripts/injection-scan.ts`                                     | Tessl Code Review, `assess-booth-risk`          |
| Requests are family-friendly and buildable      |                                                                 | `assess-booth-request`                          |
| Only maintainers steer the factory              | `tessl.json` sender-id filters, `MAINTAINERS`                   |                                                 |
| Booth changes merge only when everything agrees | `scripts/booth-gate.ts`, its tests                              | Tessl Code Review approval, `assess-booth-risk` |
| Workflow event data only through `env:`         |                                                                 | Tessl Code Review security lens                 |
| A square's README is true to its code           |                                                                 | Tessl Code Review                               |

## Known gaps

- **Specs and ADRs move with the code** ([0001](0001-record-decisions.md)):
  only reviewers check this today. A review lens for it would close the gap.
- **Workflow inputs through `env:`**: a script could check workflows for
  `${{ github.event` inside `run:`; today only review does.
- **Untrusted text on the page goes in as text**: lint could forbid
  `innerHTML` with anything but constants in `src/`; today only review does.

## Alternatives considered

- **Write the rules down and trust agents to follow them.** Rejected: they
  mostly do, and the factory merges unattended, so "mostly" isn't enough.
- **Only deterministic checks.** Rejected: many of the rules that matter are
  about content and intent, which a script can't judge.
- **Only AI review.** Rejected: it's probabilistic and can be argued with, so
  it can't be the only thing between a request and `main`.

## Consequences

A new rule costs a check, a test of the check, or a lens, and a pull request
that adds a rule without one is incomplete. Each spec's **Rules** section says
what enforces each rule. The gaps above are the next things to close.
