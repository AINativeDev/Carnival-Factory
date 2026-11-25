# 0039. A level's coaster is ridden in the order its pieces are listed

- Status: Accepted
- Date: 2026-11-25
- Spec: [levels.md](../specs/levels.md)

## Context

The maintainer asked for The Factory to feel like a roller coaster: a ticket,
the visitor's request, riding from one loop to the next past every stall. A
level is plain data ([ADR 0035](0035-north-pole-levels.md)), each prop is a
thing the map draws on its own at its depth, and a prop's footprint is fixed
in the catalogue, so a ride has to be built from props without any code in
the level.

## Decision

A coaster is laid from two 1 by 1 props, `coaster` (a tile of track on a
post, which people walk under) and `coaster-loop` (a loop-the-loop on an
A-frame, which blocks its tile). The ride is the order the level lists them
in: `rideCoaster` in `src/northpole/coaster-ride.ts` gives each piece where
the ticket comes on and goes off, halfway to its neighbours, and when, from a
fixed time per straight tile and per loop. Each piece draws the ticket only
while it's riding that piece, so the ticket is drawn at the right depth, and
corners need no piece of their own. `validateLevel` checks that each piece
joins the one listed before it and that every loop is on a straight run.

## Alternatives considered

- **A `ride` route of waypoints on the level, drawn by the map.** Turned
  down: it needs its own placement checks, and one drawing for the whole
  track can't sit at the right depth among the stalls.
- **Longer straight pieces, 1 by 3 or 3 by 1.** Turned down: a fixed length
  rarely fits the run between two loops, and corners would need pieces of
  their own.
- **Each piece timed by its `variant`.** Turned down: the owner would have to
  work out every piece's time by hand, and one slip would make the ticket
  jump.

## Consequences

A coaster takes one line of level data per tile, and a level has one coaster.
The ride's length follows its track, about 0.4 seconds a tile and 1.8 seconds
a loop, so every coaster runs at the same calm pace.
