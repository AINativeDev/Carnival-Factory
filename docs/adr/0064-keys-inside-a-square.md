# 0064. A square hears the arrows, Enter and Space while someone is inside

- Status: Accepted
- Date: 2026-11-28
- Spec: [squares-and-sandbox.md](../specs/squares-and-sandbox.md)

## Context

A square could only be played with the mouse or a finger. The maintainer
wants the Factory's tour to step on and back with the keys, and a step-by-step
explainer, or a game, is natural to drive from a keyboard. A square runs
sandboxed and never sees the page's own events, so keys must reach it the way
taps do: as plain values the map collects, the frame checks and the worker
passes on.

## Decision

- `draw(ctx, size, time, pointer?, keys?)`: `keys` lists the keys pressed
  since the square's last frame, in order, by plain names: `left`, `right`,
  `up`, `down`, `enter` and `space` (`src/northpole/square-keys.ts`).
- The map hears them only while the player is inside a square, and then the
  arrows, Enter and Space are the square's: they no longer walk the player or
  scroll the page. Enter on the panel's own buttons and links stays theirs,
  and Escape still leaves. A key never carries over to the next square
  visited.
- At most eight keys go with a frame; any more wait for the next one. The
  frame and the worker each keep only a list of those names (`readKeys`), and
  anything else is dropped. On the map, outside, no square hears a key.

## Consequences

Booths, attractions and level squares can be played from the keyboard while
someone is inside, with no way to read any other key or the page's events. A
square that ignores `keys` is unchanged.
