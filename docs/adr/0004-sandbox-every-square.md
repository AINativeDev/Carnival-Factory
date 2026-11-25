# 0004. Run every square in a sandboxed frame and worker

- Status: Accepted
- Date: 2026-11-24
- Pull requests: #28
- Spec: [squares-and-sandbox.md](../specs/squares-and-sandbox.md)

## Context

Squares are code an agent wrote from a stranger's request, and can merge
without a person reading them ([0008](0008-auto-merge-gate.md)). Lint and
review catch the plain ways out, not every one. In the page, one bad square
could read the page, reach the network or hang the map for everyone.

## Decision

The page never runs a square's code. Each square runs in its own sandboxed
iframe with an opaque origin and a no-network content security policy, inside a
worker the frame can stop, and sends the map bitmaps.

## Alternatives considered

- **Run squares in the page, behind lint and review.** Rejected: static checks
  can be outwitted, and the page holds everything.
- **Draw on the server and ship images.** Rejected: squares are animated and
  interactive, and the site is static hosting.
- **One shared sandbox for all squares.** Rejected: one square could then
  break or spy on the others.

## Consequences

Squares get an offscreen context and no DOM, by design. Each costs a frame and
a worker, so the map wakes only squares in view. Anything a square tells the map
travels as a checked message.
