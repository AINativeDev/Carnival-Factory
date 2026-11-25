# 0014. What people make lives in `carnival/`, the map in `src/`

- Status: Accepted
- Date: 2026-11-25
- Pull requests: #130
- Spec: [squares-and-sandbox.md](../specs/squares-and-sandbox.md)

## Context

Booths, attractions, levels and challenges sat at the top level beside the
code, so it wasn't clear what belonged to participants and what was the system.

## Decision

`carnival/` holds everything people make; the map moved to `src/northpole/`
with the rest of the page. The HTML entry points stay at the root.

## Alternatives considered

- **Keep the folders at the top.** Rejected: the line between code and content
  wasn't visible.
- **Map under `carnival/`.** Rejected: the map is code, not something people make.
- **HTML into `public/`.** Rejected: Vite copies `public/` unprocessed, and these
  are build entry points.

## Consequences

Squares sit one folder deeper. Every check that finds squares by path must move
with them, so a guard test fails CI if the house rules stop reaching a square.
History still reads paths from before the move.
