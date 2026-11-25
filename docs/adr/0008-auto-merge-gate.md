# 0008. Booth changes merge on their own behind a strict gate

- Status: Accepted
- Date: 2026-11-24
- Pull requests: #48, #59, #60, #99, #100
- Spec: [auto-merge-gate.md](../specs/auto-merge-gate.md)

## Context

Waiting for a maintainer to review every booth made the event depend on one
person being online. Booth changes stay inside one folder and run sandboxed,
which makes them low-stakes enough to merge without a person when every
check agrees.

## Decision

A gate merges a factory pull request for one booth only when every check
passes on the exact commit, including an AI review and a risk assessment;
any doubt sends it to a maintainer. The gate runs `main`'s own code and never
checks out the pull request. Levels and everything else wait for a person.

## Alternatives considered

- **A maintainer merges everything.** Rejected: the bottleneck this removes.
- **Merge on green CI alone.** Rejected: CI can't judge content or intent.
- **Run the gate from the pull request's branch.** Rejected: the pull request
  could rewrite its own gate.

## Consequences

Unattended merges rest on every check failing closed, which is why a guard
test fails CI if the house rules stop reaching a square. A per-person hourly
limit, a daily digest and the kill switch bound what can slip through.
