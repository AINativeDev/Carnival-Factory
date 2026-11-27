# 0062. A little more slack for a square's frame on CI

- Status: Accepted
- Date: 2026-11-27
- Spec: [checks-and-tests.md](../specs/checks-and-tests.md)

## Context

The smoke test fails a booth or attraction whose slowest frame, after five
warm-up frames, takes longer than its budget: 8 ms on a laptop, 16 ms on CI,
whose browsers draw in software. On one day it failed three pull requests by
chance, each on a different square (a booth, the Studio, North Pole Night
Run), each at about 17 ms, while those squares draw in 1–2 ms on a laptop. The
budget measures a single frame, so one hiccup on the shared runner fails it,
and it blocks merges and can hold up a participant's booth request.

## Decision

CI's budget is 20 ms. A laptop's stays 8 ms.

## Consequences

A square has to be slower than about ten times a laptop's draw time on CI to
fail, so the check still catches a real slowdown, without failing on the
runner's speed. If it flakes again, the next step is to judge a square by a
high percentile of its frames rather than the single slowest.
