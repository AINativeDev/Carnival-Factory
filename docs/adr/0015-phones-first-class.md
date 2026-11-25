# 0015. Phones get the same map, with touch of their own

- Status: Accepted
- Date: 2026-11-24
- Pull requests: #56, #118, #125, #127, #129
- Spec: [mobile.md](../specs/mobile.md)

## Context

Most people open a shared link on a phone. The map is a canvas built for a
mouse and keys, and the browser's own scrolling and zooming fight with a
canvas you walk around.

## Decision

One page for every screen. On a phone the map takes its touch itself: a tap
walks or opens, a finger drags the island, two fingers pinch the zoom, and
panels sit below the map. Phones are tested in WebKit, the engine every iPhone
browser uses, as well as at phone width in Chromium.

## Alternatives considered

- **A separate phone view.** Rejected: two maps to keep in step.
- **Leave scrolling and zoom to the browser.** Rejected: dragging the page and
  walking the map fought each other.
- **Test phones by emulating a size in Chromium only.** Rejected after every
  square broke on iPhones while those tests passed.

## Consequences

The canvas turns off the browser's own touch handling, so the map must provide
every gesture people expect. Pinched in far, cached layers look a little soft,
which keeps phones' memory down.
