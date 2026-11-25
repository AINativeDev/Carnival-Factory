# 0010. Plots stay put, and construction sites are never committed

- Status: Accepted
- Date: 2026-11-24
- Pull requests: #42, #106
- Spec: [construction-sites.md](../specs/construction-sites.md)

## Context

People share links to their booth and learn where it stands. Plots handed out
by folder order would move booths every time one was added. Between an accepted
request and the merge, nothing on the map showed a booth was coming.

## Decision

A plot number always means the same place, and a booth keeps its plot once it
has one. Booths being built are shown from build-time data, never committed:
the finished booth records the plot its site held.

## Alternatives considered

- **Commit a reservation when a request is accepted.** Rejected: it needs
  commits for requests that may never be built, and cleanup when they aren't.
- **Pin every booth by hand.** Rejected: it puts a maintainer back in the loop.

## Consequences

Reservations vanish with their requests. Two booths claiming one plot need a
rule, the lower issue number wins, which lives in the spec.
