# 0050. The risk check starts when the smoke test passes

- Status: Accepted
- Date: 2026-11-26
- Spec: [booth-requests.md](../specs/booth-requests.md)

## Context

`assess-booth-risk` judges a booth's drawing from the smoke test's
screenshot, and the gate merges a booth only on its `low-risk`. It used to
start whenever any group of GitHub Actions checks on a `tessl/` pull request
passed, which is about two minutes in, while the smoke test takes fifteen or
more. It waited ten minutes for the screenshot, then said `needs-human`, and
the runs that came after it saw that verdict for the same commit and stopped.
An end-to-end test of a simple booth request stopped for a person this way.
Each finished group of checks also started another `shepherd` and another
risk run: five and four for one pull request.

## Decision

- `assess-booth-risk` and the shepherd's "checks passed" run start once,
  when the Preview build's `smoke` job passes (`github:check_run.completed`
  with `event.check_run.name` `smoke`).
- A risk run that finds the smoke test for the head commit not yet passed
  ends without a verdict. `needs-human` stays for real doubt, and for a
  passed smoke run with no screenshot.

## Alternatives considered

- **A longer wait inside the skill.** Rejected: it spends agent time waiting,
  and the smoke test's length changes.
- **Start on the last check suite.** Rejected: GitHub doesn't say which suite
  is last; the smoke job is the one the skill needs.

## Consequences

A simple booth request goes from issue to merge without a person in about
the smoke test's time. A failed smoke test starts no risk run, and a fixed
push starts one when its smoke test passes.
