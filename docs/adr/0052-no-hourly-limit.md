# 0052. No hourly limit on a person's booth merges

- Status: Accepted
- Date: 2026-11-26
- Spec: [auto-merge-gate.md](../specs/auto-merge-gate.md)
- Supersedes: the hourly limit in [0008](0008-auto-merge-gate.md)

## Context

[ADR 0008](0008-auto-merge-gate.md) let at most one booth change per person
merge on its own each hour, as one of the bounds on what can slip through.
The gate has grown since: the risk check judges every change from its
screenshot, Tessl Code Review approves it, the hidden-text and static code
checks read it, and only the booth's own folder can change. In end-to-end
tests a participant's second request, made minutes after the first landed,
passed everything and then sat waiting for the hour, which reads as the
factory being slow rather than careful.

## Decision

The gate drops its **One at a time** step. A person's booth changes merge one
after another as each passes every other step. The daily digest, the kill
switch and `needs-human` stay as the bounds on what merges.

## Alternatives considered

- **A shorter window.** Rejected: any wait still shows as a stalled request,
  and no check runs during it.
- **Keep the limit.** Rejected: it held no change for anything the other
  steps hadn't already judged.

## Consequences

Someone who asks for many changes gets each one on the map as fast as the
checks pass. Each still goes through every check and shows in the digest.
