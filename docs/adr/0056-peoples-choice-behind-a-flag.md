# 0056. People's Choice waits behind a feature flag

- Status: Accepted
- Date: 2026-11-26
- Spec: [peoples-choice.md](../specs/peoples-choice.md), [ADR 0046](0046-launch-behind-feature-flags.md)

## Context

People's Choice, voting for booths with a 👍 on the ballot issue, is not
ready to show at the launch.

## Decision

A `peoplesChoice` flag, off on the live site, holds it back. `shownChoice()`
in `src/northpole/peoples-choice-standings.ts` gives the page no standings
while it's off, so the list below the map stays hidden, a booth's panel has
no ballot link and no stall wears a trophy. The deploy still counts the votes,
so switching the flag on shows them straight away.

## Consequences

Switching it on brings the list, the links and the trophies back unchanged.
