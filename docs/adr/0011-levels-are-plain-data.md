# 0011. A level is plain data plus sandboxed squares

- Status: Accepted
- Date: 2026-11-24
- Pull requests: #122
- Spec: [levels.md](../specs/levels.md)

## Context

A level is a whole patch of map that the page itself lays out and lets
visitors walk, so the page has to read its layout directly, outside the
sandbox.

## Decision

A level's layout is plain data only, enforced by lint and validated before
anything is drawn; its squares are ordinary sandboxed squares. Level pull
requests wait for a maintainer.

## Alternatives considered

- **Let a level's code build its layout.** Rejected: that code would run in
  the page.
- **Run the whole level in a sandbox like a square.** Rejected: walking,
  pathfinding and the HUD need the page's own map.

## Consequences

Levels can't compute their layout; everything is written out. A new prop or
tile kind is a change to the map's catalogue.
